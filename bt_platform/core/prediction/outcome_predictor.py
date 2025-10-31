"""
Catalyst Outcome Prediction

Bayesian models for predicting the probability of positive outcomes
for upcoming catalyst events.
"""

from typing import Optional


def predict_catalyst_outcome(
    catalyst_type: str,
    phase: Optional[str] = None,
    indication: Optional[str] = None,
    prior_phase_outcomes: Optional[list[str]] = None,
    trial_design_factors: Optional[dict] = None,
) -> dict:
    """
    Predict the probability of a positive outcome for a catalyst.

    Uses Bayesian approach: starts with industry base rates (priors) and updates
    with drug-specific evidence.

    Args:
        catalyst_type: Type of catalyst
        phase: Clinical trial phase
        indication: Disease indication
        prior_phase_outcomes: List of outcomes from earlier phases ['success', 'failure', etc.]
        trial_design_factors: Dict with factors like biomarker_enrichment, endpoint_type, etc.

    Returns:
        Dict with probability_of_success, confidence_interval, key_factors
    """

    # Industry base rates by phase and indication (from historical data)
    # Source: BIO Industry Analysis 2016-2020
    BASE_RATES = {
        "Phase 1": {
            "Oncology": 0.68,
            "Rare Disease": 0.65,
            "Neurology": 0.58,
            "Cardiology": 0.62,
            "default": 0.63,
        },
        "Phase 2": {
            "Oncology": 0.31,
            "Rare Disease": 0.42,
            "Neurology": 0.28,
            "Cardiology": 0.35,
            "default": 0.30,
        },
        "Phase 3": {
            "Oncology": 0.48,
            "Rare Disease": 0.62,
            "Neurology": 0.42,
            "Cardiology": 0.52,
            "default": 0.48,
        },
        "FDA Approval": {
            "Oncology": 0.85,
            "Rare Disease": 0.88,
            "Neurology": 0.82,
            "Cardiology": 0.86,
            "default": 0.85,
        },
    }

    # Get base rate (prior probability)
    phase_key = _map_to_phase(catalyst_type, phase)
    indication_key = _map_indication(indication)

    prior_prob = BASE_RATES.get(phase_key, {}).get(
        indication_key,
        BASE_RATES.get(phase_key, {}).get("default", 0.5)
    )

    # Update probability based on evidence (Bayesian update)
    posterior_prob = prior_prob
    evidence_factors = []

    # Factor 1: Prior phase success
    if prior_phase_outcomes:
        success_rate = sum(1 for outcome in prior_phase_outcomes if outcome == "success") / len(prior_phase_outcomes)
        if success_rate > 0.5:
            boost = (success_rate - 0.5) * 0.3  # Up to 15% boost
            posterior_prob = min(0.95, posterior_prob + boost)
            evidence_factors.append({
                "factor": "prior_phase_success",
                "impact": f"+{boost:.1%}",
                "rationale": f"{int(success_rate * 100)}% success in earlier phases"
            })

    # Factor 2: Trial design enhancements
    if trial_design_factors:
        design_boost = 0

        # Biomarker enrichment
        if trial_design_factors.get("biomarker_enrichment"):
            design_boost += 0.10
            evidence_factors.append({
                "factor": "biomarker_enrichment",
                "impact": "+10%",
                "rationale": "Genetic biomarker increases target population likelihood"
            })

        # Hard clinical endpoint (vs surrogate)
        if trial_design_factors.get("hard_endpoint"):
            design_boost += 0.05
            evidence_factors.append({
                "factor": "hard_endpoint",
                "impact": "+5%",
                "rationale": "Direct clinical benefit endpoint"
            })

        # Large trial size
        if trial_design_factors.get("trial_size", 0) > 500:
            design_boost += 0.03
            evidence_factors.append({
                "factor": "large_trial_size",
                "impact": "+3%",
                "rationale": f"Well-powered trial (n={trial_design_factors['trial_size']})"
            })

        posterior_prob = min(0.95, posterior_prob + design_boost)

    # Calculate confidence interval
    # Higher confidence when we have more evidence
    evidence_count = len(evidence_factors)
    confidence_width = 0.15 - (evidence_count * 0.02)  # Narrows with more evidence
    confidence_width = max(0.05, confidence_width)

    lower_bound = max(0.05, posterior_prob - confidence_width)
    upper_bound = min(0.95, posterior_prob + confidence_width)

    return {
        "probability_of_success": round(posterior_prob, 3),
        "confidence_interval": {
            "lower": round(lower_bound, 3),
            "upper": round(upper_bound, 3),
        },
        "prior_probability": round(prior_prob, 3),
        "evidence_factors": evidence_factors,
        "model": "bayesian_update",
        "confidence_score": _calculate_outcome_confidence(evidence_count, trial_design_factors),
    }


def _map_to_phase(catalyst_type: str, phase: Optional[str]) -> str:
    """Map catalyst type and phase to base rate category."""
    if phase:
        return phase

    if "FDA" in catalyst_type or "Approval" in catalyst_type:
        return "FDA Approval"
    elif "Phase 3" in catalyst_type or "Phase III" in catalyst_type:
        return "Phase 3"
    elif "Phase 2" in catalyst_type or "Phase II" in catalyst_type:
        return "Phase 2"
    elif "Phase 1" in catalyst_type or "Phase I" in catalyst_type:
        return "Phase 1"

    return "Phase 2"  # Default to Phase 2


