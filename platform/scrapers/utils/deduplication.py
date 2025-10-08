"""
Content Fingerprinting and Deduplication

Uses SimHash for content fingerprinting and MinHash LSH for near-duplicate detection.
"""

import hashlib
from typing import List, Set, Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from simhash import Simhash
from datasketch import MinHash, MinHashLSH


def canonical_url(url: str) -> str:
    """
    Canonicalize URL for deduplication.
    
    Removes tracking parameters and normalizes format.
    
    Args:
        url: URL to canonicalize
        
    Returns:
        Canonical URL
    """
    parsed = urlparse(url.lower().strip())
    
    # Remove common tracking parameters
    tracking_params = {
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', '_ga', 'mc_cid', 'mc_eid',
    }
    
    # Parse and filter query parameters
    query_params = parse_qs(parsed.query)
    filtered_params = {
        k: v for k, v in query_params.items()
        if k not in tracking_params
    }
    
    # Sort parameters for consistency
    sorted_params = sorted(filtered_params.items())
    new_query = urlencode(sorted_params, doseq=True)
    
    # Rebuild URL
    canonical = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path.rstrip('/'),  # Remove trailing slash
        parsed.params,
        new_query,
        '',  # Remove fragment
    ))
    
    return canonical


def content_hash(text: str) -> str:
    """
    Generate SHA-256 hash of content.
    
    Args:
        text: Content to hash
        
    Returns:
        Hex digest of hash
    """
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def content_fingerprint(text: str, hash_bits: int = 64) -> str:
    """
    Generate SimHash fingerprint for near-duplicate detection.
    
    Args:
        text: Content to fingerprint
        hash_bits: Number of bits in fingerprint
        
    Returns:
        Hex string of fingerprint
    """
    sim = Simhash(text, f=hash_bits)
    return hex(sim.value)[2:]


def simhash_distance(fp1: str, fp2: str) -> int:
    """
    Calculate Hamming distance between two SimHash fingerprints.
    
    Args:
        fp1: First fingerprint (hex string)
        fp2: Second fingerprint (hex string)
        
    Returns:
        Hamming distance
    """
    val1 = int(fp1, 16)
    val2 = int(fp2, 16)
    return bin(val1 ^ val2).count('1')


def is_near_duplicate(fp1: str, fp2: str, threshold: int = 3) -> bool:
    """
    Check if two fingerprints represent near-duplicates.
    
    Args:
        fp1: First fingerprint
        fp2: Second fingerprint
        threshold: Maximum Hamming distance for duplicates
        
    Returns:
        True if near-duplicates
    """
    return simhash_distance(fp1, fp2) <= threshold


class MinHashDeduplicator:
    """
    MinHash LSH for fast near-duplicate detection across large datasets.
    
    Useful for detecting press release reprints across BusinessWire,
    PRNewswire, GlobeNewswire, etc.
    """
    
    def __init__(
        self,
        threshold: float = 0.8,  # Jaccard similarity threshold
        num_perm: int = 128,  # Number of permutations
    ):
        self.threshold = threshold
        self.num_perm = num_perm
        
        # Create LSH index
        self.lsh = MinHashLSH(threshold=threshold, num_perm=num_perm)
        
        # Store MinHashes by ID
        self.minhashes = {}
    
    def _create_minhash(self, text: str) -> MinHash:
        """Create MinHash from text"""
        m = MinHash(num_perm=self.num_perm)
        
        # Tokenize text into words
        words = text.lower().split()
        for word in words:
            m.update(word.encode('utf-8'))
        
        return m
    
    def add(self, doc_id: str, text: str):
        """
        Add document to index.
        
        Args:
            doc_id: Unique document ID
            text: Document text
        """
        minhash = self._create_minhash(text)
        self.lsh.insert(doc_id, minhash)
        self.minhashes[doc_id] = minhash
    
    def query(self, text: str) -> List[str]:
        """
        Find near-duplicates of text.
        
        Args:
            text: Text to query
            
        Returns:
            List of matching document IDs
        """
        minhash = self._create_minhash(text)
        return self.lsh.query(minhash)
    
    def is_duplicate(self, text: str) -> bool:
        """
        Check if text is a duplicate of anything in index.
        
        Args:
            text: Text to check
            
        Returns:
            True if duplicate found
        """
        return len(self.query(text)) > 0
    
    def get_clusters(self) -> List[List[str]]:
        """
        Get all duplicate clusters.
        
        Returns:
            List of clusters, each containing duplicate document IDs
        """
        clusters = []
        seen = set()
        
        for doc_id in self.minhashes:
            if doc_id in seen:
                continue
            
            # Query duplicates
            cluster = self.query_by_id(doc_id)
            if cluster:
                clusters.append(cluster)
                seen.update(cluster)
        
        return clusters
    
    def query_by_id(self, doc_id: str) -> List[str]:
        """
        Find near-duplicates of a document by ID.
        
        Args:
            doc_id: Document ID
            
        Returns:
            List of matching document IDs (includes doc_id)
        """
        if doc_id not in self.minhashes:
            return []
        
        minhash = self.minhashes[doc_id]
        return self.lsh.query(minhash)


def extract_text_content(html: str) -> str:
    """
    Extract text content from HTML for fingerprinting.
    
    Removes boilerplate (headers, footers, scripts, styles).
    
    Args:
        html: HTML content
        
    Returns:
        Plain text content
    """
    from bs4 import BeautifulSoup
    
    soup = BeautifulSoup(html, 'lxml')
    
    # Remove script, style, nav, footer, header
    for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
        tag.decompose()
    
    # Get text
    text = soup.get_text(separator=' ', strip=True)
    
    # Clean whitespace
    text = ' '.join(text.split())
    
    return text
