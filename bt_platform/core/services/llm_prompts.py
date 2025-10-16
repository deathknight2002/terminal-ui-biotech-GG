"""
LLM Prompts for News Article Structuring

Provides prompts for:
- Article → Structured Record (TA tags, catalyst tags, entities, importance)
- Competitor / Read-Through Suggestions
- Importance Re-Scoring with Cross-Source Lift
- Price Reaction Note Generation
"""

from typing import Dict, Any, List, Optional
import json


class LLMPrompts:
    """LLM prompt templates for news intelligence"""
    
    @staticmethod
    def article_to_structured_record(
        title: str,
        summary: Optional[str] = None,
        source_url: Optional[str] = None,
        published_at: Optional[str] = None
    ) -> str:
        """
        Prompt A: Article → Structured Record
        
        Returns a prompt that asks LLM to extract:
        - ta_tags (therapeutic areas)
        - catalyst_tags (FDA Approval, Phase 3, etc.)
        - entities (companies, drugs, diseases, targets)
        - importance (Critical/High/Medium/Low)
        - summary_250 (≤250 chars)
        - rationale (why this matters)
        """
        
        prompt = f"""You are a biotech news structurer for an investment firm. Input is a news headline, optional summary, and the source URL + publish time.

Output a single JSON object with these fields:

- ta_tags: array of therapeutic areas from this controlled list ["SMA","GLP-1","Oncology","Rare Disease","Immunology","Neurology","Cardiovascular","Metabolic","Hematology","Pulmonology","Infectious Disease","Ophthalmology","Dermatology"].

- catalyst_tags: array from ["FDA Approval","AdCom","Breakthrough Designation","Fast Track","Phase 1","Phase 2","Phase 3","Pivotal","Topline","Partnering","Licensing","M&A","Financing","Manufacturing","Safety","Clinical Hold","Regulatory Filing","IND","Preclinical","Leadership","Presentation"].

- entities: array of objects with {{kind: "company"|"drug"|"disease"|"target", name, ticker?, role: "primary"|"mentioned", confidence: 0–1}}.

- importance: one of "Critical","High","Medium","Low" – decide using your best judgment for **tradability** (SMID-cap clinical/regulatory events rank higher).

- summary_250: ≤250 chars, factual, no hype; include the catalyst explicitly.

- rationale: one sentence why this matters to a trader.

Rules:
- Prefer SMID-cap companies when assigning importance.
- If paywalled or vague, return `importance: "Medium"` and keep `summary_250` conservative.
- Never hallucinate tickers: only include if explicitly inferable or widely known; else omit ticker.

Input:
- Title: {title}
"""
        
        if summary:
            prompt += f"- Summary: {summary}\n"
        if source_url:
            prompt += f"- Source URL: {source_url}\n"
        if published_at:
            prompt += f"- Published At: {published_at}\n"
        
        prompt += "\nOutput (JSON only, no markdown):"
        
        return prompt
    
    @staticmethod
    def competitor_read_throughs(
        article_json: Dict[str, Any],
        portfolio_watchlist: List[str]
    ) -> str:
        """
        Prompt B: Competitor / Read-Through Suggestions
        
        Given structured article and portfolio, suggest competitor exposures
        """
        
        prompt = f"""Given the structured article JSON and the portfolio watchlist, suggest competitor read-through tickers.

Output `exposures` JSON object:

- direct: companies explicitly involved (weight 1.0).
- competitor: up to 8 companies in same indication/target/class with {{ticker, weight 0.6 or 0.3, rationale}}.
- etf: always include XBI with weight from snapshot if available; else include {{ticker:"XBI", weight:null, rationale:"ETF proxy"}}.

Prefer SMID caps. Avoid megacaps unless they are the only relevant peers.

Input Article JSON:
{json.dumps(article_json, indent=2)}

Portfolio Watchlist (tickers):
{json.dumps(portfolio_watchlist)}

Output (JSON only, no markdown):
"""
        
        return prompt
    
    @staticmethod
    def importance_rescoring(
        article_json: Dict[str, Any],
        cross_source_count: int,
        portfolio_relevance: bool
    ) -> str:
        """
        Prompt C: Importance Re-Scoring with Cross-Source Lift
        
        Re-score importance and relevance_score based on:
        - Catalyst weight
        - Portfolio relevance
        - Cross-source count
        - SMID bucket
        """
        
        prompt = f"""Input: structured article JSON + cross_source_count + portfolio_relevance (boolean).

Re-score `importance` and `relevance_score 0–100`:

- Start with catalyst weight (FDA Approval > Phase 3 > M&A > Phase 2 > Financing > Routine).
- +15 if portfolio_relevance, +10 if cross_source_count ≥ 2, +10 if SMID bucket.
- Cap at 100; map to importance bands: 85–100=Critical, 70–84=High, 40–69=Medium, else Low.

Return updated fields only (importance and relevance_score).

Input Article JSON:
{json.dumps(article_json, indent=2)}

Cross-Source Count: {cross_source_count}
Portfolio Relevance: {portfolio_relevance}

Output (JSON only, no markdown):
"""
        
        return prompt
    
    @staticmethod
    def price_reaction_note(
        article_json: Dict[str, Any],
        ticker: str,
        event_time: str,
        raw_return: float,
        benchmark_return: float,
        abnormal_return: float,
        window: str,
        p_value: Optional[float] = None
    ) -> str:
        """
        Prompt D: Price Reaction Note
        
        Generate a 1-2 sentence analyst note for price reaction
        """
        
        prompt = f"""Input: article JSON, ticker, event_time, returns (raw_return, benchmark_return, abnormal_return, window, p_value optional).

Output a 1–2 sentence analyst note:

- Start with "[TICKER] [±X%] on [catalyst], [±Y% vs XBI] over [window]."
- Add 1 clause for read-through ("Peers [A,B] may react due to [shared target/indication].")

Keep it strictly factual.

Input:
- Article: {article_json.get('title', 'N/A')}
- Ticker: {ticker}
- Event Time: {event_time}
- Raw Return: {raw_return:.2%}
- Benchmark Return: {benchmark_return:.2%}
- Abnormal Return: {abnormal_return:.2%}
- Window: {window}
"""
        
        if p_value is not None:
            prompt += f"- P-Value: {p_value:.4f}\n"
        
        prompt += "\nOutput (plain text note, no JSON):"
        
        return prompt
    
    @staticmethod
    def parse_json_response(response: str) -> Dict[str, Any]:
        """
        Parse JSON from LLM response
        Handles markdown code blocks if present
        """
        # Strip markdown code blocks
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]  # Remove ```json
        if response.startswith("```"):
            response = response[3:]  # Remove ```
        if response.endswith("```"):
            response = response[:-3]  # Remove trailing ```
        
        response = response.strip()
        
        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON response: {e}\n\nResponse: {response}")
