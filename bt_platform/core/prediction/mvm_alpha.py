"""
Market-Moving (MVM) Alpha Scoring Module

Proprietary alpha-oriented scoring system for biotech catalyst events.
Uses interpretable, monotone features to predict market-moving events.

Features:
- Event impact scoring (Phase 3, CRL, Approval, BTD, etc.)
- Effect-size aware surprise calculation (PFS ratios, clinical deltas)
- Attention channel weighting (ESMO, FDA, BTD viral, press)
- Cap-tier asymmetry (micro, smid, large cap)
- Trade playbook recommendations (long gamma, directional, premium sell)
- Backtested on recent 2025 events with documented performance

All inputs are open-source friendly (no paid data required).
"""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class CatalystEvent:
    """
    Catalyst event with scoring parameters.

    Attributes:
        ticker: Stock ticker symbol
        company: Company name
        date: ISO date string (YYYY-MM-DD)
        event_type: Type of catalyst event
        note: Description of the event
        cap_tier: Market cap tier (micro/smid/large)
        effect_ratio: Optional treatment/control ratio (e.g., PFS ratio >= 1.0)
        attention: Attention channel (ESMO, FDA_CR, FDA_approval, BTD_viral, press)
        realized_move_pct: Optional realized move for backtesting
    """

    ticker: str
    company: str
    date: str  # ISO date
    event_type: str  # "Phase3_readout" | "Phase2_readout" | "Approval" | "CRL" | "BTD"
    note: str
    cap_tier: str  # "micro" | "smid" | "large"
    effect_ratio: float | None = None  # e.g., PFS_treatment / PFS_control >= 1.0
    attention: str = "press"  # "ESMO"|"FDA_CR"|"FDA_approval"|"BTD_viral"|"press"
    realized_move_pct: float | None = None  # fill only for backtests


# === Core, monotone features -> score (0..100) ===


def _impact(event_type: str) -> float:
    """
    Calculate impact score based on event type.

    Phase 3/CRL/Approval are "highest impact" discrete catalysts.

    Args:
        event_type: Type of catalyst event

    Returns:
        Impact score (0.0 to 1.0)
    """
    table = {
        "Phase3_readout": 1.0,
        "CRL": 1.0,
        "Approval": 0.9,
        "Phase2_readout": 0.8,
        "BTD": 0.7,
    }
    return table.get(event_type, 0.5)


def _surprise(e: CatalystEvent) -> float:
    """
    Calculate surprise score.

    When effect_ratio is present, maps it monotonically to (0,1) via logistic.
    Otherwise uses event-type priors.

    Args:
        e: CatalystEvent object

    Returns:
        Surprise score (0.0 to 1.0)
    """
    # When effect_ratio is present, map it monotonically to (0,1) via logistic
    if e.effect_ratio is not None and math.isfinite(e.effect_ratio):
        r = max(1.0, float(e.effect_ratio))
        return 1.0 - math.exp(-0.8 * (r - 1.0))  # r=2->~0.55-0.65 ; r=4->~0.86

    # Otherwise use event-type priors (interpretable):
    return {"CRL": 0.65, "Approval": 0.20, "BTD": 0.75}.get(e.event_type, 0.50)


def _attention(attn: str) -> float:
    """
    Calculate attention score based on channel.

    ESMO/major conferences and BTDs boost score due to visibility & liquidity influx.

    Args:
        attn: Attention channel

    Returns:
        Attention score (0.0 to 1.0)
    """
    return {
        "ESMO": 1.0,
        "FDA_CR": 0.9,
        "FDA_approval": 0.85,
        "BTD_viral": 1.0,
        "press": 0.7,
    }.get(attn, 0.7)


def _asymmetry(cap_tier: str) -> float:
    """
    Calculate asymmetry score based on market cap tier.

    Micro-caps have highest asymmetry (potential for outsized moves).

    Args:
        cap_tier: Market cap tier

    Returns:
        Asymmetry score (0.0 to 1.0)
    """
    return {"micro": 0.9, "smid": 0.7, "large": 0.3}.get(cap_tier, 0.6)


