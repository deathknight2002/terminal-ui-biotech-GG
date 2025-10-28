"""
Seed Catalyst Examples

Implements the 5 concrete catalyst examples from the problem statement:
1. Novartis → Avidity ($12B M&A)
2. BridgeBio FORTIFY (BBP-418)
3. Intellia MAGNITUDE Pause
4. Bayer Lynkuet Approval
5. Lilly Omvoh (single-injection label)
"""

from datetime import datetime, date
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# 1) Novartis → Avidity M&A Example
# ============================================================================

NOVARTIS_AVIDITY_EVENT = {
    "event_id": "01J9Z3XAMPLE00000000000001",
    "as_of": "2025-10-27T14:30:00Z",
    "company": {
        "name": "Novartis",
        "ticker": "NVS",
        "exchange": "NYSE",
        "logo_url": "https://logo.clearbit.com/novartis.com"
    },
    "catalyst": {
        "type": "M&A",
        "subtype": "TenderOffer",
        "program": "AOC platform",
        "indication": "Neuromuscular RNA",
        "geography": ["Global"]
    },
    "expectations": {
        "source": "sell_side",
        "metrics": [
            {
                "name": "Deal Premium",
                "unit": "%",
                "expected": 30,
                "band_low": 20,
                "band_high": 40,
                "what_matters": "Signal on RNA appetite"
            },
            {
                "name": "EV/Sales (Target, NTM)",
                "unit": "x",
                "expected": None,
                "band_low": None,
                "band_high": None,
                "what_matters": "R&D asset pricing"
            },
            {
                "name": "SpinCo Required",
                "unit": "bool",
                "expected": False,
                "band_low": None,
                "band_high": None,
                "what_matters": "Deal structure complexity"
            }
        ]
    },
    "outcome": {
        "metrics": [
            {
                "name": "Deal Premium",
                "unit": "%",
                "value": 46
            },
            {
                "name": "Consideration",
                "unit": "$B",
                "value": 12.0
            },
            {
                "name": "SpinCo Required",
                "unit": "bool",
                "value": True
            }
        ]
    },
    "market_reaction": {
        "price": [
            {
                "window": "D0",
                "abs": 3.0,
                "rel_vs_XBI": 2.1
            },
            {
                "window": "D+1",
                "abs": 4.5,
                "rel_vs_XBI": 3.2
            }
        ],
        "iv": [
            {
                "tenor": "1m",
                "window": "D0",
                "iv": 28.1,
                "zscore_vs_1y": 0.9
            }
        ]
    },
    "peers": {
        "moat_axes": ["MoA", "Stage", "Indication", "Delivery", "Target"],
        "list": [
            {
                "ticker": "DYNE",
                "reason_tag": "RNA muscle peer",
                "weight": 0.5
            },
            {
                "ticker": "PEPG",
                "reason_tag": "AOC-adjacent",
                "weight": 0.3
            }
        ],
        "comp_metrics": [
            {
                "metric": "1D move post-print",
                "value": 2.8,
                "peer_median": 4.2,
                "peer_p75": 6.0,
                "delta_to_median": -1.4
            }
        ]
    },
    "sources": [
        {
            "title": "Reuters deal note",
            "url": "https://reuters.com/novartis-avidity-12b-deal",
            "ts": "2025-10-27T13:00:00Z",
            "type": "news_wire"
        },
        {
            "title": "Company PR",
            "url": "https://novartis.com/news/avidity-acquisition",
            "ts": "2025-10-27T12:30:00Z",
            "type": "press_release"
        }
    ]
}


# ============================================================================
# 2) BridgeBio FORTIFY Example
# ============================================================================

