"""
Transparent Chart Specifications
=================================

Vega-Lite JSON specifications for catalyst visualizations.
All charts render with transparent backgrounds (alpha=0.0).

Chart types:
1. Expectation Band with Outcome (bar with rule overlay)
2. Market Reaction Timeline (line chart with annotations)
3. Peer Comparison Bar (horizontal bars with median line)
4. IV Spike Chart (area chart with z-score annotations)
"""

from typing import Any


def expectation_outcome_bar_chart(
    metric_name: str,
    expected_value: float,
    band_low: float,
    band_high: float,
    actual_value: float,
    unit: str,
    delta_class: str = "inline"
) -> dict[str, Any]:
    """
    Generate Vega-Lite spec for expectation band vs actual outcome.

    Visualization:
    - Expectation band shown as dashed rule
    - Actual outcome shown as solid bar/point
    - Gold color for expectation, white/green/red for outcome based on delta_class

    Args:
        metric_name: Name of metric (e.g., "α-DG glycosylation")
        expected_value: Point estimate
        band_low: Lower bound
        band_high: Upper bound
        actual_value: Actual measured value
        unit: Unit of measurement (e.g., "×", "%", "m/s")
        delta_class: "beat", "inline", or "miss"

    Returns:
        Vega-Lite JSON specification
    """

    outcome_color = {
        "beat": "#00FF00",  # Green
        "inline": "#FFFFFF",  # White
        "miss": "#FF0000"  # Red
    }.get(delta_class, "#FFFFFF")

    spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 400,
        "height": 150,
        "background": None,  # Transparent
        "config": {
            "background": None,
            "view": {"stroke": None}
        },
        "layer": [
            # Expectation band (dashed rule)
            {
                "data": {
                    "values": [
                        {"label": metric_name, "low": band_low, "high": band_high}
                    ]
                },
                "mark": {
                    "type": "rule",
                    "strokeDash": [4, 4],
                    "color": "#FF9500",  # Gold
                    "strokeWidth": 3
                },
                "encoding": {
                    "y": {"field": "label", "type": "nominal", "axis": {"labelColor": "#FFFFFF", "titleColor": "#FFFFFF"}},
                    "x": {"field": "low", "type": "quantitative", "scale": {"zero": False}},
                    "x2": {"field": "high"}
                }
            },
            # Expected value point
            {
                "data": {
                    "values": [
                        {"label": metric_name, "value": expected_value, "type": "Expected"}
                    ]
                },
                "mark": {
                    "type": "point",
                    "filled": False,
                    "size": 100,
                    "color": "#FF9500",
                    "strokeWidth": 2
                },
                "encoding": {
                    "y": {"field": "label", "type": "nominal"},
                    "x": {"field": "value", "type": "quantitative", "title": f"Value ({unit})"}
                }
            },
            # Actual outcome
            {
                "data": {
                    "values": [
                        {"label": metric_name, "value": actual_value, "type": "Actual"}
                    ]
                },
                "mark": {
                    "type": "point",
                    "filled": True,
                    "size": 150,
                    "color": outcome_color,
                    "strokeWidth": 0
                },
                "encoding": {
                    "y": {"field": "label", "type": "nominal"},
                    "x": {"field": "value", "type": "quantitative"}
                }
            },
            # Value labels
            {
                "data": {
                    "values": [
                        {"label": metric_name, "value": actual_value, "text": f"{actual_value:.2f}", "offset": 20}
                    ]
                },
                "mark": {
                    "type": "text",
                    "align": "left",
                    "dx": 10,
                    "color": "#FFFFFF",
                    "fontSize": 12,
                    "fontWeight": "bold"
                },
                "encoding": {
                    "y": {"field": "label", "type": "nominal"},
                    "x": {"field": "value", "type": "quantitative"},
                    "text": {"field": "text", "type": "nominal"}
                }
            }
        ]
    }

    return spec