def mvm_score(e: CatalystEvent) -> float:
    """
    Calculate Market-Moving (MVM) score (0-100).

    Weighted combination of:
    - Impact (40%): Event type importance
    - Surprise (30%): Effect size or event-type prior
    - Attention (15%): Visibility channel
    - Asymmetry (15%): Cap-tier potential for large moves

    Args:
        e: CatalystEvent object

    Returns:
        MVM score (0.0 to 100.0)
    """
    s = (
        0.4 * _impact(e.event_type)
        + 0.3 * _surprise(e)
        + 0.15 * _attention(e.attention)
        + 0.15 * _asymmetry(e.cap_tier)
    )
    return round(100.0 * s, 1)


def trade_playbook(e: CatalystEvent, score: float) -> dict[str, str]:
    """
    Generate trade playbook recommendation.

    Recommends strategy based on MVM score band:
    - High (70+): Long gamma into event
    - Medium (60-69): Directional with defined risk
    - Low (<60): Sell premium / fade IV

    Args:
        e: CatalystEvent object
        score: MVM score

    Returns:
        Dict with expected_direction and stance
    """
    # Direction guess from event-type
    expected_dir = "Down" if e.event_type == "CRL" else "Up"

    if score >= 70:
        stance = f"Long gamma into event; add directional {expected_dir} bias if fundamentals support"
    elif score >= 60:
        stance = f"Directionally {expected_dir} with defined risk OR modest long gamma; avoid premium selling"
    else:
        stance = "Sell premium / fade IV into event; low likelihood of outsized move"

    return {"expected_direction": expected_dir, "stance": stance}


def score_events(events: list[CatalystEvent]) -> list[dict]:
    """
    Score multiple catalyst events.

    Args:
        events: List of CatalystEvent objects

    Returns:
        List of dicts with scoring results
    """
    output = []
    for e in events:
        score = mvm_score(e)
        play = trade_playbook(e, score)
        output.append(
            {
                "ticker": e.ticker,
                "date": e.date,
                "event_type": e.event_type,
                "mvm_score": score,
                "expected_direction": play["expected_direction"],
                "stance": play["stance"],
                "note": e.note,
            }
        )
    return output


# === Backtest on five RECENT real events (no placeholders) ===


def _recent_2025_events() -> list[CatalystEvent]:
    """
    Recent 2025 catalyst events for backtesting.

    All events documented with sources and realized moves.

    Returns:
        List of CatalystEvent objects with realized moves
    """
    return [
        # Sources: MarketWatch + SA (+52% pre, ~40-47% intraday);
        # PFS 9.3 vs ~2.0 mo (Reuters 7/28/25)
        CatalystEvent(
            "CELC",
            "Celcuity",
            "2025-10-20",
            "Phase3_readout",
            "ESMO VIKTORIA-1; PFS 9.3 vs 2.0 mo; large PFS delta; record highs",
            cap_tier="micro",
            effect_ratio=9.3 / 2.0,
            attention="ESMO",
            realized_move_pct=52.0,
        ),
        # Sources: Barron's (1,378%), company PR confirms BTD
        CatalystEvent(
            "SPRB",
            "Spruce Biosciences",
            "2025-10-06",
            "BTD",
            "FDA Breakthrough Therapy (MPS IIIB) — viral microcap shock",
            cap_tier="micro",
            effect_ratio=None,
            attention="BTD_viral",
            realized_move_pct=1378.0,
        ),
        # Sources: Reuters (+70% AH); RTT (+81% AH); PFS 5.52 vs 2.66 mo
        CatalystEvent(
            "INBX",
            "Inhibrx Biosciences",
            "2025-10-23",
            "Phase2_readout",
            "ChonDRAgon PFS 5.52 vs 2.66 mo in chondrosarcoma",
            cap_tier="micro",
            effect_ratio=5.52 / 2.66,
            attention="press",
            realized_move_pct=70.0,
        ),
        # Sources: Reuters (-12% pre) / company CRL (Catalent Indiana CMC observation)
        CatalystEvent(
            "SRRK",
            "Scholar Rock",
            "2025-09-23",
            "CRL",
            "CRL due to Catalent Indiana CMC observation; not efficacy-related",
            cap_tier="smid",
            effect_ratio=None,
            attention="FDA_CR",
            realized_move_pct=-12.0,
        ),
        # Sources: Investing.com/Reuters (+1.1% intraday) — approval largely anticipated
        CatalystEvent(
            "IONS",
            "Ionis",
            "2025-08-21",
            "Approval",
            "FDA approval (Dawnzera; HAE); expected; minimal price reaction",
            cap_tier="large",
            effect_ratio=None,
            attention="FDA_approval",
            realized_move_pct=1.1,
        ),
    ]


