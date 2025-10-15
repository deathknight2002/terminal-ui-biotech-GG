"""
Model Distillation for Faster Inference
========================================

Knowledge distillation to compress large BERT models into smaller,
faster models while maintaining accuracy.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)


class ModelDistiller:
    """
    Knowledge distillation for BERT-based sentiment models.
    
    Compresses large teacher models (FinBERT/BioBERT) into smaller
    student models for faster inference with minimal accuracy loss.
    """
    
    def __init__(
        self,
        teacher_model,
        teacher_tokenizer,
        temperature: float = 2.0,
        alpha: float = 0.7
    ):
        """
        Initialize model distiller.
        
        Args:
            teacher_model: Large pre-trained model (teacher)
            teacher_tokenizer: Teacher model tokenizer
            temperature: Softmax temperature for distillation
            alpha: Weight for distillation loss vs hard labels
        """
        self.teacher_model = teacher_model
        self.teacher_tokenizer = teacher_tokenizer
        self.temperature = temperature
        self.alpha = alpha
        self.student_model = None
        
        # Put teacher in eval mode
        self.teacher_model.eval()
    
    def create_student_model(self, student_model_name: str = "distilbert-base-uncased"):
        """
        Create smaller student model for distillation.
        
        Args:
            student_model_name: HuggingFace model name for student
            
        Returns:
            Student model and tokenizer
        """
        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            
            logger.info(f"Creating student model: {student_model_name}")
            
            student_tokenizer = AutoTokenizer.from_pretrained(student_model_name)
            student_model = AutoModelForSequenceClassification.from_pretrained(
                student_model_name,
                num_labels=3  # negative, neutral, positive
            )
            
            self.student_model = student_model
            self.student_tokenizer = student_tokenizer
            
            logger.info("Student model created successfully")
            return student_model, student_tokenizer
            
        except ImportError as e:
            logger.error(f"Failed to import transformers: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to create student model: {e}")
            raise
    
    def extract_soft_labels(
        self,
        texts: List[str],
        batch_size: int = 8
    ) -> List[np.ndarray]:
        """
        Extract soft labels from teacher model.
        
        Args:
            texts: List of training texts
            batch_size: Batch size for processing
            
        Returns:
            List of soft label distributions
        """
        import torch
        import torch.nn.functional as F
        
        soft_labels = []
        
        with torch.no_grad():
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                
                # Tokenize
                inputs = self.teacher_tokenizer(
                    batch_texts,
                    return_tensors="pt",
                    max_length=512,
                    truncation=True,
                    padding=True
                )
                
                # Get teacher predictions
                outputs = self.teacher_model(**inputs)
                logits = outputs.logits
                
                # Apply temperature scaling
                soft = F.softmax(logits / self.temperature, dim=1)
                soft_labels.extend(soft.cpu().numpy())
        
        return soft_labels
    
    def distill(
        self,
        train_texts: List[str],
        train_labels: List[int],
        val_texts: Optional[List[str]] = None,
        val_labels: Optional[List[int]] = None,
        epochs: int = 3,
        batch_size: int = 8,
        learning_rate: float = 2e-5
    ) -> Dict[str, Any]:
        """
        Perform knowledge distillation training.
        
        Args:
            train_texts: Training texts
            train_labels: Hard labels for training
            val_texts: Validation texts (optional)
            val_labels: Validation labels (optional)
            epochs: Number of training epochs
            batch_size: Training batch size
            learning_rate: Learning rate
            
        Returns:
            Training results dictionary
        """
        if self.student_model is None:
            raise ValueError("Student model not created. Call create_student_model() first")
        
        try:
            import torch
            import torch.nn.functional as F
            from torch.optim import AdamW
            
            logger.info("Starting distillation training")
            
            # Extract soft labels from teacher
            logger.info("Extracting soft labels from teacher...")
            soft_labels = self.extract_soft_labels(train_texts, batch_size)
            
            # Prepare optimizer
            optimizer = AdamW(self.student_model.parameters(), lr=learning_rate)
            
            # Training loop
            results = {
                'epochs': [],
                'train_loss': [],
                'val_accuracy': []
            }
            
            for epoch in range(epochs):
                self.student_model.train()
                epoch_loss = 0
                batches = 0
                
                for i in range(0, len(train_texts), batch_size):
                    batch_texts = train_texts[i:i + batch_size]
                    batch_hard_labels = train_labels[i:i + batch_size]
                    batch_soft_labels = soft_labels[i:i + batch_size]
                    
                    # Tokenize
                    inputs = self.student_tokenizer(
                        batch_texts,
                        return_tensors="pt",
                        max_length=512,
                        truncation=True,
                        padding=True
                    )
                    
                    # Forward pass
                    outputs = self.student_model(**inputs)
                    logits = outputs.logits
                    
                    # Compute distillation loss
                    soft_targets = torch.tensor(
                        batch_soft_labels,
                        dtype=torch.float32
                    )
                    
                    # Distillation loss (KL divergence)
                    soft_prob = F.log_softmax(logits / self.temperature, dim=1)
                    distill_loss = F.kl_div(
                        soft_prob,
                        soft_targets,
                        reduction='batchmean'
                    ) * (self.temperature ** 2)
                    
                    # Hard label loss
                    hard_targets = torch.tensor(batch_hard_labels, dtype=torch.long)
                    hard_loss = F.cross_entropy(logits, hard_targets)
                    
                    # Combined loss
                    loss = self.alpha * distill_loss + (1 - self.alpha) * hard_loss
                    
                    # Backward pass
                    optimizer.zero_grad()
                    loss.backward()
                    optimizer.step()
                    
                    epoch_loss += loss.item()
                    batches += 1
                
                avg_loss = epoch_loss / batches
                results['epochs'].append(epoch + 1)
                results['train_loss'].append(avg_loss)
                
                # Validation
                if val_texts and val_labels:
                    val_acc = self._evaluate(val_texts, val_labels, batch_size)
                    results['val_accuracy'].append(val_acc)
                    logger.info(
                        f"Epoch {epoch + 1}/{epochs} - "
                        f"Loss: {avg_loss:.4f}, Val Acc: {val_acc:.4f}"
                    )
                else:
                    logger.info(f"Epoch {epoch + 1}/{epochs} - Loss: {avg_loss:.4f}")
            
            logger.info("Distillation training completed")
            return results
            
        except Exception as e:
            logger.error(f"Distillation failed: {e}")
            raise
    
    def _evaluate(
        self,
        texts: List[str],
        labels: List[int],
        batch_size: int
    ) -> float:
        """Evaluate student model accuracy."""
        import torch
        
        self.student_model.eval()
        correct = 0
        total = 0
        
        with torch.no_grad():
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                batch_labels = labels[i:i + batch_size]
                
                inputs = self.student_tokenizer(
                    batch_texts,
                    return_tensors="pt",
                    max_length=512,
                    truncation=True,
                    padding=True
                )
                
                outputs = self.student_model(**inputs)
                predictions = torch.argmax(outputs.logits, dim=1).cpu().numpy()
                
                correct += np.sum(predictions == batch_labels)
                total += len(batch_labels)
        
        return correct / total if total > 0 else 0.0
    
    def save_student_model(self, output_dir: str):
        """
        Save distilled student model.
        
        Args:
            output_dir: Directory to save model
        """
        if self.student_model is None:
            raise ValueError("No student model to save")
        
        try:
            self.student_model.save_pretrained(output_dir)
            self.student_tokenizer.save_pretrained(output_dir)
            logger.info(f"Student model saved to {output_dir}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            raise
    
    def compare_models(
        self,
        test_texts: List[str],
        test_labels: List[int]
    ) -> Dict[str, Any]:
        """
        Compare teacher and student model performance.
        
        Args:
            test_texts: Test texts
            test_labels: Test labels
            
        Returns:
            Comparison dictionary with metrics
        """
        import time
        
        # Teacher metrics
        teacher_start = time.time()
        teacher_acc = self._evaluate_teacher(test_texts, test_labels)
        teacher_time = time.time() - teacher_start
        
        # Student metrics
        student_start = time.time()
        student_acc = self._evaluate(test_texts, test_labels, batch_size=8)
        student_time = time.time() - student_start
        
        # Model sizes
        teacher_params = sum(p.numel() for p in self.teacher_model.parameters())
        student_params = sum(p.numel() for p in self.student_model.parameters())
        
        return {
            'teacher': {
                'accuracy': teacher_acc,
                'inference_time': teacher_time,
                'parameters': teacher_params
            },
            'student': {
                'accuracy': student_acc,
                'inference_time': student_time,
                'parameters': student_params
            },
            'speedup': teacher_time / student_time if student_time > 0 else 0,
            'compression_ratio': teacher_params / student_params if student_params > 0 else 0,
            'accuracy_drop': teacher_acc - student_acc
        }
    
    def _evaluate_teacher(self, texts: List[str], labels: List[int]) -> float:
        """Evaluate teacher model accuracy."""
        import torch
        
        correct = 0
        total = 0
        
        with torch.no_grad():
            for text, label in zip(texts, labels):
                inputs = self.teacher_tokenizer(
                    text,
                    return_tensors="pt",
                    max_length=512,
                    truncation=True,
                    padding=True
                )
                
                outputs = self.teacher_model(**inputs)
                prediction = torch.argmax(outputs.logits, dim=1).item()
                
                correct += (prediction == label)
                total += 1
        
        return correct / total if total > 0 else 0.0


def create_distiller(
    teacher_model,
    teacher_tokenizer,
    temperature: float = 2.0,
    alpha: float = 0.7
) -> ModelDistiller:
    """
    Factory function to create model distiller.
    
    Args:
        teacher_model: Teacher model
        teacher_tokenizer: Teacher tokenizer
        temperature: Distillation temperature
        alpha: Distillation weight
        
    Returns:
        ModelDistiller instance
    """
    return ModelDistiller(
        teacher_model=teacher_model,
        teacher_tokenizer=teacher_tokenizer,
        temperature=temperature,
        alpha=alpha
    )