BRIDGEBIO_FORTIFY_EVENT = {
    "event_id": "01J9Z3XAMPLE00000000000002",
    "as_of": "2025-10-26T08:00:00Z",
    "company": {
        "name": "BridgeBio Pharma",
        "ticker": "BBIO",
        "exchange": "NASDAQ",
        "logo_url": "https://logo.clearbit.com/bridgebio.com"
    },
    "catalyst": {
        "type": "PH3_READOUT",
        "subtype": "Interim",
        "program": "BBP-418 FORTIFY",
        "indication": "LGMD2I/R9",
        "geography": ["US", "EU"]
    },
    "expectations": {
        "source": "consensus",
        "metrics": [
            {
                "name": "α-DG glycosylation",
                "unit": "× at 3m",
                "expected": 1.5,
                "band_low": 1.3,
                "band_high": 1.6,
                "what_matters": "Biomarker restoration shows MOA"
            },
            {
                "name": "CK reduction",
                "unit": "%",
                "expected": 60,
                "band_low": 50,
                "band_high": 70,
                "what_matters": "Muscle damage biomarker"
            },
            {
                "name": "Velocity Δ vs PBO",
                "unit": "m/s",
                "expected": 0.20,
                "band_low": 0.10,
                "band_high": 0.25,
                "what_matters": "Functional endpoint"
            },
            {
                "name": "FVC Δ vs PBO",
                "unit": "pp",
                "expected": 4,
                "band_low": 2,
                "band_high": 5,
                "what_matters": "Respiratory function"
            }
        ]
    },
    "outcome": {
        "metrics": [
            {
                "name": "α-DG glycosylation",
                "unit": "× at 3m",
                "value": 1.8,
                "window": "@3m"
            },
            {
                "name": "CK reduction",
                "unit": "%",
                "value": 82,
                "window": "@12m"
            },
            {
                "name": "Velocity Δ vs PBO",
                "unit": "m/s",
                "value": 0.27,
                "pvalue": 0.03,
                "n": 38
            },
            {
                "name": "FVC Δ vs PBO",
                "unit": "pp",
                "value": 5.0,
                "pvalue": 0.02,
                "n": 38
            }
        ]
    },
    "market_reaction": {
        "price": [
            {
                "window": "D0",
                "abs": 18.5,
                "rel_vs_XBI": 16.8
            },
            {
                "window": "D+1",
                "abs": 22.3,
                "rel_vs_XBI": 20.1
            },
            {
                "window": "D+5",
                "abs": 25.0,
                "rel_vs_XBI": 22.0
            }
        ],
        "iv": [
            {
                "tenor": "1m",
                "window": "D-7",
                "iv": 85.0,
                "zscore_vs_1y": 1.8
            },
            {
                "tenor": "1m",
                "window": "D0",
                "iv": 110.0,
                "zscore_vs_1y": 2.5
            }
        ],
        "vol": [
            {
                "window": "D0",
                "volume_multiple_vs_30d": 8.2
            }
        ]
    },
    "peers": {
        "moat_axes": ["MoA", "Stage", "Indication"],
        "list": [
            {
                "ticker": "SRPT",
                "reason_tag": "Muscular dystrophy leader",
                "weight": 0.6
            },
            {
                "ticker": "DYNE",
                "reason_tag": "Rare muscle disease",
                "weight": 0.4
            }
        ],
        "comp_metrics": [
            {
                "metric": "D0 CAR",
                "value": 18.5,
                "peer_median": 12.0,
                "peer_p75": 15.5,
                "delta_to_median": 6.5
            }
        ]
    },
    "sources": [
        {
            "title": "BridgeBio FORTIFY Interim Data PR",
            "url": "https://bridgebio.com/fortify-interim",
            "ts": "2025-10-26T07:00:00Z",
            "type": "press_release"
        },
        {
            "title": "Cohort N=38, 3m and 12m data",
            "url": "https://bridgebio.com/fortify-data",
            "ts": "2025-10-26T07:00:00Z",
            "type": "company_pr"
        }
    ]
}


# ============================================================================
# 3) Intellia MAGNITUDE Pause Example
# ============================================================================