def mini_backtest() -> dict:
    """
    Run mini backtest on recent 2025 events.

    Evaluates predictions vs |move| >= 7% threshold.

    Returns:
        Dict with table of predictions and metrics
    """
    ev = _recent_2025_events()
    preds = score_events(ev)

    # Evaluate vs |move|>=7%
    hits, preds_pos, reals_pos, dir_hits = 0, 0, 0, 0
    rows = []

    for e, p in zip(ev, preds):
        pred_mover = 1 if p["mvm_score"] >= 60 else 0
        real_mover = 1 if abs(e.realized_move_pct or 0) >= 7.0 else 0

        if pred_mover:
            preds_pos += 1
        if real_mover:
            reals_pos += 1
        if pred_mover and real_mover:
            hits += 1

        # direction scoring
        sign_ok = (e.realized_move_pct > 0 and p["expected_direction"] == "Up") or (
            e.realized_move_pct < 0 and p["expected_direction"] == "Down"
        )
        dir_hits += 1 if sign_ok else 0

        rows.append(
            {
                **p,
                "realized_move_pct": e.realized_move_pct,
                "pred_mover": pred_mover,
                "real_mover": real_mover,
                "direction_hit": int(sign_ok),
            }
        )

    precision = hits / max(preds_pos, 1)
    recall = hits / max(reals_pos, 1)
    acc = sum(r["pred_mover"] == r["real_mover"] for r in rows) / len(rows)

    return {
        "table": rows,
        "metrics": {
            "n_events": len(rows),
            "n_real_movers": reals_pos,
            "n_pred_movers": preds_pos,
            "precision": round(precision, 2),
            "recall": round(recall, 2),
            "accuracy": round(acc, 2),
            "direction_hit_rate": round(dir_hits / len(rows), 2),
        },
    }


# === Example upcoming predictions (open sources only) ===


def upcoming_watchlist() -> list[CatalystEvent]:
    """
    Upcoming catalyst watchlist with open-source predictions.

    Returns:
        List of CatalystEvent objects for upcoming events
    """
    # 1) ARWR — plozasiran (FCS) PDUFA 2025-11-18
    # Sources: ARWR IR Jan 17, 2025 PDUFA PR; Yahoo/PharmacyTimes overview;
    # Reuters litigation item
    arwr = CatalystEvent(
        "ARWR",
        "Arrowhead",
        "2025-11-18",
        "Approval",
        "Plozasiran PDUFA (FCS). First-in-class RNAi competitor to Ionis' "
        "approved Tryngolza; IP overhang.",
        cap_tier="smid",
        effect_ratio=None,
        attention="FDA_approval",
    )

    # 2) Otsuka — sibeprenlimab (IgAN) PDUFA 2025-11-28
    # Sources: Otsuka US PR 5/27/25 (priority review);
    # Phase 3 interim 51% proteinuria reduction (Otsuka/ERA slides)
    otsuka = CatalystEvent(
        "OTSKF",
        "Otsuka",
        "2025-11-28",
        "Approval",
        "Sibeprenlimab PDUFA (IgAN, APRIL mAb). Priority review; robust Phase 3 "
        "proteinuria reduction.",
        cap_tier="large",
        effect_ratio=None,
        attention="FDA_approval",
    )

    return [arwr, otsuka]


if __name__ == "__main__":
    # Local quick run:
    from pprint import pprint

    print("Backtest on recent 2025 events:")
    pprint(mini_backtest())
    print("\nUpcoming watchlist predictions:")
    pprint(score_events(upcoming_watchlist()))
