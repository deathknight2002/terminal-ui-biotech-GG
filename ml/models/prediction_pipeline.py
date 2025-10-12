"""
ML Models for Catalyst Event Prediction
========================================

Implements the model stack:
1. Hierarchical Bayesian logistic regression
2. Gradient-boosted trees
3. Quantile GBM for returns
4. Isotonic calibration
5. Conformal prediction
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.isotonic import IsotonicRegression
import logging

logger = logging.getLogger(__name__)


class HierarchicalBayesianModel:
    """
    Hierarchical Bayesian logistic regression with random effects.
    
    Levels:
    - Indication (Oncology, Immunology, etc.)
    - Phase (I, II, III)
    - Company type (Big Pharma, Biotech)
    
    Uses PyMC for Bayesian inference (placeholder for now).
    """
    
    def __init__(self):
        self.model = None
        self.trace = None
    
    def fit(self, X: pd.DataFrame, y: np.ndarray, hierarchical_features: Dict[str, np.ndarray]):
        """
        Fit hierarchical Bayesian model.
        
        Args:
            X: Feature matrix
            y: Binary outcomes (success=1, failure=0)
            hierarchical_features: Dict of {level_name: level_indices}
        """
        logger.info("Fitting Hierarchical Bayesian model...")
        
        # Placeholder: In production, use PyMC3 or Stan
        # import pymc3 as pm
        # with pm.Model() as model:
        #     # Priors for random effects
        #     indication_effects = pm.Normal('indication', mu=0, sigma=1, shape=n_indications)
        #     phase_effects = pm.Normal('phase', mu=0, sigma=1, shape=n_phases)
        #     
        #     # Likelihood
        #     logit_p = pm.math.dot(X, beta) + indication_effects[indication_idx] + phase_effects[phase_idx]
        #     y_obs = pm.Bernoulli('y', logit_p=logit_p, observed=y)
        #     
        #     # Inference
        #     trace = pm.sample(2000, tune=1000)
        
        # For now, simple logistic regression as placeholder
        from sklearn.linear_model import LogisticRegression
        self.model = LogisticRegression(max_iter=1000)
        self.model.fit(X, y)
        
        logger.info("Bayesian model fitted")
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict probabilities with uncertainty.
        
        Returns:
            Array of probabilities [p(failure), p(success)]
        """
        if self.model is None:
            raise ValueError("Model not fitted yet")
        
        return self.model.predict_proba(X)
    
    def predict_with_uncertainty(self, X: pd.DataFrame, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict with Bayesian credible intervals.
        
        Returns:
            (mean_probs, std_probs)
        """
        # Placeholder: Sample from posterior
        probs = self.predict_proba(X)[:, 1]
        
        # In production, sample from trace:
        # posterior_samples = []
        # for _ in range(n_samples):
        #     sample_idx = np.random.randint(len(self.trace))
        #     posterior_samples.append(self.predict_proba_sample(X, sample_idx))
        # 
        # return np.mean(posterior_samples, axis=0), np.std(posterior_samples, axis=0)
        
        # Placeholder: Use bootstrap
        std = np.sqrt(probs * (1 - probs))  # Binomial variance
        return probs, std


class GradientBoostingEnsemble:
    """
    Gradient-boosted trees for enhanced probability estimation.
    Stacked on top of Bayesian model predictions.
    """
    
    def __init__(self, n_estimators: int = 500, max_depth: int = 6, learning_rate: float = 0.01):
        self.model = GradientBoostingClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=0.8,
            random_state=42
        )
    
    def fit(self, X: pd.DataFrame, y: np.ndarray):
        """Fit gradient boosting model."""
        logger.info("Fitting GBM model...")
        self.model.fit(X, y)
        logger.info(f"GBM fitted with {len(self.model.estimators_)} trees")
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Predict probabilities."""
        return self.model.predict_proba(X)
    
    def feature_importance(self) -> pd.Series:
        """Get feature importances."""
        return pd.Series(self.model.feature_importances_, index=X.columns).sort_values(ascending=False)


class QuantileReturnsModel:
    """
    Quantile regression for upside (U) and downside (D) return predictions.
    
    Predicts Q90 for upside, Q10 for downside.
    """
    
    def __init__(self):
        self.upside_model = GradientBoostingRegressor(
            loss='quantile',
            alpha=0.90,  # 90th percentile
            n_estimators=300,
            max_depth=5,
            learning_rate=0.05,
            random_state=42
        )
        
        self.downside_model = GradientBoostingRegressor(
            loss='quantile',
            alpha=0.10,  # 10th percentile
            n_estimators=300,
            max_depth=5,
            learning_rate=0.05,
            random_state=42
        )
    
    def fit(self, X: pd.DataFrame, returns: np.ndarray):
        """
        Fit quantile models for returns.
        
        Args:
            X: Feature matrix
            returns: Actual returns (residualized vs XBI)
        """
        logger.info("Fitting quantile return models...")
        
        self.upside_model.fit(X, returns)
        self.downside_model.fit(X, returns)
        
        logger.info("Quantile models fitted")
    
    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict upside and downside returns.
        
        Returns:
            (U, D) where U = 90th percentile, D = 10th percentile
        """
        U = self.upside_model.predict(X)
        D = self.downside_model.predict(X)
        
        return U, D


class IsotonicCalibrator:
    """
    Isotonic regression for probability calibration.
    
    Ensures predictions are well-calibrated (predicted p matches observed frequency).
    """
    
    def __init__(self):
        self.calibrator = IsotonicRegression(out_of_bounds='clip')
    
    def fit(self, y_pred: np.ndarray, y_true: np.ndarray):
        """
        Fit calibrator on validation set.
        
        Args:
            y_pred: Predicted probabilities
            y_true: True binary outcomes
        """
        logger.info("Fitting isotonic calibrator...")
        self.calibrator.fit(y_pred, y_true)
        logger.info("Calibrator fitted")
    
    def calibrate(self, y_pred: np.ndarray) -> np.ndarray:
        """
        Calibrate predictions.
        
        Args:
            y_pred: Raw probabilities
            
        Returns:
            Calibrated probabilities
        """
        return self.calibrator.transform(y_pred)


class ConformalPredictor:
    """
    Conformal prediction for honest confidence intervals.
    
    Provides coverage guarantee: 90% CI contains true outcome 90% of time.
    """
    
    def __init__(self, alpha: float = 0.10):
        """
        Args:
            alpha: Miscoverage rate (0.10 = 90% coverage)
        """
        self.alpha = alpha
        self.quantile_low = None
        self.quantile_high = None
    
    def calibrate(self, y_pred: np.ndarray, y_true: np.ndarray):
        """
        Calibrate conformal predictor on calibration set.
        
        Args:
            y_pred: Predicted values
            y_true: True values
        """
        # Compute non-conformity scores (residuals)
        residuals = np.abs(y_true - y_pred)
        
        # Compute quantiles for prediction intervals
        n = len(residuals)
        q_low = np.ceil((n + 1) * (self.alpha / 2)) / n
        q_high = np.ceil((n + 1) * (1 - self.alpha / 2)) / n
        
        self.quantile_low = np.quantile(residuals, q_low)
        self.quantile_high = np.quantile(residuals, q_high)
        
        logger.info(f"Conformal prediction calibrated: [{self.quantile_low:.4f}, {self.quantile_high:.4f}]")
    
    def predict_interval(self, y_pred: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict confidence intervals.
        
        Args:
            y_pred: Point predictions
            
        Returns:
            (lower_bound, upper_bound)
        """
        if self.quantile_low is None:
            raise ValueError("Conformal predictor not calibrated")
        
        lower = np.clip(y_pred - self.quantile_high, 0, 1)
        upper = np.clip(y_pred + self.quantile_high, 0, 1)
        
        return lower, upper


class PredictionPipeline:
    """
    End-to-end prediction pipeline combining all models.
    """
    
    def __init__(self):
        self.bayes_model = HierarchicalBayesianModel()
        self.gbm_model = GradientBoostingEnsemble()
        self.returns_model = QuantileReturnsModel()
        self.calibrator = IsotonicCalibrator()
        self.conformal = ConformalPredictor(alpha=0.10)
        
        self.fitted = False
    
    def fit(
        self,
        X_train: pd.DataFrame,
        y_train: np.ndarray,
        returns_train: np.ndarray,
        X_val: pd.DataFrame,
        y_val: np.ndarray,
        hierarchical_features: Dict[str, np.ndarray]
    ):
        """
        Fit entire pipeline.
        
        Args:
            X_train: Training features
            y_train: Training outcomes (binary)
            returns_train: Training returns
            X_val: Validation features
            y_val: Validation outcomes
            hierarchical_features: Hierarchical structure
        """
        # 1. Fit Bayesian model
        self.bayes_model.fit(X_train, y_train, hierarchical_features)
        
        # 2. Get Bayesian predictions as additional features for GBM
        bayes_probs = self.bayes_model.predict_proba(X_train)[:, 1]
        X_train_augmented = X_train.copy()
        X_train_augmented['bayes_prob'] = bayes_probs
        
        # 3. Fit GBM on augmented features
        self.gbm_model.fit(X_train_augmented, y_train)
        
        # 4. Fit returns model
        self.returns_model.fit(X_train, returns_train)
        
        # 5. Calibrate on validation set
        bayes_val_probs = self.bayes_model.predict_proba(X_val)[:, 1]
        X_val_augmented = X_val.copy()
        X_val_augmented['bayes_prob'] = bayes_val_probs
        gbm_val_probs = self.gbm_model.predict_proba(X_val_augmented)[:, 1]
        
        self.calibrator.fit(gbm_val_probs, y_val)
        
        # 6. Conformal calibration
        calibrated_val_probs = self.calibrator.calibrate(gbm_val_probs)
        self.conformal.calibrate(calibrated_val_probs, y_val)
        
        self.fitted = True
        logger.info("Prediction pipeline fitted successfully")
    
    def predict(self, X: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate full prediction for a catalyst event.
        
        Args:
            X: Feature vector(s)
            
        Returns:
            Dict with keys: p, p_ci_low, p_ci_high, U, D, U_ci_low, U_ci_high, D_ci_low, D_ci_high
        """
        if not self.fitted:
            raise ValueError("Pipeline not fitted yet")
        
        # Bayesian prediction
        bayes_probs = self.bayes_model.predict_proba(X)[:, 1]
        
        # GBM prediction with Bayesian features
        X_augmented = X.copy()
        X_augmented['bayes_prob'] = bayes_probs
        gbm_probs = self.gbm_model.predict_proba(X_augmented)[:, 1]
        
        # Calibrate
        p = self.calibrator.calibrate(gbm_probs)
        
        # Conformal intervals for p
        p_ci_low, p_ci_high = self.conformal.predict_interval(p)
        
        # Returns prediction
        U, D = self.returns_model.predict(X)
        
        # For returns CIs, use quantile spread as estimate (simplified)
        # In production, use bootstrap or conformal on returns
        U_ci_low = U * 0.8  # Placeholder
        U_ci_high = U * 1.2
        D_ci_low = D * 1.2  # Downside is negative, so flip
        D_ci_high = D * 0.8
        
        return {
            'p': float(p[0]),
            'p_ci_low': float(p_ci_low[0]),
            'p_ci_high': float(p_ci_high[0]),
            'U': float(U[0]),
            'D': float(D[0]),
            'U_ci_low': float(U_ci_low[0]),
            'U_ci_high': float(U_ci_high[0]),
            'D_ci_low': float(D_ci_low[0]),
            'D_ci_high': float(D_ci_high[0]),
        }
    
    def load_upcoming_features(self) -> List[Dict[str, Any]]:
        """
        Load feature snapshots for upcoming catalysts.
        
        In production, query FeatureSnapshot table.
        """
        # Placeholder
        return []


__all__ = [
    'HierarchicalBayesianModel',
    'GradientBoostingEnsemble',
    'QuantileReturnsModel',
    'IsotonicCalibrator',
    'ConformalPredictor',
    'PredictionPipeline',
]