def _map_indication(indication: Optional[str]) -> str:
    """Map indication to category."""
    if not indication:
        return "default"

    indication_lower = indication.lower()

    if any(term in indication_lower for term in ["cancer", "tumor", "oncology", "carcinoma"]):
        return "Oncology"
    elif any(term in indication_lower for term in ["rare", "orphan", "ultra-rare"]):
        return "Rare Disease"
    elif any(term in indication_lower for term in ["alzheimer", "parkinson", "neuro", "cns", "brain"]):
        return "Neurology"
    elif any(term in indication_lower for term in ["cardio", "heart", "cv", "stroke"]):
        return "Cardiology"

    return "default"


def _calculate_outcome_confidence(evidence_count: int, trial_design_factors: Optional[dict]) -> float:
    """
    Calculate confidence in outcome prediction (0-1).
    Higher confidence when we have more evidence.
    """
    base_confidence = 0.6

    # Increase confidence with more evidence factors
    evidence_boost = min(0.2, evidence_count * 0.05)

    # Increase if we have detailed trial design info
    design_boost = 0.1 if trial_design_factors and len(trial_design_factors) > 2 else 0

    return min(0.9, base_confidence + evidence_boost + design_boost)


# ============================================================================
# Enhanced Bayesian Outcome Prediction (from issue spec)
# ============================================================================

# Base priors from BIO 2016-2020 industry data
PHASE_PRIORS = {
    "P1": 0.63,
    "P2": 0.30,
    "P3": 0.48,
    "FDA": 0.85,
}

# Therapeutic area absolute uplift (rare disease bonus)
TA_UPLIFT_ABS = {
    "Rare Disease": 0.14,
}

# Evidence impacts on odds (multiplicative in odds space)
EVIDENCE_ODDS_MULT = {
    "prior_phase_success": 1.15,  # +15% odds
    "biomarker_enrichment": 1.10,  # +10% odds
    "hard_endpoints": 1.05,        # +5% odds
    "large_trial": 1.03,           # +3% odds
}


def p_to_odds(p: float) -> float:
    """Convert probability to odds."""
    p = max(1e-6, min(1 - 1e-6, p))
    return p / (1.0 - p)


def odds_to_p(o: float) -> float:
    """Convert odds to probability."""
    return o / (1.0 + o)


def predict_outcome_bayesian(
    phase: Optional[str] = None,
    therapeutic_area: Optional[str] = None,
    prior_phase_success: bool = False,
    biomarker_enrichment: bool = False,
    hard_endpoints: bool = False,
    large_trial: bool = False,
) -> Dict:
    """
    Enhanced Bayesian outcome prediction with evidence stacking in odds space.
    
    This is the improved Bayesian model from the issue spec that applies
    evidence impacts multiplicatively in odds space for proper stacking.
    
    Args:
        phase: Clinical phase ("P1", "P2", "P3", "FDA")
        therapeutic_area: Therapeutic area
        prior_phase_success: Whether prior phases succeeded
        biomarker_enrichment: Whether trial uses biomarker enrichment
        hard_endpoints: Whether trial uses hard clinical endpoints
        large_trial: Whether trial has large sample size
        
    Returns:
        Dict with probability_of_success, evidence_factors, prior_probability
    """
    # 1) Start with phase-based prior
    prior = PHASE_PRIORS.get(phase or "P3", 0.48)
    
    # 2) Apply therapeutic area absolute uplift (in probability space first)
    if therapeutic_area in TA_UPLIFT_ABS:
        prior = min(0.999, max(0.001, prior + TA_UPLIFT_ABS[therapeutic_area]))
    
    # 3) Convert to odds for evidence stacking
    odds = p_to_odds(prior)
    
    # 4) Apply evidence multipliers in odds space
    factors_applied = []
    
    def apply_evidence(flag: bool, key: str):
        nonlocal odds
        if flag:
            mult = EVIDENCE_ODDS_MULT[key]
            odds *= mult
            factors_applied.append({
                "factor": key,
                "impact": f"+{int((mult - 1) * 100)}%",
                "description": _describe_evidence(key),
            })
    
    apply_evidence(prior_phase_success, "prior_phase_success")
    apply_evidence(biomarker_enrichment, "biomarker_enrichment")
    apply_evidence(hard_endpoints, "hard_endpoints")
    apply_evidence(large_trial, "large_trial")
    
    # 5) Convert back to probability
    p = odds_to_p(odds)
    
    # 6) Clamp to reasonable bounds
    p = max(0.01, min(0.97, p))
    
    return {
        "probability_of_success": round(p, 4),
        "evidence_factors": factors_applied,
        "prior_probability": round(PHASE_PRIORS.get(phase or "P3", 0.48), 4),
        "model": "bayesian_odds",
    }


def _describe_evidence(key: str) -> str:
    """Provide human-readable description of evidence factor."""
    descriptions = {
        "prior_phase_success": "Prior phase(s) met endpoints",
        "biomarker_enrichment": "Genetic/biomarker enrichment increases target likelihood",
        "hard_endpoints": "Hard clinical endpoints vs surrogate markers",
        "large_trial": "Well-powered trial with large sample size",
    }
    return descriptions.get(key, "")
