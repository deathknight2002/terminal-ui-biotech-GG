#!/usr/bin/env python3
"""
Financial Intelligence Scraper for Biotech/Pharma
Collects financial data, insider trading, institutional holdings
"""

import yfinance as yf
import requests
import pandas as pd
from datetime import datetime, timedelta
import json
import logging
from typing import Dict, List, Any
import asyncio
import aiohttp

logger = logging.getLogger(__name__)

class FinancialIntelligenceScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Top biotech hedge funds and institutions
        self.major_institutions = [
            "ARK Investment Management",
            "Fidelity",
            "BlackRock",
            "Vanguard",
            "T. Rowe Price",
            "Wellington Management",
            "Baillie Gifford"
        ]
    
    def get_institutional_holdings(self, symbol: str) -> Dict:
        """Get institutional holdings for a biotech stock"""
        try:
            ticker = yf.Ticker(symbol)
            
            # Get institutional holders
            institutional_holders = ticker.institutional_holders
            major_holders = ticker.major_holders
            
            holdings_data = {
                "symbol": symbol,
                "institutional_holders": [],
                "major_holders_summary": {},
                "insider_ownership": 0,
                "institutional_ownership": 0
            }
            
            if institutional_holders is not None and not institutional_holders.empty:
                for _, holder in institutional_holders.head(10).iterrows():
                    holdings_data["institutional_holders"].append({
                        "holder": holder.get('Holder', ''),
                        "shares": holder.get('Shares', 0),
                        "date_reported": str(holder.get('Date Reported', '')),
                        "percent_out": holder.get('% Out', 0),
                        "value": holder.get('Value', 0)
                    })
            
            if major_holders is not None and not major_holders.empty:
                for _, holder in major_holders.iterrows():
                    if "insiders" in str(holder[1]).lower():
                        holdings_data["insider_ownership"] = float(str(holder[0]).replace('%', ''))
                    elif "institutions" in str(holder[1]).lower():
                        holdings_data["institutional_ownership"] = float(str(holder[0]).replace('%', ''))
            
            return holdings_data
            
        except Exception as e:
            logger.error(f"Error getting holdings for {symbol}: {e}")
            return {"symbol": symbol, "error": str(e)}
    
    def get_financial_metrics(self, symbol: str) -> Dict:
        """Get comprehensive financial metrics"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # Get financial statements
            income_stmt = ticker.financials
            balance_sheet = ticker.balance_sheet
            cash_flow = ticker.cashflow
            
            metrics = {
                "symbol": symbol,
                "company_name": info.get('longName', symbol),
                "market_metrics": {
                    "market_cap": info.get('marketCap', 0),
                    "enterprise_value": info.get('enterpriseValue', 0),
                    "price_to_book": info.get('priceToBook', 0),
                    "price_to_sales": info.get('priceToSalesTrailing12Months', 0),
                    "ev_to_revenue": info.get('enterpriseToRevenue', 0),
                    "ev_to_ebitda": info.get('enterpriseToEbitda', 0),
                    "beta": info.get('beta', 1.0),
                    "short_ratio": info.get('shortRatio', 0),
                    "short_percent": info.get('shortPercentOfFloat', 0)
                },
                "financial_health": {
                    "total_cash": info.get('totalCash', 0),
                    "total_debt": info.get('totalDebt', 0),
                    "debt_to_equity": info.get('debtToEquity', 0),
                    "current_ratio": info.get('currentRatio', 0),
                    "return_on_equity": info.get('returnOnEquity', 0),
                    "return_on_assets": info.get('returnOnAssets', 0),
                    "gross_margins": info.get('grossMargins', 0),
                    "operating_margins": info.get('operatingMargins', 0),
                    "profit_margins": info.get('profitMargins', 0)
                },
                "growth_metrics": {
                    "revenue_growth": info.get('revenueGrowth', 0),
                    "earnings_growth": info.get('earningsGrowth', 0),
                    "revenue_per_share": info.get('revenuePerShare', 0),
                    "book_value": info.get('bookValue', 0),
                    "price_to_earnings": info.get('trailingPE', 0),
                    "forward_pe": info.get('forwardPE', 0),
                    "earnings_per_share": info.get('trailingEps', 0)
                },
                "analyst_data": {
                    "target_high_price": info.get('targetHighPrice', 0),
                    "target_low_price": info.get('targetLowPrice', 0),
                    "target_mean_price": info.get('targetMeanPrice', 0),
                    "recommendation_mean": info.get('recommendationMean', 0),
                    "number_of_analyst_opinions": info.get('numberOfAnalystOpinions', 0)
                }
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting financial metrics for {symbol}: {e}")
            return {"symbol": symbol, "error": str(e)}
    
    def get_insider_trading(self, symbol: str) -> List[Dict]:
        """Get insider trading activity"""
        try:
            ticker = yf.Ticker(symbol)
            insider_transactions = ticker.insider_transactions
            
            transactions = []
            if insider_transactions is not None and not insider_transactions.empty:
                for _, transaction in insider_transactions.head(20).iterrows():
                    transactions.append({
                        "insider_name": transaction.get('Insider', ''),
                        "relation": transaction.get('Relation', ''),
                        "last_date": str(transaction.get('Last Date', '')),
                        "transaction_type": transaction.get('Transaction', ''),
                        "owner_type": transaction.get('Owner Type', ''),
                        "shares_traded": transaction.get('Shares Traded', 0),
                        "last_price": transaction.get('Last Price', 0),
                        "shares_held": transaction.get('Shares Held', 0)
                    })
            
            return transactions
            
        except Exception as e:
            logger.error(f"Error getting insider trading for {symbol}: {e}")
            return []
    
    def calculate_portfolio_metrics(self, positions: List[Dict]) -> Dict:
        """Calculate portfolio-level financial metrics"""
        try:
            total_value = sum([pos.get('market_cap', 0) for pos in positions if pos.get('market_cap')])
            total_positions = len(positions)
            
            # Calculate weighted averages
            weighted_pe = 0
            weighted_beta = 0
            total_weight = 0
            
            sector_allocation = {}
            risk_metrics = {
                "high_beta_stocks": 0,  # Beta > 1.5
                "penny_stocks": 0,      # Price < $10
                "large_cap": 0,         # Market cap > $10B
                "mid_cap": 0,           # Market cap $2-10B
                "small_cap": 0          # Market cap < $2B
            }
            
            for pos in positions:
                market_cap = pos.get('market_cap', 0)
                if market_cap > 0:
                    weight = market_cap / total_value
                    total_weight += weight
                    
                    # Weighted averages
                    if pos.get('pe_ratio'):
                        weighted_pe += pos['pe_ratio'] * weight
                    if pos.get('beta'):
                        weighted_beta += pos['beta'] * weight
                    
                    # Sector allocation
                    sector = pos.get('sector', 'Unknown')
                    sector_allocation[sector] = sector_allocation.get(sector, 0) + weight
                    
                    # Risk metrics
                    if pos.get('beta', 0) > 1.5:
                        risk_metrics["high_beta_stocks"] += 1
                    if pos.get('price', 0) < 10:
                        risk_metrics["penny_stocks"] += 1
                    if market_cap > 10_000_000_000:
                        risk_metrics["large_cap"] += 1
                    elif market_cap > 2_000_000_000:
                        risk_metrics["mid_cap"] += 1
                    else:
                        risk_metrics["small_cap"] += 1
            
            return {
                "total_portfolio_value": total_value,
                "total_positions": total_positions,
                "weighted_pe_ratio": round(weighted_pe, 2),
                "weighted_beta": round(weighted_beta, 2),
                "sector_allocation": {k: round(v * 100, 2) for k, v in sector_allocation.items()},
                "risk_profile": risk_metrics,
                "diversification_score": len(sector_allocation) / max(1, total_positions) * 100
            }
            
        except Exception as e:
            logger.error(f"Error calculating portfolio metrics: {e}")
            return {}
    
    async def collect_financial_intelligence(self, symbols: List[str]) -> Dict:
        """Collect comprehensive financial intelligence"""
        logger.info("💰 Collecting financial intelligence data...")
        
        financial_data = {
            "positions": [],
            "institutional_analysis": [],
            "insider_activity": [],
            "portfolio_metrics": {},
            "market_sentiment": {},
            "timestamp": datetime.now().isoformat()
        }
        
        # Collect data for each symbol
        for symbol in symbols[:15]:  # Limit to avoid rate limiting
            try:
                logger.info(f"📊 Processing {symbol}...")
                
                # Get comprehensive financial metrics
                metrics = self.get_financial_metrics(symbol)
                financial_data["positions"].append(metrics)
                
                # Get institutional holdings
                holdings = self.get_institutional_holdings(symbol)
                financial_data["institutional_analysis"].append(holdings)
                
                # Get insider trading
                insider_trades = self.get_insider_trading(symbol)
                if insider_trades:
                    financial_data["insider_activity"].extend(insider_trades)
                
                # Rate limiting
                await asyncio.sleep(0.2)
                
            except Exception as e:
                logger.error(f"Error processing {symbol}: {e}")
                continue
        
        # Calculate portfolio-level metrics
        financial_data["portfolio_metrics"] = self.calculate_portfolio_metrics(
            financial_data["positions"]
        )
        
        # Market sentiment analysis
        total_positions = len(financial_data["positions"])
        positive_sentiment = sum([1 for pos in financial_data["positions"] 
                                if pos.get('analyst_data', {}).get('recommendation_mean', 3) < 2.5])
        
        financial_data["market_sentiment"] = {
            "bullish_stocks": positive_sentiment,
            "bearish_stocks": total_positions - positive_sentiment,
            "sentiment_ratio": round(positive_sentiment / max(1, total_positions), 2),
            "high_confidence_picks": len([pos for pos in financial_data["positions"]
                                        if pos.get('analyst_data', {}).get('number_of_analyst_opinions', 0) > 10])
        }
        
        logger.info(f"✅ Financial intelligence collected for {len(financial_data['positions'])} positions")
        return financial_data

async def main():
    """Main execution for financial intelligence"""
    scraper = FinancialIntelligenceScraper()
    
    # Major biotech symbols
    symbols = ['MRNA', 'BNTX', 'GILD', 'VRTX', 'REGN', 'BIIB', 'AMGN', 'INCY', 'ILMN', 'BMRN']
    
    data = await scraper.collect_financial_intelligence(symbols)
    
    # Save financial intelligence
    with open('financial_intelligence.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    logger.info("💾 Financial intelligence saved")
    return data

if __name__ == "__main__":
    asyncio.run(main())