def market_reaction_timeline_chart(
    ticker: str,
    price_reactions: list[dict[str, Any]]
) -> dict[str, Any]:
    """
    Generate Vega-Lite spec for market reaction timeline.

    Visualization:
    - Line chart showing price change over D-5 to D+10
    - Vertical line at D0 (event day)
    - Transparent background, white line

    Args:
        ticker: Stock ticker symbol
        price_reactions: List of {window, abs, rel_vs_XBI} dicts

    Returns:
        Vega-Lite JSON specification
    """

    # Convert window strings to numeric offsets for plotting
    window_to_offset = {
        "D-5": -5, "D-1": -1, "D0": 0, "D+1": 1, "D+5": 5, "D+10": 10
    }

    data_values = [
        {
            "window": pr["window"],
            "offset": window_to_offset.get(pr["window"], 0),
            "price_change": pr["abs"],
            "rel_vs_xbi": pr["rel_vs_XBI"]
        }
        for pr in price_reactions
    ]

    spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 500,
        "height": 200,
        "background": None,
        "config": {
            "background": None,
            "view": {"stroke": None}
        },
        "layer": [
            # Price change line
            {
                "data": {"values": data_values},
                "mark": {
                    "type": "line",
                    "color": "#00D4FF",  # Cyan
                    "strokeWidth": 3,
                    "point": {
                        "filled": True,
                        "size": 80,
                        "color": "#00D4FF"
                    }
                },
                "encoding": {
                    "x": {
                        "field": "offset",
                        "type": "quantitative",
                        "title": "Days from Event",
                        "axis": {"labelColor": "#FFFFFF", "titleColor": "#FFFFFF", "gridColor": "#333333"}
                    },
                    "y": {
                        "field": "price_change",
                        "type": "quantitative",
                        "title": f"{ticker} Price Change (%)",
                        "axis": {"labelColor": "#FFFFFF", "titleColor": "#FFFFFF", "gridColor": "#333333"}
                    }
                }
            },
            # Event day vertical line
            {
                "data": {"values": [{"offset": 0}]},
                "mark": {
                    "type": "rule",
                    "color": "#FF9500",  # Gold
                    "strokeWidth": 2,
                    "strokeDash": [5, 5]
                },
                "encoding": {
                    "x": {"field": "offset", "type": "quantitative"}
                }
            },
            # Event day label
            {
                "data": {"values": [{"offset": 0, "label": "Event Day"}]},
                "mark": {
                    "type": "text",
                    "align": "center",
                    "dy": -10,
                    "color": "#FF9500",
                    "fontSize": 12,
                    "fontWeight": "bold"
                },
                "encoding": {
                    "x": {"field": "offset", "type": "quantitative"},
                    "y": {"value": 0},
                    "text": {"field": "label", "type": "nominal"}
                }
            }
        ]
    }

    return spec


def peer_comparison_bar_chart(
    metric_name: str,
    primary_ticker: str,
    primary_value: float,
    peer_median: float,
    peer_comparisons: list[dict[str, Any]],
    unit: str = "%"
) -> dict[str, Any]:
    """
    Generate Vega-Lite spec for peer comparison horizontal bars.

    Visualization:
    - Horizontal bars for each company
    - Median line overlay
    - Primary company highlighted in cyan

    Args:
        metric_name: Name of metric being compared
        primary_ticker: Primary company ticker (highlighted)
        primary_value: Primary company's value
        peer_median: Median value across peers
        peer_comparisons: List of peer data dicts
        unit: Unit of measurement

    Returns:
        Vega-Lite JSON specification
    """

    # Prepare data
    data_values = [
        {
            "ticker": primary_ticker,
            "value": primary_value,
            "is_primary": True
        }
    ]

    for peer in peer_comparisons:
        data_values.append({
            "ticker": peer["ticker"],
            "value": peer.get("value", 0),
            "is_primary": False
        })

    spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 400,
        "height": 250,
        "background": None,
        "config": {
            "background": None,
            "view": {"stroke": None}
        },
        "layer": [
            # Bars
            {
                "data": {"values": data_values},
                "mark": {
                    "type": "bar",
                    "cornerRadiusEnd": 4
                },
                "encoding": {
                    "y": {
                        "field": "ticker",
                        "type": "nominal",
                        "title": None,
                        "axis": {"labelColor": "#FFFFFF", "labelFontSize": 12},
                        "sort": "-x"
                    },
                    "x": {
                        "field": "value",
                        "type": "quantitative",
                        "title": f"{metric_name} ({unit})",
                        "axis": {"labelColor": "#FFFFFF", "titleColor": "#FFFFFF", "gridColor": "#333333"}
                    },
                    "color": {
                        "field": "is_primary",
                        "type": "nominal",
                        "scale": {
                            "domain": [True, False],
                            "range": ["#00D4FF", "#666666"]  # Cyan for primary, gray for peers
                        },
                        "legend": None
                    }
                }
            },
            # Median line
            {
                "data": {"values": [{"median": peer_median}]},
                "mark": {
                    "type": "rule",
                    "color": "#FF9500",  # Gold
                    "strokeWidth": 2,
                    "strokeDash": [5, 5]
                },
                "encoding": {
                    "x": {"field": "median", "type": "quantitative"}
                }
            },
            # Median label
            {
                "data": {"values": [{"median": peer_median, "label": f"Median: {peer_median:.1f}{unit}"}]},
                "mark": {
                    "type": "text",
                    "align": "right",
                    "dy": -10,
                    "color": "#FF9500",
                    "fontSize": 11
                },
                "encoding": {
                    "x": {"field": "median", "type": "quantitative"},
                    "y": {"value": 0},
                    "text": {"field": "label", "type": "nominal"}
                }
            },
            # Value labels on bars
            {
                "data": {"values": data_values},
                "mark": {
                    "type": "text",
                    "align": "right",
                    "dx": -5,
                    "color": "#FFFFFF",
                    "fontSize": 11
                },
                "encoding": {
                    "y": {"field": "ticker", "type": "nominal"},
                    "x": {"field": "value", "type": "quantitative"},
                    "text": {"field": "value", "type": "quantitative", "format": ".1f"}
                }
            }
        ]
    }

    return spec


