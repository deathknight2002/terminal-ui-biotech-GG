"""
Catalyst Examples API Endpoint
===============================

Serves the 5 detailed catalyst examples with full data contracts.
Provides expectation delta computations and formatted output.
"""

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query

from ..seed_catalyst_examples import ALL_CATALYST_EXAMPLES
from ..services.expectation_delta import (
    compute_aggregate_delta,
    compute_expectation_delta,
    format_delta_for_display,
)

router = APIRouter()


def compute_deltas_for_event(event: dict[str, Any]) -> dict[str, Any]:
    """
    Compute expectation deltas for all metrics in a catalyst event.

    Returns event enriched with delta computations.
    """
    enriched_event = event.copy()

    # Build metrics lookup
    expectation_metrics = {
        metric["name"]: metric
        for metric in event["expectations"]["metrics"]
    }

    outcome_metrics = {
        metric["name"]: metric
        for metric in event["outcome"]["metrics"]
    }

    # Compute deltas for matching metrics
    deltas = []
    delta_details = []

    for metric_name, expectation in expectation_metrics.items():
        if metric_name in outcome_metrics:
            outcome = outcome_metrics[metric_name]

            # Handle boolean/string outcomes
            if isinstance(outcome["value"], (bool, str)):
                # For boolean/categorical outcomes, just report inline
                delta_details.append({
                    "metric_name": metric_name,
                    "expected": expectation.get("expected"),
                    "actual": outcome["value"],
                    "delta_class": "inline",
                    "magnitude": 0.0
                })
                continue

            # Compute numeric delta
            delta = compute_expectation_delta(
                outcome_value=float(outcome["value"]),
                expected_value=expectation.get("expected"),
                band_low=expectation.get("band_low"),
                band_high=expectation.get("band_high"),
                metric_name=metric_name,
                p_value=outcome.get("pvalue")
            )

            deltas.append(delta)
            delta_details.append({
                "metric_name": metric_name,
                "expected": expectation.get("expected"),
                "band_low": expectation.get("band_low"),
                "band_high": expectation.get("band_high"),
                "actual": outcome["value"],
                "unit": outcome["unit"],
                "p_value": outcome.get("pvalue"),
                **format_delta_for_display(delta)
            })

    # Compute aggregate delta if we have multiple metrics
    if len(deltas) > 1:
        aggregate_class, aggregate_score = compute_aggregate_delta(deltas)
        enriched_event["aggregate_delta"] = {
            "class": aggregate_class.value,
            "score": round(aggregate_score, 2)
        }
    elif len(deltas) == 1:
        enriched_event["aggregate_delta"] = {
            "class": deltas[0].delta_class.value,
            "score": round(deltas[0].delta_score, 2)
        }
    else:
        enriched_event["aggregate_delta"] = {
            "class": "inline",
            "score": 0.0
        }

    enriched_event["expectation_deltas"] = delta_details

    return enriched_event


@router.get("/catalyst-examples")
async def get_catalyst_examples(
    catalyst_type: Optional[str] = Query(None, description="Filter by catalyst type: M&A, PH3_READOUT, SAFETY_PAUSE, APPROVAL, LABEL_UPDATE"),
    company_ticker: Optional[str] = Query(None, description="Filter by company ticker"),
    include_deltas: bool = Query(True, description="Include expectation delta computations")
) -> dict[str, Any]:
    """
    Get detailed catalyst examples with expectations, outcomes, and market reactions.

    Query Parameters:
    - catalyst_type: Filter by type (M&A, PH3_READOUT, etc.)
    - company_ticker: Filter by company ticker
    - include_deltas: Whether to compute expectation deltas (default: True)

    Returns:
    - List of catalyst events with full data contracts
    - Expectation delta computations (if include_deltas=True)
    - Market reaction data
    - Peer comparisons
    """

    # Filter examples
    filtered_examples = ALL_CATALYST_EXAMPLES.copy()

    if catalyst_type:
        filtered_examples = [
            ex for ex in filtered_examples
            if ex["catalyst"]["type"] == catalyst_type
        ]

    if company_ticker:
        filtered_examples = [
            ex for ex in filtered_examples
            if ex["company"]["ticker"] == company_ticker
        ]

    # Enrich with delta computations
    if include_deltas:
        enriched_examples = [
            compute_deltas_for_event(ex)
            for ex in filtered_examples
        ]
    else:
        enriched_examples = filtered_examples

    return {
        "count": len(enriched_examples),
        "catalyst_examples": enriched_examples,
        "metadata": {
            "generated_at": datetime.utcnow().isoformat(),
            "includes_deltas": include_deltas,
            "filters": {
                "catalyst_type": catalyst_type,
                "company_ticker": company_ticker
            }
        }
    }


