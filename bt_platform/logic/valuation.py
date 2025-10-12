"""
Valuation Engine

Server-side functions to assemble House projections from Epidemiology Builder
outputs and compute DCF and Multiples cross-checks.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import hashlib
import json
import numpy as np


class ValuationEngine:
    """
    Core valuation engine that links Epi Builder outputs to financial projections
    and computes DCF and Multiples valuations.
    """
    
    def __init__(self):
        self.version = "1.0"
    
    def compute_revenue_projection(
        self,
        asset_id: str,
        epi_params: Dict[str, Any],
        pricing: Dict[str, float],
        uptake_curve: Dict[int, float],
        pos_by_phase: float,
    ) -> Dict[str, Any]:
        """
        Compute revenue projections from epidemiology inputs.
        
        Args:
            asset_id: Asset identifier
            epi_params: Epidemiology parameters (addressable, eligible, treated populations)
            pricing: Net pricing by region {'US': 150000, 'EU': 120000, 'ROW': 80000}
            uptake_curve: S-curve uptake by year {2025: 0.05, 2026: 0.15, ...}
            pos_by_phase: Probability of success based on phase
        
        Returns:
            Revenue projection by asset and region
        """
        results = {
            "asset_id": asset_id,
            "regions": {},
            "total_revenue_by_year": {}
        }
        
        for region, net_price in pricing.items():
            region_data = []
            
            for year, uptake in uptake_curve.items():
                # Calculate patients: addressable → eligible → treated
                addressable = epi_params.get(f"{region}_addressable", 0)
                eligible_rate = epi_params.get(f"{region}_eligible_rate", 0.7)
                treatment_rate = uptake
                
                patients = int(addressable * eligible_rate * treatment_rate)
                revenue = patients * net_price * pos_by_phase
                
                region_data.append({
                    "year": year,
                    "patients": patients,
                    "net_price": net_price,
                    "uptake": uptake,
                    "revenue": revenue
                })
                
                # Accumulate total
                if year not in results["total_revenue_by_year"]:
                    results["total_revenue_by_year"][year] = 0
                results["total_revenue_by_year"][year] += revenue
            
            results["regions"][region] = region_data
        
        return results
    
    def apply_loe_erosion(
        self,
        revenue_projections: Dict[str, Any],
        loe_events: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Apply loss of exclusivity erosion to revenue projections.
        
        Args:
            revenue_projections: Revenue by year before LoE
            loe_events: List of LoE events with erosion curves
        
        Returns:
            Adjusted revenue projections with LoE impact
        """
        adjusted = revenue_projections.copy()
        
        for event in loe_events:
            expiry_year = event.get("expiry_year")
            erosion_rates = event.get("erosion_rates", {
                "year_1": 0.60,  # 60% drop in year 1
                "year_2": 0.20,  # Additional 20% in year 2
                "steady_state": 0.85  # 85% total market share loss
            })
            
            for year in adjusted["total_revenue_by_year"].keys():
                if year == expiry_year + 1:
                    adjusted["total_revenue_by_year"][year] *= (1 - erosion_rates["year_1"])
                elif year == expiry_year + 2:
                    adjusted["total_revenue_by_year"][year] *= (1 - erosion_rates["year_2"])
                elif year > expiry_year + 2:
                    adjusted["total_revenue_by_year"][year] *= (1 - erosion_rates["steady_state"])
        
        adjusted["loe_adjusted"] = True
        return adjusted
    
    def compute_dcf(
        self,
        revenue_projections: Dict[str, Any],
        assumptions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compute discounted cash flow valuation.
        
        Args:
            revenue_projections: Revenue by year
            assumptions: Financial assumptions (margins, tax, WACC, TGR, etc.)
        
        Returns:
            DCF valuation with NPV and per-share value
        """
        # Extract assumptions
        gross_margin = assumptions.get("gross_margin", 0.85)
        opex_rate = assumptions.get("opex_rate", 0.35)  # % of revenue
        tax_rate = assumptions.get("tax_rate", 0.21)
        wacc = assumptions.get("wacc", 0.10)
        tgr = assumptions.get("tgr", 0.03)  # Terminal growth rate
        capex_rate = assumptions.get("capex_rate", 0.05)
        working_capital_rate = assumptions.get("working_capital_rate", 0.10)
        
        explicit_years = assumptions.get("explicit_years", 10)
        current_year = datetime.now().year
        
        # Calculate free cash flows
        fcf_by_year = {}
        for year, revenue in revenue_projections["total_revenue_by_year"].items():
            if year > current_year + explicit_years:
                break
                
            cogs = revenue * (1 - gross_margin)
            opex = revenue * opex_rate
            ebitda = revenue - cogs - opex
            tax = ebitda * tax_rate
            nopat = ebitda - tax
            
            capex = revenue * capex_rate
            wc_change = revenue * working_capital_rate
            
            fcf = nopat - capex - wc_change
            fcf_by_year[year] = fcf
        
        # Discount FCFs
        npv = 0
        discounted_fcf = {}
        
        for year, fcf in fcf_by_year.items():
            years_out = year - current_year
            if years_out > 0:
                pv = fcf / ((1 + wacc) ** years_out)
                npv += pv
                discounted_fcf[year] = {
                    "fcf": fcf,
                    "discount_factor": 1 / ((1 + wacc) ** years_out),
                    "pv": pv
                }
        
        # Terminal value
        last_year = max(fcf_by_year.keys())
        terminal_fcf = fcf_by_year[last_year] * (1 + tgr)
        terminal_value = terminal_fcf / (wacc - tgr)
        terminal_years_out = last_year - current_year
        terminal_pv = terminal_value / ((1 + wacc) ** terminal_years_out)
        
        enterprise_value = npv + terminal_pv
        
        # Per-share calculation
        shares_outstanding = assumptions.get("shares_outstanding", 100_000_000)
        net_debt = assumptions.get("net_debt", 0)
        equity_value = enterprise_value - net_debt
        value_per_share = equity_value / shares_outstanding
        
        return {
            "fcf_by_year": fcf_by_year,
            "discounted_fcf": discounted_fcf,
            "explicit_npv": npv,
            "terminal_value": terminal_value,
            "terminal_pv": terminal_pv,
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "value_per_share": value_per_share,
            "assumptions": assumptions
        }
    
    def compute_multiples(
        self,
        revenue_projections: Dict[str, Any],
        assumptions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compute valuation multiples (EV/Sales) cross-check.
        
        Args:
            revenue_projections: Revenue by year
            assumptions: Comparable company multiples
        
        Returns:
            Multiples-based valuation
        """
        ev_sales_multiples = assumptions.get("ev_sales_multiples", {
            "year_1": 8.0,
            "year_2": 6.5,
            "year_3": 5.5,
            "peak": 4.5
        })
        
        current_year = datetime.now().year
        multiples_valuations = {}
        
        for year, revenue in revenue_projections["total_revenue_by_year"].items():
            years_out = year - current_year
            
            if years_out == 1:
                multiple = ev_sales_multiples.get("year_1", 8.0)
            elif years_out == 2:
                multiple = ev_sales_multiples.get("year_2", 6.5)
            elif years_out == 3:
                multiple = ev_sales_multiples.get("year_3", 5.5)
            else:
                multiple = ev_sales_multiples.get("peak", 4.5)
            
            ev = revenue * multiple
            
            shares_outstanding = assumptions.get("shares_outstanding", 100_000_000)
            net_debt = assumptions.get("net_debt", 0)
            equity_value = ev - net_debt
            value_per_share = equity_value / shares_outstanding
            
            multiples_valuations[year] = {
                "revenue": revenue,
                "ev_sales_multiple": multiple,
                "enterprise_value": ev,
                "equity_value": equity_value,
                "value_per_share": value_per_share
            }
        
        return {
            "valuations_by_year": multiples_valuations,
            "assumptions": assumptions
        }
    
    def run_valuation(
        self,
        ticker: str,
        scenario_id: str,
        epi_params: Dict[str, Any],
        financial_assumptions: Dict[str, Any],
        loe_events: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Run complete valuation including revenue projection, DCF, and multiples.
        
        Args:
            ticker: Company ticker
            scenario_id: Scenario identifier
            epi_params: Epidemiology parameters
            financial_assumptions: All financial assumptions
            loe_events: Optional LoE events
        
        Returns:
            Complete valuation results with inputs hash
        """
        # Compute inputs hash for reproducibility
        inputs = {
            "ticker": ticker,
            "scenario_id": scenario_id,
            "epi_params": epi_params,
            "financial_assumptions": financial_assumptions,
            "loe_events": loe_events or []
        }
        inputs_json = json.dumps(inputs, sort_keys=True)
        inputs_hash = hashlib.sha256(inputs_json.encode()).hexdigest()
        
        # Step 1: Compute base revenue projections
        revenue_projections = self.compute_revenue_projection(
            asset_id=financial_assumptions.get("asset_id", ticker),
            epi_params=epi_params,
            pricing=financial_assumptions.get("pricing", {"US": 150000, "EU": 120000, "ROW": 80000}),
            uptake_curve=financial_assumptions.get("uptake_curve", {}),
            pos_by_phase=financial_assumptions.get("pos_by_phase", 0.65)
        )
        
        # Step 2: Apply LoE erosion if applicable
        if loe_events:
            revenue_projections = self.apply_loe_erosion(revenue_projections, loe_events)
        
        # Step 3: Compute DCF
        dcf_results = self.compute_dcf(revenue_projections, financial_assumptions)
        
        # Step 4: Compute multiples cross-check
        multiples_results = self.compute_multiples(revenue_projections, financial_assumptions)
        
        return {
            "ticker": ticker,
            "scenario_id": scenario_id,
            "inputs_hash": inputs_hash,
            "timestamp": datetime.utcnow().isoformat(),
            "version": self.version,
            "revenue_projections": revenue_projections,
            "dcf_valuation": dcf_results,
            "multiples_valuation": multiples_results,
            "summary": {
                "dcf_per_share": dcf_results["value_per_share"],
                "multiples_avg_per_share": np.mean([
                    v["value_per_share"] 
                    for v in multiples_results["valuations_by_year"].values()
                ]),
                "blended_value_per_share": (
                    dcf_results["value_per_share"] * 0.7 +
                    np.mean([v["value_per_share"] for v in multiples_results["valuations_by_year"].values()]) * 0.3
                )
            }
        }
    
    def compute_wacc_tgr_sensitivity(
        self,
        base_results: Dict[str, Any],
        wacc_range: List[float],
        tgr_range: List[float]
    ) -> Dict[str, Any]:
        """
        Compute sensitivity table for WACC and TGR combinations.
        
        Args:
            base_results: Base valuation results
            wacc_range: List of WACC values to test
            tgr_range: List of TGR values to test
        
        Returns:
            2D grid of per-share values
        """
        sensitivity = {}
        
        revenue_projections = base_results["revenue_projections"]
        assumptions = base_results["dcf_valuation"]["assumptions"].copy()
        
        for wacc in wacc_range:
            sensitivity[wacc] = {}
            for tgr in tgr_range:
                assumptions["wacc"] = wacc
                assumptions["tgr"] = tgr
                
                dcf = self.compute_dcf(revenue_projections, assumptions)
                sensitivity[wacc][tgr] = dcf["value_per_share"]
        
        return {
            "wacc_range": wacc_range,
            "tgr_range": tgr_range,
            "grid": sensitivity
        }
