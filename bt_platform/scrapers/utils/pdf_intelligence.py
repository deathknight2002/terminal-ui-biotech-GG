"""
PDF Intelligence Module

Extract trial IDs, phases, endpoints, regulatory tokens from PDF attachments.
"""

import re
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass
import io


@dataclass
class TrialData:
    """Extracted clinical trial data from PDF"""
    trial_ids: List[str]
    phases: List[str]
    endpoints: List[str]
    indications: List[str]
    targets: List[str]
    modalities: List[str]
    regulatory_tokens: List[str]
    success_rate: float  # Percentage of fields successfully extracted


class PDFIntelligence:
    """
    Extract structured trial data from PDFs.
    
    Note: This is a text-based extraction approach that doesn't require
    external PDF libraries. For production, consider using PyPDF2 or pdfplumber.
    """
    
    # Regular expressions for extraction
    TRIAL_ID_PATTERN = re.compile(
        r'\b(NCT\d{8}|ACTRN\d{14}|EUCTR\d{4}-\d{6}-\d{2}|ISRCTN\d{8})\b',
        re.IGNORECASE
    )
    
    PHASE_PATTERN = re.compile(
        r'\b(Phase\s+(?:I{1,3}|IV|1|2|3|4|I/II|II/III)(?:\s*[/-]\s*(?:I{1,3}|IV|1|2|3|4))?)\b',
        re.IGNORECASE
    )
    
    ENDPOINT_KEYWORDS = [
        'primary endpoint',
        'secondary endpoint',
        'overall survival',
        'progression-free survival',
        'overall response rate',
        'complete response',
        'partial response',
        'objective response rate',
        'disease control rate',
        'time to progression',
        'duration of response',
        'safety',
        'tolerability',
        'pharmacokinetics',
        'pharmacodynamics',
    ]
    
    INDICATION_KEYWORDS = [
        'cancer',
        'oncology',
        'melanoma',
        'lymphoma',
        'leukemia',
        'carcinoma',
        'sarcoma',
        'glioblastoma',
        'multiple myeloma',
        'diabetes',
        'alzheimer',
        'parkinson',
        'rheumatoid arthritis',
        'crohn\'s disease',
        'ulcerative colitis',
        'psoriasis',
        'asthma',
        'copd',
    ]
    
    REGULATORY_TOKENS = [
        'FDA approval',
        'EMA approval',
        'MHRA approval',
        'breakthrough therapy',
        'fast track',
        'priority review',
        'accelerated approval',
        'orphan drug',
        'rare disease',
        'PDUFA',
        'AdCom',
        'NDA',
        'BLA',
        'IND',
        'CRL',
        'complete response letter',
    ]
    
    TARGET_PATTERN = re.compile(
        r'\b([A-Z]{2,}[0-9]{0,2}(?:-[A-Z]{1,3})?)\s+(?:inhibitor|agonist|antagonist|antibody|blocker)\b',
        re.IGNORECASE
    )
    
    MODALITY_KEYWORDS = [
        'small molecule',
        'monoclonal antibody',
        'mAb',
        'bispecific',
        'ADC',
        'antibody-drug conjugate',
        'CAR-T',
        'cell therapy',
        'gene therapy',
        'RNA therapy',
        'peptide',
        'vaccine',
        'oncolytic virus',
    ]
    
    def extract_from_text(self, text: str) -> TrialData:
        """
        Extract trial data from PDF text.
        
        Args:
            text: Extracted text from PDF
            
        Returns:
            TrialData object with extracted information
        """
        # Normalize text
        text = self._normalize_text(text)
        
        # Extract each field
        trial_ids = self._extract_trial_ids(text)
        phases = self._extract_phases(text)
        endpoints = self._extract_endpoints(text)
        indications = self._extract_indications(text)
        targets = self._extract_targets(text)
        modalities = self._extract_modalities(text)
        regulatory_tokens = self._extract_regulatory_tokens(text)
        
        # Calculate success rate
        fields_extracted = sum([
            bool(trial_ids),
            bool(phases),
            bool(endpoints),
            bool(indications),
            bool(targets),
            bool(modalities),
            bool(regulatory_tokens),
        ])
        success_rate = (fields_extracted / 7.0) * 100
        
        return TrialData(
            trial_ids=trial_ids,
            phases=phases,
            endpoints=endpoints,
            indications=indications,
            targets=targets,
            modalities=modalities,
            regulatory_tokens=regulatory_tokens,
            success_rate=success_rate,
        )
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for extraction"""
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Remove page numbers and headers/footers
        lines = text.split('\n')
        filtered_lines = []
        for line in lines:
            # Skip lines that are just numbers (page numbers)
            if line.strip().isdigit():
                continue
            filtered_lines.append(line)
        
        return '\n'.join(filtered_lines)
    
    def _extract_trial_ids(self, text: str) -> List[str]:
        """Extract clinical trial IDs"""
        matches = self.TRIAL_ID_PATTERN.findall(text)
        return list(set(matches))  # Remove duplicates
    
    def _extract_phases(self, text: str) -> List[str]:
        """Extract trial phases"""
        matches = self.PHASE_PATTERN.findall(text)
        
        # Normalize phase names
        normalized = []
        for match in matches:
            # Convert to standard format
            phase = match.replace('Phase ', '').strip()
            normalized.append(f'Phase {phase}')
        
        return list(set(normalized))
    
    def _extract_endpoints(self, text: str) -> List[str]:
        """Extract clinical endpoints"""
        text_lower = text.lower()
        
        endpoints = []
        for keyword in self.ENDPOINT_KEYWORDS:
            if keyword in text_lower:
                # Extract surrounding context
                context = self._extract_context(text, keyword, window=50)
                endpoints.append(context)
        
        return endpoints[:10]  # Limit to 10 endpoints
    
    def _extract_indications(self, text: str) -> List[str]:
        """Extract disease indications"""
        text_lower = text.lower()
        
        indications = []
        for keyword in self.INDICATION_KEYWORDS:
            if keyword in text_lower:
                indications.append(keyword.title())
        
        return list(set(indications))
    
    def _extract_targets(self, text: str) -> List[str]:
        """Extract drug targets"""
        matches = self.TARGET_PATTERN.findall(text)
        
        # Filter out common false positives
        filtered = []
        for match in matches:
            if len(match) >= 3 and match not in ['THE', 'AND', 'FOR']:
                filtered.append(match)
        
        return list(set(filtered))[:10]  # Limit to 10 targets
    
    def _extract_modalities(self, text: str) -> List[str]:
        """Extract drug modalities"""
        text_lower = text.lower()
        
        modalities = []
        for keyword in self.MODALITY_KEYWORDS:
            if keyword in text_lower:
                modalities.append(keyword.title())
        
        return list(set(modalities))
    
    def _extract_regulatory_tokens(self, text: str) -> List[str]:
        """Extract regulatory designations"""
        text_lower = text.lower()
        
        tokens = []
        for keyword in self.REGULATORY_TOKENS:
            if keyword.lower() in text_lower:
                tokens.append(keyword)
        
        return list(set(tokens))
    
    def _extract_context(
        self,
        text: str,
        keyword: str,
        window: int = 50
    ) -> str:
        """
        Extract context around a keyword.
        
        Args:
            text: Full text
            keyword: Keyword to find
            window: Number of characters on each side
            
        Returns:
            Context string
        """
        text_lower = text.lower()
        keyword_lower = keyword.lower()
        
        index = text_lower.find(keyword_lower)
        if index == -1:
            return ''
        
        start = max(0, index - window)
        end = min(len(text), index + len(keyword) + window)
        
        context = text[start:end].strip()
        
        # Add ellipsis if truncated
        if start > 0:
            context = '...' + context
        if end < len(text):
            context = context + '...'
        
        return context


class PDFDownloader:
    """
    Download and extract text from PDFs.
    
    Note: For production use, this would use actual PDF libraries.
    This is a placeholder showing the interface.
    """
    
    def __init__(self, http_client):
        """
        Initialize PDF downloader.
        
        Args:
            http_client: AsyncHTTPClient instance
        """
        self.http_client = http_client
        self.intelligence = PDFIntelligence()
    
    async def download_and_extract(self, url: str) -> Optional[TrialData]:
        """
        Download PDF and extract trial data.
        
        Args:
            url: PDF URL
            
        Returns:
            TrialData object or None if extraction failed
        """
        try:
            # Download PDF
            response = await self.http_client.get(url)
            
            if response['status'] != 200:
                return None
            
            # Extract text from PDF
            # In production, use PyPDF2, pdfplumber, or similar
            # For now, assume content is text-based
            text = response.get('html', '')
            
            # Extract trial data
            return self.intelligence.extract_from_text(text)
        
        except Exception:
            return None
    
    def is_pdf_url(self, url: str) -> bool:
        """Check if URL points to a PDF"""
        return url.lower().endswith('.pdf') or 'pdf' in url.lower()