INTELLIA_MAGNITUDE_EVENT = {
    "event_id": "01J9Z3XAMPLE00000000000003",
    "as_of": "2025-10-25T16:45:00Z",
    "company": {
        "name": "Intellia Therapeutics",
        "ticker": "NTLA",
        "exchange": "NASDAQ",
        "logo_url": "https://logo.clearbit.com/intelliatx.com"
    },
    "catalyst": {
        "type": "SAFETY_PAUSE",
        "subtype": "Hold/Partial",
        "program": "nex-z",
        "indication": "In vivo CRISPR",
        "geography": ["US"]
    },
    "expectations": {
        "source": "internal",
        "metrics": [
            {
                "name": "Safety SAE Grade",
                "unit": "CTCAE",
                "expected": 2,
                "band_low": 1,
                "band_high": 3,
                "what_matters": "Acceptable safety profile"
            },
            {
                "name": "Class-wide hepatotoxicity probability",
                "unit": "%",
                "expected": 2,
                "band_low": 1,
                "band_high": 3,
                "what_matters": "Known class risk"
            },
            {
                "name": "Pause duration",
                "unit": "weeks",
                "expected": 4,
                "band_low": 2,
                "band_high": 8,
                "what_matters": "Trial resumption timeline"
            }
        ]
    },
    "outcome": {
        "metrics": [
            {
                "name": "Safety SAE Grade",
                "unit": "CTCAE",
                "value": 4
            },
            {
                "name": "Signal Type",
                "unit": "enum",
                "value": "hepatotoxicity"
            },
            {
                "name": "Enrollment Status",
                "unit": "enum",
                "value": "paused"
            }
        ]
    },
    "market_reaction": {
        "price": [
            {
                "window": "D0",
                "abs": -28.5,
                "rel_vs_XBI": -26.0
            },
            {
                "window": "D+1",
                "abs": -32.0,
                "rel_vs_XBI": -29.5
            }
        ],
        "iv": [
            {
                "tenor": "1m",
                "window": "D0",
                "iv": 95.0,
                "zscore_vs_1y": 3.2
            }
        ],
        "vol": [
            {
                "window": "D0",
                "volume_multiple_vs_30d": 12.5
            }
        ]
    },
    "peers": {
        "moat_axes": ["MoA", "Modality"],
        "list": [
            {
                "ticker": "CRSP",
                "reason_tag": "In vivo CRISPR competitor",
                "weight": 0.7
            },
            {
                "ticker": "BEAM",
                "reason_tag": "Base editing alternative",
                "weight": 0.3
            },
            {
                "ticker": "VERV",
                "reason_tag": "In vivo editing peer",
                "weight": 0.4
            }
        ],
        "comp_metrics": [
            {
                "metric": "D0 CAR",
                "value": -28.5,
                "peer_median": -8.0,
                "peer_p25": -12.0,
                "peer_p75": -4.0,
                "delta_to_median": -20.5
            }
        ]
    },
    "sources": [
        {
            "title": "Intellia Announces Clinical Hold",
            "url": "https://intelliatx.com/magnitude-hold",
            "ts": "2025-10-25T16:00:00Z",
            "type": "press_release"
        }
    ]
}


# ============================================================================
# 4) Bayer Lynkuet Approval Example
# ============================================================================

BAYER_LYNKUET_EVENT = {
    "event_id": "01J9Z3XAMPLE00000000000004",
    "as_of": "2025-10-24T10:00:00Z",
    "company": {
        "name": "Bayer",
        "ticker": "BAYRY",
        "exchange": "OTC",
        "logo_url": "https://logo.clearbit.com/bayer.com"
    },
    "catalyst": {
        "type": "APPROVAL",
        "subtype": "FDA",
        "program": "Elinzanetant",
        "indication": "Menopause VMS",
        "geography": ["US"]
    },
    "expectations": {
        "source": "consensus",
        "metrics": [
            {
                "name": "VMS frequency change @4w",
                "unit": "events/day",
                "expected": -3.5,
                "band_low": -4.0,
                "band_high": -3.0,
                "what_matters": "Primary endpoint vs Veozah"
            },
            {
                "name": "VMS frequency change @12w",
                "unit": "events/day",
                "expected": -4.8,
                "band_low": -5.5,
                "band_high": -4.0,
                "what_matters": "Sustained efficacy"
            },
            {
                "name": "Hepatic monitoring required",
                "unit": "bool",
                "expected": True,
                "band_low": None,
                "band_high": None,
                "what_matters": "Safety labeling burden"
            }
        ]
    },
    "outcome": {
        "metrics": [
            {
                "name": "VMS frequency change @4w",
                "unit": "events/day",
                "value": -3.8,
                "pvalue": 0.001,
                "n": 412
            },
            {
                "name": "VMS frequency change @12w",
                "unit": "events/day",
                "value": -5.2,
                "pvalue": 0.001,
                "n": 412
            },
            {
                "name": "FDA Approval",
                "unit": "bool",
                "value": True
            }
        ]
    },
    "market_reaction": {
        "price": [
            {
                "window": "D0",
                "abs": 2.8,
                "rel_vs_XBI": 1.5
            },
            {
                "window": "D+1",
                "abs": 3.2,
                "rel_vs_XBI": 2.0
            }
        ]
    },
    "peers": {
        "moat_axes": ["Indication", "MoA"],
        "list": [
            {
                "ticker": "ALPMY",
                "reason_tag": "Veozah (fezolinetant)",
                "weight": 0.8
            }
        ],
        "comp_metrics": [
            {
                "metric": "VMS reduction @12w",
                "value": -5.2,
                "peer_median": -4.5,
                "peer_p75": -5.0,
                "delta_to_median": -0.7
            }
        ]
    },
    "sources": [
        {
            "title": "FDA Approves Lynkuet",
            "url": "https://fda.gov/lynkuet-approval",
            "ts": "2025-10-24T09:00:00Z",
            "type": "regulatory"
        },
        {
            "title": "Bayer Press Release",
            "url": "https://bayer.com/lynkuet-approval",
            "ts": "2025-10-24T09:30:00Z",
            "type": "press_release"
        }
    ]
}