@router.get("/catalyst-examples/{event_id}")
async def get_catalyst_example_by_id(
    event_id: str,
    include_deltas: bool = Query(True, description="Include expectation delta computations")
) -> dict[str, Any]:
    """
    Get a specific catalyst example by event ID.
    """

    # Find matching event
    matching_event = next(
        (ex for ex in ALL_CATALYST_EXAMPLES if ex["event_id"] == event_id),
        None
    )

    if not matching_event:
        raise HTTPException(status_code=404, detail=f"Catalyst event {event_id} not found")

    # Enrich with delta computations
    if include_deltas:
        enriched_event = compute_deltas_for_event(matching_event)
    else:
        enriched_event = matching_event

    return enriched_event


@router.get("/catalyst-examples/summary")
async def get_catalyst_examples_summary() -> dict[str, Any]:
    """
    Get summary statistics of catalyst examples.

    Returns aggregate metrics across all examples:
    - Count by catalyst type
    - Average expectation deltas
    - Market reaction statistics
    """

    # Count by type
    type_counts = {}
    for ex in ALL_CATALYST_EXAMPLES:
        catalyst_type = ex["catalyst"]["type"]
        type_counts[catalyst_type] = type_counts.get(catalyst_type, 0) + 1

    # Compute aggregate deltas
    all_deltas = []
    for ex in ALL_CATALYST_EXAMPLES:
        enriched = compute_deltas_for_event(ex)
        if "aggregate_delta" in enriched:
            all_deltas.append(enriched["aggregate_delta"])

    # Compute average market reactions
    avg_d0_move = 0.0
    avg_d1_move = 0.0
    count_with_price = 0

    for ex in ALL_CATALYST_EXAMPLES:
        price_reactions = ex["market_reaction"]["price"]
        d0_reaction = next((p for p in price_reactions if p["window"] == "D0"), None)
        d1_reaction = next((p for p in price_reactions if p["window"] == "D+1"), None)

        if d0_reaction:
            avg_d0_move += d0_reaction["abs"]
            count_with_price += 1
        if d1_reaction:
            avg_d1_move += d1_reaction["abs"]

    if count_with_price > 0:
        avg_d0_move /= count_with_price
        avg_d1_move /= count_with_price

    return {
        "total_examples": len(ALL_CATALYST_EXAMPLES),
        "by_catalyst_type": type_counts,
        "aggregate_deltas": {
            "beats": len([d for d in all_deltas if d["class"] == "beat"]),
            "inlines": len([d for d in all_deltas if d["class"] == "inline"]),
            "misses": len([d for d in all_deltas if d["class"] == "miss"]),
            "avg_score": round(sum(d["score"] for d in all_deltas) / len(all_deltas), 2) if all_deltas else 0
        },
        "market_reactions": {
            "avg_d0_move_pct": round(avg_d0_move, 2),
            "avg_d1_move_pct": round(avg_d1_move, 2)
        },
        "catalyst_types": list(type_counts.keys())
    }


@router.get("/catalyst-types")
async def get_catalyst_types() -> dict[str, list[str]]:
    """
    Get list of available catalyst types and subtypes.
    """

    types = set()
    subtypes = set()

    for ex in ALL_CATALYST_EXAMPLES:
        types.add(ex["catalyst"]["type"])
        subtypes.add(ex["catalyst"]["subtype"])

    return {
        "catalyst_types": sorted(types),
        "catalyst_subtypes": sorted(subtypes)
    }
