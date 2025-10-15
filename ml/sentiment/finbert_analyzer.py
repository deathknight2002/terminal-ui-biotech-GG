"""
FinBERT Sentiment Analyzer for Biotech/Pharma Financial Text
=============================================================

Advanced sentiment analysis using FinBERT (Financial BERT) fine-tuned
on pharmaceutical and biotech domain text.

FinBERT is a BERT model pre-trained on financial text and fine-tuned
for sentiment analysis. This module adapts it for biotech/pharma use.
"""

import logging
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

logger = logging.getLogger(__name__)


class FinBERTAnalyzer:
    """
    FinBERT-based sentiment analyzer for biotech financial text.
    
    Uses transformers library with FinBERT model for advanced
    sentiment classification with better context understanding.
    """
    
    def __init__(
        self,
        model_name: str = "ProsusAI/finbert",
        device: str = "cpu",
        max_length: int = 512
    ):
        """
        Initialize FinBERT analyzer.
        
        Args:
            model_name: HuggingFace model name
            device: Device to run on ('cpu' or 'cuda')
            max_length: Maximum sequence length
        """
        self.model_name = model_name
        self.device = device
        self.max_length = max_length
        self.model = None
        self.tokenizer = None
        self._is_loaded = False
        
    def _lazy_load(self):
        """Lazy load transformers dependencies and model."""
        if self._is_loaded:
            return
            
        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch
            
            logger.info(f"Loading FinBERT model: {self.model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            
            # Move to device
            if self.device == "cuda" and torch.cuda.is_available():
                self.model = self.model.to(self.device)
            else:
                self.device = "cpu"
                self.model = self.model.to("cpu")
            
            self.model.eval()
            self._is_loaded = True
            logger.info(f"FinBERT model loaded successfully on {self.device}")
            
        except ImportError as e:
            logger.error(
                f"Failed to import transformers library: {e}. "
                "Install with: pip install transformers torch"
            )
            raise ImportError(
                "transformers and torch are required for FinBERT. "
                "Install with: pip install transformers torch"
            )
        except Exception as e:
            logger.error(f"Failed to load FinBERT model: {e}")
            raise
    
    def predict(self, texts: List[str]) -> List[int]:
        """
        Predict sentiment labels.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of sentiment labels: -1 (negative), 0 (neutral), 1 (positive)
        """
        self._lazy_load()
        import torch
        
        predictions = []
        
        with torch.no_grad():
            for text in texts:
                # Tokenize
                inputs = self.tokenizer(
                    text,
                    return_tensors="pt",
                    max_length=self.max_length,
                    truncation=True,
                    padding=True
                ).to(self.device)
                
                # Predict
                outputs = self.model(**inputs)
                logits = outputs.logits
                pred_class = torch.argmax(logits, dim=1).item()
                
                # Convert FinBERT classes to our schema
                # FinBERT: 0=positive, 1=negative, 2=neutral
                # Our schema: 1=bullish, -1=bearish, 0=neutral
                if pred_class == 0:  # positive
                    predictions.append(1)
                elif pred_class == 1:  # negative
                    predictions.append(-1)
                else:  # neutral
                    predictions.append(0)
        
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
        import torch
        import torch.nn.functional as F
        
        results = []
        
        with torch.no_grad():
            for text in texts:
                # Tokenize
                inputs = self.tokenizer(
                    text,
                    return_tensors="pt",
                    max_length=self.max_length,
                    truncation=True,
                    padding=True
                ).to(self.device)
                
                # Predict
                outputs = self.model(**inputs)
                probs = F.softmax(outputs.logits, dim=1)[0]
                
                # Convert FinBERT classes to our schema
                # FinBERT: 0=positive, 1=negative, 2=neutral
                # Our schema: 1=bullish, -1=bearish, 0=neutral
                result = {
                    1: float(probs[0]),   # positive -> bullish
                    -1: float(probs[1]),  # negative -> bearish
                    0: float(probs[2])    # neutral -> neutral
                }
                results.append(result)
        
        return results
    
    def get_sentiment_scores(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Get detailed sentiment scores.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of score dictionaries with prediction, confidence, and probabilities
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
                'sentiment': 'bullish' if pred == 1 else ('bearish' if pred == -1 else 'neutral')
            })
        
        return scores
    
    def batch_predict(
        self,
        texts: List[str],
        batch_size: int = 8
    ) -> Tuple[List[int], List[Dict[int, float]]]:
        """
        Efficient batch prediction for large datasets.
        
        Args:
            texts: List of text strings
            batch_size: Batch size for processing
            
        Returns:
            Tuple of (predictions, probabilities)
        """
        self._lazy_load()
        import torch
        import torch.nn.functional as F
        
        predictions = []
        probabilities = []
        
        with torch.no_grad():
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                
                # Tokenize batch
                inputs = self.tokenizer(
                    batch_texts,
                    return_tensors="pt",
                    max_length=self.max_length,
                    truncation=True,
                    padding=True
                ).to(self.device)
                
                # Predict
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs = F.softmax(logits, dim=1)
                
                # Convert predictions
                for j in range(len(batch_texts)):
                    pred_class = torch.argmax(probs[j]).item()
                    
                    # Convert FinBERT classes to our schema
                    if pred_class == 0:  # positive
                        predictions.append(1)
                    elif pred_class == 1:  # negative
                        predictions.append(-1)
                    else:  # neutral
                        predictions.append(0)
                    
                    # Convert probabilities
                    prob_dict = {
                        1: float(probs[j][0]),   # positive -> bullish
                        -1: float(probs[j][1]),  # negative -> bearish
                        0: float(probs[j][2])    # neutral -> neutral
                    }
                    probabilities.append(prob_dict)
        
        return predictions, probabilities
    
    @property
    def is_available(self) -> bool:
        """Check if FinBERT dependencies are available."""
        try:
            import transformers
            import torch
            return True
        except ImportError:
            return False
    
    def __repr__(self) -> str:
        return f"FinBERTAnalyzer(model={self.model_name}, device={self.device})"


def create_finbert_analyzer(**kwargs) -> FinBERTAnalyzer:
    """Factory function to create FinBERT analyzer."""
    return FinBERTAnalyzer(**kwargs)


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Sample biotech/pharma texts
    texts = [
        "FDA approves breakthrough therapy designation for novel oncology drug",
        "Phase III trial fails to meet primary endpoint, stock drops 40%",
        "Company announces quarterly earnings in line with expectations",
        "Positive interim data from pivotal study shows significant efficacy",
        "Safety concerns halt clinical trial enrollment"
    ]
    
    try:
        analyzer = FinBERTAnalyzer()
        
        if analyzer.is_available:
            print("Testing FinBERT Analyzer...")
            scores = analyzer.get_sentiment_scores(texts)
            
            for score in scores:
                print(f"\nText: {score['text']}")
                print(f"Sentiment: {score['sentiment']} (confidence: {score['confidence']:.3f})")
                print(f"Probabilities: {score['probabilities']}")
        else:
            print("FinBERT dependencies not available. Install with:")
            print("pip install transformers torch")
    
    except Exception as e:
        logger.error(f"Error running FinBERT example: {e}")