def iv_spike_chart(
    ticker: str,
    iv_data: list[dict[str, Any]]
) -> dict[str, Any]:
    """
    Generate Vega-Lite spec for implied volatility spike chart.

    Visualization:
    - Area chart showing IV over time
    - Z-score annotations
    - Transparent background

    Args:
        ticker: Stock ticker
        iv_data: List of {window, iv, zscore_vs_1y} dicts

    Returns:
        Vega-Lite JSON specification
    """

    spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 400,
        "height": 150,
        "background": None,
        "config": {
            "background": None,
            "view": {"stroke": None}
        },
        "data": {"values": iv_data},
        "layer": [
            # IV area
            {
                "mark": {
                    "type": "area",
                    "color": "#A855F7",  # Purple
                    "opacity": 0.5,
                    "line": {
                        "color": "#A855F7",
                        "strokeWidth": 2
                    }
                },
                "encoding": {
                    "x": {
                        "field": "window",
                        "type": "nominal",
                        "title": "Window",
                        "axis": {"labelColor": "#FFFFFF", "titleColor": "#FFFFFF"}
                    },
                    "y": {
                        "field": "iv",
                        "type": "quantitative",
                        "title": f"{ticker} Implied Volatility (%)",
                        "axis": {"labelColor": "#FFFFFF", "titleColor": "#FFFFFF", "gridColor": "#333333"}
                    }
                }
            },
            # Z-score labels
            {
                "mark": {
                    "type": "text",
                    "align": "center",
                    "dy": -15,
                    "color": "#FFFFFF",
                    "fontSize": 10
                },
                "encoding": {
                    "x": {"field": "window", "type": "nominal"},
                    "y": {"field": "iv", "type": "quantitative"},
                    "text": {
                        "field": "zscore_vs_1y",
                        "type": "quantitative",
                        "format": "+.1f"
                    }
                }
            }
        ]
    }

    return spec


# ============================================================================
# Quadrant Slide Layout Data Structure
# ============================================================================