# ============================================================================
# 5) Lilly Omvoh (single-injection) Example
# ============================================================================

LILLY_OMVOH_EVENT = {
    "event_id": "01J9Z3XAMPLE00000000000005",
    "as_of": "2025-10-23T14:00:00Z",
    "company": {
        "name": "Eli Lilly",
        "ticker": "LLY",
        "exchange": "NYSE",
        "logo_url": "https://logo.clearbit.com/lilly.com"
    },
    "catalyst": {
        "type": "LABEL_UPDATE",
        "subtype": "sNDA",
        "program": "Mirikizumab",
        "indication": "Ulcerative Colitis",
        "geography": ["US"]
    },
    "expectations": {
        "source": "sell_side",
        "metrics": [
            {
                "name": "Injections per month",
                "unit": "count",
                "expected": 1,
                "band_low": 1,
                "band_high": 1,
                "what_matters": "Convenience vs 2-injection rivals"
            },
            {
                "name": "Adherence uplift (PDC)",
                "unit": "pp",
                "expected": 8,
                "band_low": 5,
                "band_high": 12,
                "what_matters": "Real-world compliance improvement"
            },
            {
                "name": "Market share gain",
                "unit": "pp",
                "expected": 3,
                "band_low": 2,
                "band_high": 5,
                "what_matters": "Competitive positioning"
            }
        ]
    },
    "outcome": {
        "metrics": [
            {
                "name": "Label achieved",
                "unit": "bool",
                "value": True
            },
            {
                "name": "Distribution start",
                "unit": "quarter",
                "value": "Q1'26"
            }
        ]
    },
    "market_reaction": {
        "price": [
            {
                "window": "D0",
                "abs": 1.2,
                "rel_vs_XBI": 0.5
            },
            {
                "window": "D+1",
                "abs": 1.5,
                "rel_vs_XBI": 0.8
            }
        ]
    },
    "peers": {
        "moat_axes": ["Indication", "Administration"],
        "list": [
            {
                "ticker": "ABBV",
                "reason_tag": "Skyrizi (UC competitor)",
                "weight": 0.6
            },
            {
                "ticker": "JNJ",
                "reason_tag": "Stelara biosimilar threat",
                "weight": 0.4
            }
        ],
        "comp_metrics": [
            {
                "metric": "Dosing convenience",
                "value": 1.0,
                "peer_median": 2.0,
                "peer_p75": 2.0,
                "delta_to_median": -1.0
            }
        ]
    },
    "sources": [
        {
            "title": "FDA Approves Single-Injection Omvoh",
            "url": "https://fda.gov/omvoh-snda",
            "ts": "2025-10-23T13:00:00Z",
            "type": "regulatory"
        },
        {
            "title": "Lilly Omvoh Label Update",
            "url": "https://lilly.com/omvoh-label",
            "ts": "2025-10-23T13:30:00Z",
            "type": "press_release"
        }
    ]
}


# ============================================================================
# Export All Examples
# ============================================================================

ALL_CATALYST_EXAMPLES = [
    NOVARTIS_AVIDITY_EVENT,
    BRIDGEBIO_FORTIFY_EVENT,
    INTELLIA_MAGNITUDE_EVENT,
    BAYER_LYNKUET_EVENT,
    LILLY_OMVOH_EVENT
]


def get_example_by_id(event_id: str) -> Dict[str, Any]:
    """Get catalyst example by event_id"""
    for example in ALL_CATALYST_EXAMPLES:
        if example["event_id"] == event_id:
            return example
    raise ValueError(f"No example found with event_id: {event_id}")


def get_example_by_company(ticker: str) -> List[Dict[str, Any]]:
    """Get catalyst examples by company ticker"""
    return [
        ex for ex in ALL_CATALYST_EXAMPLES
        if ex["company"]["ticker"] == ticker
    ]


if __name__ == "__main__":
    print(f"Loaded {len(ALL_CATALYST_EXAMPLES)} catalyst examples:")
    for ex in ALL_CATALYST_EXAMPLES:
        company = ex["company"]["name"]
        catalyst_type = ex["catalyst"]["type"]
        program = ex["catalyst"]["program"]
        print(f"  - {company} ({catalyst_type}): {program}")
