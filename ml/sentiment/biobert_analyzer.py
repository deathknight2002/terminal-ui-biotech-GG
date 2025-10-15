"""
BioBERT Sentiment Analyzer for Biotech/Pharma Domain Text
==========================================================

Domain-specific sentiment analysis using BioBERT or PubMedBERT
fine-tuned on biomedical and pharmaceutical literature.

BioBERT is trained on PubMed abstracts and PMC full-text articles,
making it ideal for understanding biotech-specific terminology.
"""

import logging
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

logger = logging.getLogger(__name__)


class BioBERTAnalyzer:
    """
    BioBERT/PubMedBERT-based sentiment analyzer for biotech domain text.
    
    Uses transformers library with domain-specific BERT models trained
    on biomedical literature for better understanding of scientific context.
    """
    
    def __init__(
        self,
        model_name: str = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext",
        device: str = "cpu",
        max_length: int = 512,
        use_fine_tuned: bool = False
    ):
        """
        Initialize BioBERT analyzer.
        
        Args:
            model_name: HuggingFace model name (default: PubMedBERT)
            device: Device to run on ('cpu' or 'cuda')
            max_length: Maximum sequence length
            use_fine_tuned: If True, load fine-tuned model (if available)
        """
        self.model_name = model_name
        self.device = device
        self.max_length = max_length
        self.use_fine_tuned = use_fine_tuned
        self.model = None
        self.tokenizer = None
        self.classifier = None
        self._is_loaded = False
        
        # Domain-specific sentiment indicators
        self.positive_indicators = {
            'approve', 'approved', 'approval', 'breakthrough', 'efficacy',
            'effective', 'successful', 'success', 'positive', 'improvement',
            'benefit', 'favorable', 'promising', 'significant', 'superior',
            'accelerated', 'designation', 'priority', 'orphan', 'fast-track',
            'primary endpoint met', 'statistically significant', 'well-tolerated'
        }
        
        self.negative_indicators = {
            'reject', 'rejected', 'rejection', 'fail', 'failed', 'failure',
            'negative', 'adverse', 'concern', 'warning', 'halt', 'halted',
            'discontinue', 'discontinued', 'terminate', 'terminated', 'deny',
            'denied', 'miss', 'missed', 'below', 'insufficient', 'safety issue',
            'complete response letter', 'crl', 'not met', 'no improvement'
        }
        
    def _lazy_load(self):
        """Lazy load transformers dependencies and model."""
        if self._is_loaded:
            return
            
        try:
            from transformers import (
                AutoTokenizer,
                AutoModel,
                AutoModelForSequenceClassification,
                pipeline
            )
            import torch
            
            logger.info(f"Loading BioBERT model: {self.model_name}")
            
            # Try to load fine-tuned sentiment classifier first
            if self.use_fine_tuned:
                try:
                    self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                    self.model = AutoModelForSequenceClassification.from_pretrained(
                        self.model_name,
                        num_labels=3
                    )
                    logger.info("Loaded fine-tuned sentiment classifier")
                except Exception as e:
                    logger.warning(f"Could not load fine-tuned model: {e}. Using base model with rule-based sentiment.")
                    self.use_fine_tuned = False
            
            if not self.use_fine_tuned:
                # Load base model for feature extraction + rule-based sentiment
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                self.model = AutoModel.from_pretrained(self.model_name)
            
            # Move to device
            if self.device == "cuda" and torch.cuda.is_available():
                self.model = self.model.to(self.device)
            else:
                self.device = "cpu"
                self.model = self.model.to("cpu")
            
            self.model.eval()
            self._is_loaded = True
            logger.info(f"BioBERT model loaded successfully on {self.device}")
            
        except ImportError as e:
            logger.error(
                f"Failed to import transformers library: {e}. "
                "Install with: pip install transformers torch"
            )
            raise ImportError(
                "transformers and torch are required for BioBERT. "
                "Install with: pip install transformers torch"
            )
        except Exception as e:
            logger.error(f"Failed to load BioBERT model: {e}")
            raise
    
    def _rule_based_sentiment(self, text: str) -> Tuple[int, float]:
        """
        Rule-based sentiment using domain-specific indicators.
        
        Args:
            text: Input text
            
        Returns:
            Tuple of (sentiment, confidence)
        """
        text_lower = text.lower()
        
        # Count indicators
        positive_count = sum(1 for indicator in self.positive_indicators if indicator in text_lower)
        negative_count = sum(1 for indicator in self.negative_indicators if indicator in text_lower)
        
        # Compute sentiment
        if positive_count > negative_count:
            sentiment = 1
            confidence = min(0.5 + (positive_count - negative_count) * 0.1, 0.95)
        elif negative_count > positive_count:
            sentiment = -1
            confidence = min(0.5 + (negative_count - positive_count) * 0.1, 0.95)
        else:
            sentiment = 0
            confidence = 0.5
        
        return sentiment, confidence
    
    def predict(self, texts: List[str]) -> List[int]:
        """
        Predict sentiment labels.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of sentiment labels: -1 (negative), 0 (neutral), 1 (positive)
        """
        self._lazy_load()
        
        if self.use_fine_tuned:
            return self._predict_with_model(texts)
        else:
            return self._predict_with_rules(texts)
    
    def _predict_with_model(self, texts: List[str]) -> List[int]:
        """Predict using fine-tuned model."""
        import torch
        
        predictions = []
        
        with torch.no_grad():
            for text in texts:
                inputs = self.tokenizer(
                    text,
                    return_tensors="pt",
                    max_length=self.max_length,
                    truncation=True,
                    padding=True
                ).to(self.device)
                
                outputs = self.model(**inputs)
                logits = outputs.logits
                pred_class = torch.argmax(logits, dim=1).item()
                
                # Convert to our schema: 0=neutral, 1=positive, 2=negative
                if pred_class == 1:
                    predictions.append(1)  # positive -> bullish
                elif pred_class == 2:
                    predictions.append(-1)  # negative -> bearish
                else:
                    predictions.append(0)  # neutral
        
        return predictions
    
    def _predict_with_rules(self, texts: List[str]) -> List[int]:
        """Predict using rule-based sentiment."""
        predictions = []
        for text in texts:
            sentiment, _ = self._rule_based_sentiment(text)
            predictions.append(sentiment)
        return predictions
    
    def predict_proba(self, texts: List[str]) -> List[Dict[int, float]]:
        """
        Predict sentiment probabilities.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of probability dictionaries {-1: prob, 0: prob, 1: prob}
        """
        self._lazy_load()
        
        if self.use_fine_tuned:
            return self._predict_proba_with_model(texts)
        else:
            return self._predict_proba_with_rules(texts)
    
    def _predict_proba_with_model(self, texts: List[str]) -> List[Dict[int, float]]:
        """Predict probabilities using fine-tuned model."""
        import torch
        import torch.nn.functional as F
        
        results = []
        
        with torch.no_grad():
            for text in texts:
                inputs = self.tokenizer(
                    text,
                    return_tensors="pt",
                    max_length=self.max_length,
                    truncation=True,
                    padding=True
                ).to(self.device)
                
                outputs = self.model(**inputs)
                probs = F.softmax(outputs.logits, dim=1)[0]
                
                result = {
                    0: float(probs[0]),   # neutral
                    1: float(probs[1]),   # positive -> bullish
                    -1: float(probs[2])   # negative -> bearish
                }
                results.append(result)
        
        return results
    
    def _predict_proba_with_rules(self, texts: List[str]) -> List[Dict[int, float]]:
        """Predict probabilities using rule-based sentiment."""
        results = []
        
        for text in texts:
            sentiment, confidence = self._rule_based_sentiment(text)
            
            # Distribute confidence across classes
            if sentiment == 1:
                prob_dict = {1: confidence, 0: (1 - confidence) / 2, -1: (1 - confidence) / 2}
            elif sentiment == -1:
                prob_dict = {-1: confidence, 0: (1 - confidence) / 2, 1: (1 - confidence) / 2}
            else:
                prob_dict = {0: confidence, 1: (1 - confidence) / 2, -1: (1 - confidence) / 2}
            
            results.append(prob_dict)
        
        return results
    
    def get_sentiment_scores(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Get detailed sentiment scores.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of score dictionaries
        """
        probs = self.predict_proba(texts)
        predictions = self.predict(texts)
        
        scores = []
        for text, pred, prob_dict in zip(texts, predictions, probs):
            scores.append({
                'text': text[:100] + '...' if len(text) > 100 else text,
                'prediction': pred,
                'confidence': max(prob_dict.values()),
                'probabilities': prob_dict,
                'sentiment': 'bullish' if pred == 1 else ('bearish' if pred == -1 else 'neutral'),
                'model_type': 'fine-tuned' if self.use_fine_tuned else 'rule-based'
            })
        
        return scores
    
    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Get BioBERT embeddings for texts.
        
        Args:
            texts: List of text strings
            
        Returns:
            Array of embeddings (n_texts, embedding_dim)
        """
        self._lazy_load()
        import torch
        
        embeddings = []
        
        with torch.no_grad():
            for text in texts:
                inputs = self.tokenizer(
                    text,
                    return_tensors="pt",
                    max_length=self.max_length,
                    truncation=True,
                    padding=True
                ).to(self.device)
                
                outputs = self.model(**inputs)
                
                # Use [CLS] token embedding
                if hasattr(outputs, 'last_hidden_state'):
                    cls_embedding = outputs.last_hidden_state[0][0]
                else:
                    cls_embedding = outputs.pooler_output[0]
                
                embeddings.append(cls_embedding.cpu().numpy())
        
        return np.array(embeddings)
    
    @property
    def is_available(self) -> bool:
        """Check if BioBERT dependencies are available."""
        try:
            import transformers
            import torch
            return True
        except ImportError:
            return False
    
    def __repr__(self) -> str:
        return f"BioBERTAnalyzer(model={self.model_name}, device={self.device}, fine_tuned={self.use_fine_tuned})"


def create_biobert_analyzer(**kwargs) -> BioBERTAnalyzer:
    """Factory function to create BioBERT analyzer."""
    return BioBERTAnalyzer(**kwargs)


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Sample biotech texts
    texts = [
        "FDA approves breakthrough therapy for rare genetic disorder",
        "Clinical trial halted due to safety concerns in phase 2 study",
        "Company reports quarterly earnings meeting analyst expectations",
        "Positive phase 3 results demonstrate statistically significant efficacy",
        "Complete response letter received, additional data requested"
    ]
    
    try:
        analyzer = BioBERTAnalyzer()
        
        if analyzer.is_available:
            print("Testing BioBERT Analyzer...")
            scores = analyzer.get_sentiment_scores(texts)
            
            for score in scores:
                print(f"\nText: {score['text']}")
                print(f"Sentiment: {score['sentiment']} (confidence: {score['confidence']:.3f})")
                print(f"Model type: {score['model_type']}")
        else:
            print("BioBERT dependencies not available. Install with:")
            print("pip install transformers torch")
    
    except Exception as e:
        logger.error(f"Error running BioBERT example: {e}")