def generate_quadrant_slide_spec(
    catalyst_event: dict[str, Any]
) -> dict[str, Any]:
    """
    Generate quadrant slide layout specification.

    Quadrant layout:
    1. Headline + TL;DR (top-left)
    2. Key Metrics / Charts (top-right)
    3. Street vs Outcome (Expectation Delta) + Stock Reaction (bottom-left)
    4. Competitive Read-through & Next Steps (bottom-right)

    Args:
        catalyst_event: Full catalyst event data structure

    Returns:
        Quadrant slide specification with chart references
    """

    company = catalyst_event["company"]
    catalyst = catalyst_event["catalyst"]
    expectations = catalyst_event["expectations"]
    outcome = catalyst_event["outcome"]
    market_reaction = catalyst_event["market_reaction"]
    peers = catalyst_event["peers"]

    # Quadrant 1: Headline + TL;DR
    headline = f"{company['ticker']} {catalyst['type']}: {catalyst['program']}"

    # Generate TL;DR from expectation deltas
    tl_dr_points = []
    for exp_metric in expectations["metrics"][:3]:  # Top 3 metrics
        metric_name = exp_metric["name"]
        outcome_metric = next(
            (om for om in outcome["metrics"] if om["name"] == metric_name),
            None
        )
        if outcome_metric:
            tl_dr_points.append(
                f"{metric_name}: {outcome_metric['value']} {outcome_metric['unit']}"
            )

    # Quadrant 2: Key Metrics / Charts
    metric_charts = [
        expectation_outcome_bar_chart(
            metric_name=exp["name"],
            expected_value=exp.get("expected", 0),
            band_low=exp.get("band_low", 0),
            band_high=exp.get("band_high", 0),
            actual_value=next(
                (om["value"] for om in outcome["metrics"] if om["name"] == exp["name"]),
                0
            ),
            unit=exp["unit"],
            delta_class="inline"
        )
        for exp in expectations["metrics"][:2]  # Top 2 metrics
    ]

    # Quadrant 3: Street vs Outcome + Stock Reaction
    stock_reaction_chart = market_reaction_timeline_chart(
        ticker=company["ticker"],
        price_reactions=market_reaction["price"]
    )

    # Quadrant 4: Competitive Read-through
    if peers["list"]:
        peer_chart = peer_comparison_bar_chart(
            metric_name=peers["comp_metrics"][0]["metric"] if peers["comp_metrics"] else "Comparison",
            primary_ticker=company["ticker"],
            primary_value=peers["comp_metrics"][0]["value"] if peers["comp_metrics"] else 0,
            peer_median=peers["comp_metrics"][0]["peer_median"] if peers["comp_metrics"] else 0,
            peer_comparisons=peers["list"],
            unit="%"
        )
    else:
        peer_chart = None

    quadrant_spec = {
        "catalyst_event_id": catalyst_event["event_id"],
        "generated_at": catalyst_event["as_of"],
        "layout": "quadrant",
        "quadrants": {
            "q1_headline": {
                "title": headline,
                "tl_dr": tl_dr_points,
                "position": "top-left"
            },
            "q2_metrics": {
                "title": "Key Metrics",
                "charts": metric_charts,
                "position": "top-right"
            },
            "q3_reaction": {
                "title": "Street vs Outcome + Stock Reaction",
                "expectation_delta_summary": {
                    "total_metrics": len(expectations["metrics"]),
                    "beat_count": 0,  # To be computed
                    "inline_count": 0,
                    "miss_count": 0
                },
                "stock_reaction_chart": stock_reaction_chart,
                "position": "bottom-left"
            },
            "q4_competitive": {
                "title": "Competitive Read-through & Next Steps",
                "peer_chart": peer_chart,
                "moat_axes": peers["moat_axes"],
                "next_steps": [
                    "Monitor peer reactions",
                    "Track follow-on catalysts",
                    "Update probability of success"
                ],
                "position": "bottom-right"
            }
        },
        "footer": {
            "sources": [
                f"{source['title']} ({source['ts']})"
                for source in catalyst_event.get("sources", [])
            ]
        }
    }

    return quadrant_spec


if __name__ == "__main__":
    # Example usage
    from bt_platform.core.seed_catalyst_examples import CATALYST_2_BBIO_FORTIFY

    print("Example 1: Expectation vs Outcome Chart")
    print("=" * 70)
    spec = expectation_outcome_bar_chart(
        metric_name="α-DG glycosylation",
        expected_value=1.5,
        band_low=1.3,
        band_high=1.6,
        actual_value=1.8,
        unit="×",
        delta_class="beat"
    )
    print("Chart type: Expectation Band")
    print(f"Background: {spec['background']}")
    print(f"Layers: {len(spec['layer'])}")

    print("\n" + "=" * 70 + "\n")

    print("Example 2: Quadrant Slide Specification")
    print("=" * 70)
    quadrant = generate_quadrant_slide_spec(CATALYST_2_BBIO_FORTIFY)
    print(f"Catalyst: {quadrant['quadrants']['q1_headline']['title']}")
    print(f"TL;DR points: {len(quadrant['quadrants']['q1_headline']['tl_dr'])}")
    print(f"Metric charts: {len(quadrant['quadrants']['q2_metrics']['charts'])}")
    print(f"Sources: {len(quadrant['footer']['sources'])}")
