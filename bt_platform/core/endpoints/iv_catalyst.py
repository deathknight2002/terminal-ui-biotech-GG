"""
Implied Volatility Catalyst Tracking API Endpoints

Endpoints for tracking IV spikes ahead of biotech catalysts to identify
asymmetric trading setups.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
from datetime import datetime, timedelta
import logging

from ..database import (
    get_db, 
    OptionsIV, 
    PriceData, 
    IVCatalystSignal, 
    Catalyst,
    Company
)
from ..utils.iv_sanity_checks import validate_iv_signal, adjust_for_sector_iv, get_xbi_iv_change

logger = logging.getLogger(__name__)

router = APIRouter()


def _calculate_oi_30d_average(db: Session, ticker: str, tenor_days: int = 7) -> float:
    """Calculate 30-day average OI for spike detection"""
    cutoff_date = datetime.utcnow() - timedelta(days=30)
    
    historical = db.query(OptionsIV.total_oi).filter(
        and_(
            OptionsIV.ticker == ticker,
            OptionsIV.tenor_days == tenor_days,
            OptionsIV.date >= cutoff_date,
            OptionsIV.total_oi.isnot(None)
        )
    ).all()
    
    if not historical:
        return 0
    
    oi_values = [h[0] for h in historical if h[0] is not None]
    if not oi_values:
        return 0
    
    return sum(oi_values) / len(oi_values)


@router.get("/signals")
async def get_iv_catalyst_signals(
    min_score: int = Query(2, description="Minimum signal score (0-4)"),
    max_days_to_event: int = Query(60, description="Maximum days to catalyst event"),
    min_confidence: float = Query(0.5, description="Minimum confidence (0-1)"),
    ticker: Optional[str] = Query(None, description="Filter by ticker symbol"),
    quality: Optional[str] = Query(None, description="Filter by quality: High, Medium, Low"),
    db: Session = Depends(get_db)
):
    """
    Get IV catalyst signals - tickers with elevated IV ahead of catalysts.
    
    Signal rules (any 2 trigger a flag):
    - 7D IV ↑ >20% w/w and 7D–30D contango turns backwardation
    - IV/20D RV >1.4 while 5D spot return between −2% and +2%
    - 30D call-skew ↑ >10 delta-points vs 20D median
    - New OI at event-relevant strikes >2× 30D avg
    """
    try:
        query = db.query(IVCatalystSignal)
        
        # Filter by score threshold
        query = query.filter(IVCatalystSignal.signal_score >= min_score)
        
        # Filter by days to event
        today = datetime.utcnow()
        max_event_date = today + timedelta(days=max_days_to_event)
        query = query.filter(
            and_(
                IVCatalystSignal.event_date >= today,
                IVCatalystSignal.event_date <= max_event_date
            )
        )
        
        # Filter by confidence
        query = query.filter(IVCatalystSignal.confidence >= min_confidence)
        
        # Optional filters
        if ticker:
            query = query.filter(IVCatalystSignal.ticker.ilike(f"%{ticker}%"))
        
        if quality:
            query = query.filter(IVCatalystSignal.quality == quality)
        
        # Order by signal score and event proximity
        signals = query.order_by(
            IVCatalystSignal.signal_score.desc(),
            IVCatalystSignal.days_to_event.asc()
        ).all()
        
        # Format results
        results = []
        for signal in signals:
            results.append({
                "ticker": signal.ticker,
                "signal_date": signal.signal_date.isoformat() if signal.signal_date else None,
                "event_date": signal.event_date.isoformat() if signal.event_date else None,
                "event_type": signal.event_type,
                "days_to_event": signal.days_to_event,
                "signal_score": signal.signal_score,
                "confidence": signal.confidence,
                "quality": signal.quality,
                "metrics": {
                    "iv7": signal.iv7,
                    "iv30": signal.iv30,
                    "iv_rv_ratio": signal.iv_rv_ratio,
                    "term_backwardation": signal.term_backwardation,
                    "skew25d": signal.skew25d,
                    "skew_change": signal.skew_change,
                    "iv7_pctile": signal.iv7_pctile,
                    "price": signal.price,
                    "ret5d": signal.ret5d
                },
                "flags": {
                    "backwardation": bool(signal.backw_flag),
                    "iv_rv_elevated": bool(signal.ivrv_flag),
                    "skew_significant": bool(signal.skew_flag),
                    "oi_spike": bool(signal.oi_flag)
                }
            })
        
        return {
            "signals": results,
            "count": len(results),
            "filters": {
                "min_score": min_score,
                "max_days_to_event": max_days_to_event,
                "min_confidence": min_confidence,
                "ticker": ticker,
                "quality": quality
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching IV catalyst signals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar")
async def get_iv_calendar(
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, description="End date (ISO format)"),
    tickers: Optional[str] = Query(None, description="Comma-separated ticker list"),
    db: Session = Depends(get_db)
):
    """
    Get IV calendar - catalyst calendar with IV overlay.
    
    Returns a calendar view with:
    - Catalyst events on the timeline
    - IV metrics (7D, 30D) for each ticker
    - IV z-scores for visual heatmap
    - Days to event markers (D-30, D-7, D-3, D-1)
    """
    try:
        # Parse date range
        if not from_date:
            from_dt = datetime.utcnow() - timedelta(days=30)
        else:
            from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        
        if not to_date:
            to_dt = datetime.utcnow() + timedelta(days=60)
        else:
            to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        
        # Parse tickers
        ticker_list = None
        if tickers:
            ticker_list = [t.strip().upper() for t in tickers.split(',')]
        
        # Get catalysts in date range
        catalyst_query = db.query(Catalyst).filter(
            and_(
                Catalyst.event_date >= from_dt,
                Catalyst.event_date <= to_dt
            )
        )
        
        if ticker_list:
            catalyst_query = catalyst_query.filter(
                Catalyst.company.in_(ticker_list)
            )
        
        catalysts = catalyst_query.order_by(Catalyst.event_date.asc()).all()
        
        # Build calendar events with IV data
        calendar_events = []
        for catalyst in catalysts:
            ticker = catalyst.company  # Assuming company field contains ticker
            event_date = catalyst.event_date
            
            if not ticker or not event_date:
                continue
            
            # Get latest IV data for this ticker
            iv7_data = db.query(OptionsIV).filter(
                and_(
                    OptionsIV.ticker == ticker,
                    OptionsIV.tenor_days == 7
                )
            ).order_by(OptionsIV.date.desc()).first()
            
            iv30_data = db.query(OptionsIV).filter(
                and_(
                    OptionsIV.ticker == ticker,
                    OptionsIV.tenor_days == 30
                )
            ).order_by(OptionsIV.date.desc()).first()
            
            # Get price data
            price_data = db.query(PriceData).filter(
                PriceData.ticker == ticker
            ).order_by(PriceData.date.desc()).first()
            
            # Calculate days to event
            days_to_event = (event_date - datetime.utcnow()).days
            
            # Determine timeline marker
            marker = None
            if days_to_event <= 1:
                marker = "D-1"
            elif days_to_event <= 3:
                marker = "D-3"
            elif days_to_event <= 7:
                marker = "D-7"
            elif days_to_event <= 30:
                marker = "D-30"
            
            calendar_events.append({
                "id": catalyst.id,
                "ticker": ticker,
                "name": catalyst.name or catalyst.title,
                "event_date": event_date.isoformat(),
                "event_type": catalyst.kind or catalyst.event_type,
                "days_to_event": days_to_event,
                "marker": marker,
                "iv_data": {
                    "iv7": iv7_data.iv_mid if iv7_data else None,
                    "iv30": iv30_data.iv_mid if iv30_data else None,
                    "iv7_pctile": iv7_data.iv_pctile_1y if iv7_data else None,
                    "skew_25d": iv7_data.skew_25d if iv7_data else None,
                    "is_backwardation": iv7_data.is_backwardation if iv7_data else False,
                    "iv_date": iv7_data.date.isoformat() if iv7_data else None
                },
                "price_data": {
                    "price": price_data.close if price_data else None,
                    "returns_5d": price_data.returns_5d if price_data else None,
                    "realized_vol_20d": price_data.realized_vol_20d if price_data else None
                } if price_data else None
            })
        
        # Group by month for calendar rendering
        months = {}
        for event in calendar_events:
            event_dt = datetime.fromisoformat(event["event_date"])
            month_key = event_dt.strftime("%Y-%m")
            if month_key not in months:
                months[month_key] = []
            months[month_key].append(event)
        
        return {
            "events": calendar_events,
            "count": len(calendar_events),
            "months": months,
            "date_range": {
                "from": from_dt.isoformat(),
                "to": to_dt.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching IV calendar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/{ticker}")
async def get_iv_data(
    ticker: str,
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    tenors: Optional[str] = Query("7,30", description="Comma-separated tenors (e.g., 7,14,30,60)"),
    db: Session = Depends(get_db)
):
    """
    Get raw IV data for a specific ticker across multiple tenors.
    
    Returns time series of IV metrics for charting and analysis.
    """
    try:
        ticker = ticker.upper()
        
        # Parse date range
        if not from_date:
            from_dt = datetime.utcnow() - timedelta(days=365)  # 1 year default
        else:
            from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        
        # Parse tenors
        tenor_list = [int(t.strip()) for t in tenors.split(',')]
        
        # Query IV data
        iv_data = db.query(OptionsIV).filter(
            and_(
                OptionsIV.ticker == ticker,
                OptionsIV.date >= from_dt,
                OptionsIV.tenor_days.in_(tenor_list)
            )
        ).order_by(OptionsIV.date.asc(), OptionsIV.tenor_days.asc()).all()
        
        if not iv_data:
            return {
                "ticker": ticker,
                "data": [],
                "count": 0
            }
        
        # Format results by tenor
        result_by_tenor = {}
        for record in iv_data:
            tenor = record.tenor_days
            if tenor not in result_by_tenor:
                result_by_tenor[tenor] = []
            
            result_by_tenor[tenor].append({
                "date": record.date.isoformat(),
                "iv_mid": record.iv_mid,
                "iv_pctile_1y": record.iv_pctile_1y,
                "skew_25d": record.skew_25d,
                "total_oi": record.total_oi,
                "put_call_ratio": record.put_call_ratio,
                "is_backwardation": record.is_backwardation
            })
        
        return {
            "ticker": ticker,
            "tenors": result_by_tenor,
            "count": len(iv_data)
        }
        
    except Exception as e:
        logger.error(f"Error fetching IV data for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{ticker}")
async def get_iv_stats(
    ticker: str,
    db: Session = Depends(get_db)
):
    """
    Get IV statistics and percentiles for a ticker.
    
    Returns summary statistics including:
    - Current IV across tenors
    - Historical percentiles
    - IV/RV ratios
    - Term structure analysis
    """
    try:
        ticker = ticker.upper()
        
        # Get latest IV data for all tenors
        latest_iv = db.query(OptionsIV).filter(
            OptionsIV.ticker == ticker
        ).order_by(OptionsIV.date.desc()).limit(10).all()
        
        if not latest_iv:
            raise HTTPException(status_code=404, detail=f"No IV data found for {ticker}")
        
        # Get latest price data
        latest_price = db.query(PriceData).filter(
            PriceData.ticker == ticker
        ).order_by(PriceData.date.desc()).first()
        
        # Organize by tenor
        iv_by_tenor = {}
        latest_date = None
        
        for iv in latest_iv:
            if not latest_date:
                latest_date = iv.date
            
            # Only include data from the latest date
            if iv.date == latest_date:
                iv_by_tenor[iv.tenor_days] = {
                    "iv_mid": iv.iv_mid,
                    "iv_pctile_1y": iv.iv_pctile_1y,
                    "iv_pctile_6m": iv.iv_pctile_6m,
                    "skew_25d": iv.skew_25d,
                    "is_backwardation": iv.is_backwardation,
                    "total_oi": iv.total_oi,
                    "put_call_ratio": iv.put_call_ratio
                }
        
        # Calculate IV/RV ratio if we have both
        iv_rv_ratio = None
        if 7 in iv_by_tenor and latest_price and latest_price.realized_vol_20d:
            iv_rv_ratio = iv_by_tenor[7]["iv_mid"] / latest_price.realized_vol_20d
        
        # Detect term structure pattern
        term_structure = "normal"
        if 7 in iv_by_tenor and 30 in iv_by_tenor:
            if iv_by_tenor[7]["iv_mid"] > iv_by_tenor[30]["iv_mid"]:
                term_structure = "backwardation"
            elif iv_by_tenor[7]["iv_mid"] < iv_by_tenor[30]["iv_mid"] * 0.9:
                term_structure = "steep_contango"
        
        return {
            "ticker": ticker,
            "as_of_date": latest_date.isoformat() if latest_date else None,
            "term_structure": term_structure,
            "iv_by_tenor": iv_by_tenor,
            "iv_rv_ratio": iv_rv_ratio,
            "realized_vol_20d": latest_price.realized_vol_20d if latest_price else None,
            "price": latest_price.close if latest_price else None,
            "returns_5d": latest_price.returns_5d if latest_price else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching IV stats for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compute-signals")
async def compute_iv_signals(
    lookback_days: int = Query(90, description="Days of history to analyze"),
    min_iv_rv_ratio: float = Query(1.4, description="Minimum IV/RV ratio threshold"),
    min_skew_change: float = Query(10.0, description="Minimum skew change (delta points)"),
    db: Session = Depends(get_db)
):
    """
    Compute IV catalyst signals based on current data.
    
    This endpoint analyzes all tickers with upcoming catalysts and generates
    signals based on IV patterns.
    
    Signal generation rules:
    1. Backwardation flag: 7D IV > 30D IV (by >10%)
    2. IV/RV flag: IV/20D RV > threshold (default 1.4)
    3. Skew flag: Current skew - 20D median > threshold (default 10 pts)
    4. OI flag: Current OI > 2× 30D average
    """
    try:
        today = datetime.utcnow()
        cutoff_date = today + timedelta(days=60)  # Look 60 days ahead
        
        # Get upcoming catalysts
        catalysts = db.query(Catalyst).filter(
            and_(
                Catalyst.event_date >= today,
                Catalyst.event_date <= cutoff_date,
                Catalyst.status == "Upcoming"
            )
        ).all()
        
        signals_generated = 0
        
        for catalyst in catalysts:
            ticker = catalyst.company
            if not ticker:
                continue
            
            # Get latest IV data
            iv7 = db.query(OptionsIV).filter(
                and_(
                    OptionsIV.ticker == ticker,
                    OptionsIV.tenor_days == 7
                )
            ).order_by(OptionsIV.date.desc()).first()
            
            iv30 = db.query(OptionsIV).filter(
                and_(
                    OptionsIV.ticker == ticker,
                    OptionsIV.tenor_days == 30
                )
            ).order_by(OptionsIV.date.desc()).first()
            
            price = db.query(PriceData).filter(
                PriceData.ticker == ticker
            ).order_by(PriceData.date.desc()).first()
            
            if not iv7 or not iv30 or not price:
                continue
            
            # Check if 5D return is quiet (-2% to +2%)
            if price.returns_5d and abs(price.returns_5d) > 0.02:
                continue  # Skip if price is moving too much
            
            # Calculate signal flags
            backw_flag = 1 if (iv7.iv_mid > iv30.iv_mid * 1.1) else 0
            
            iv_rv_ratio = iv7.iv_mid / price.realized_vol_20d if price.realized_vol_20d else 0
            ivrv_flag = 1 if iv_rv_ratio > min_iv_rv_ratio else 0
            
            skew_change = abs(iv7.skew_25d - iv7.skew_25d_20d_median) if (iv7.skew_25d and iv7.skew_25d_20d_median) else 0
            skew_flag = 1 if skew_change > min_skew_change else 0
            
            # OI flag: Current OI > 2× 30D average
            oi_30d_avg = _calculate_oi_30d_average(db, ticker, 7)
            oi_flag = 1 if (oi_30d_avg > 0 and iv7.total_oi > oi_30d_avg * 2.0) else 0
            
            signal_score = backw_flag + ivrv_flag + skew_flag + oi_flag
            
            # Only create signal if score >= 2
            if signal_score >= 2:
                days_to_event = (catalyst.event_date - today).days
                
                # Run sanity checks before creating signal
                is_valid, warnings = validate_iv_signal(
                    db, ticker, catalyst.id, catalyst.event_date, today
                )
                
                # Skip if critical checks failed
                if not is_valid:
                    logger.info(f"Signal for {ticker} failed validation: {', '.join(warnings)}")
                    continue
                
                # Check for sector-wide volatility
                xbi_change = get_xbi_iv_change(db, today, tenor_days=7, lookback_days=7)
                adjusted_iv, is_sector_driven = adjust_for_sector_iv(
                    iv7.iv_mid, xbi_change, threshold=5.0
                )
                
                # Downgrade quality if sector-driven
                base_quality = None
                if signal_score >= 3 and iv7.iv_pctile_1y and iv7.iv_pctile_1y < 85:
                    base_quality = "High"
                elif signal_score >= 2:
                    base_quality = "Medium"
                else:
                    base_quality = "Low"
                
                # Apply sector adjustment to quality
                if is_sector_driven:
                    if base_quality == "High":
                        quality = "Medium"
                    elif base_quality == "Medium":
                        quality = "Low"
                    else:
                        # Skip low-quality sector-driven signals
                        logger.info(f"Skipping {ticker}: sector-driven with low base quality")
                        continue
                    logger.info(f"{ticker} quality downgraded due to sector-wide move")
                else:
                    quality = base_quality
                
                confidence = signal_score / 4.0
                
                # Reduce confidence if warnings present
                if warnings:
                    confidence = confidence * 0.9
                    logger.info(f"{ticker} confidence reduced due to warnings: {', '.join(warnings)}")
                
                # Check if signal already exists for this ticker/catalyst
                existing = db.query(IVCatalystSignal).filter(
                    and_(
                        IVCatalystSignal.ticker == ticker,
                        IVCatalystSignal.catalyst_id == catalyst.id,
                        IVCatalystSignal.signal_date >= today - timedelta(days=1)
                    )
                ).first()
                
                if not existing:
                    signal = IVCatalystSignal(
                        ticker=ticker,
                        signal_date=today,
                        catalyst_id=catalyst.id,
                        event_date=catalyst.event_date,
                        event_type=catalyst.kind or catalyst.event_type,
                        days_to_event=days_to_event,
                        iv7=iv7.iv_mid,
                        iv30=iv30.iv_mid,
                        iv_rv_ratio=iv_rv_ratio,
                        term_backwardation=iv7.iv_mid - iv30.iv_mid,
                        skew25d=iv7.skew_25d,
                        skew_change=skew_change,
                        iv7_pctile=iv7.iv_pctile_1y,
                        price=price.close,
                        ret5d=price.returns_5d,
                        backw_flag=backw_flag,
                        ivrv_flag=ivrv_flag,
                        skew_flag=skew_flag,
                        oi_flag=oi_flag,
                        signal_score=signal_score,
                        confidence=confidence,
                        quality=quality
                    )
                    db.add(signal)
                    signals_generated += 1
        
        db.commit()
        
        return {
            "status": "success",
            "signals_generated": signals_generated,
            "catalysts_analyzed": len(catalysts),
            "timestamp": today.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error computing IV signals: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/peer-comparison/{ticker}")
async def get_peer_comparison(
    ticker: str,
    moa_filter: Optional[str] = Query(None, description="Filter by mechanism of action"),
    therapeutic_area: Optional[str] = Query(None, description="Filter by therapeutic area"),
    db: Session = Depends(get_db)
):
    """
    Get IV percentile comparison for a ticker vs its peers.
    
    Compares IV7 percentile across companies with:
    - Same mechanism of action (MOA)
    - Same therapeutic area
    - Similar market cap bucket
    
    Returns cross-sectional view to identify idiosyncratic vs sector-wide IV moves.
    """
    try:
        ticker = ticker.upper()
        
        # Get the target company
        target_company = db.query(Company).filter(
            Company.ticker == ticker
        ).first()
        
        if not target_company:
            raise HTTPException(status_code=404, detail=f"Company not found: {ticker}")
        
        # Get target's latest IV data
        target_iv = db.query(OptionsIV).filter(
            and_(
                OptionsIV.ticker == ticker,
                OptionsIV.tenor_days == 7
            )
        ).order_by(OptionsIV.date.desc()).first()
        
        if not target_iv:
            raise HTTPException(status_code=404, detail=f"No IV data found for {ticker}")
        
        # Build peer query
        peer_query = db.query(Company).filter(
            and_(
                Company.ticker != ticker,
                Company.ticker.isnot(None),
                Company.is_xbi_constituent == True
            )
        )
        
        # Filter by therapeutic area if target has one
        if therapeutic_area:
            peer_query = peer_query.filter(
                Company.therapeutic_areas.like(f"%{therapeutic_area}%")
            )
        elif target_company.therapeutic_areas:
            # Use target's therapeutic areas
            areas = target_company.therapeutic_areas.split(',')
            if areas:
                filters = [Company.therapeutic_areas.like(f"%{area.strip()}%") for area in areas]
                peer_query = peer_query.filter(or_(*filters))
        
        # Get peer companies
        peers = peer_query.limit(20).all()
        
        # Get IV data for peers
        peer_data = []
        for peer in peers:
            peer_iv = db.query(OptionsIV).filter(
                and_(
                    OptionsIV.ticker == peer.ticker,
                    OptionsIV.tenor_days == 7
                )
            ).order_by(OptionsIV.date.desc()).first()
            
            if peer_iv:
                peer_data.append({
                    "ticker": peer.ticker,
                    "name": peer.name,
                    "iv7": peer_iv.iv_mid,
                    "iv7_pctile": peer_iv.iv_pctile_1y,
                    "iv30": None,  # Will fetch if needed
                    "therapeutic_areas": peer.therapeutic_areas,
                    "market_cap": peer.market_cap,
                    "is_backwardation": peer_iv.is_backwardation
                })
        
        # Sort by IV percentile descending
        peer_data.sort(key=lambda x: x["iv7_pctile"] or 0, reverse=True)
        
        # Calculate sector statistics
        if peer_data:
            iv_percentiles = [p["iv7_pctile"] for p in peer_data if p["iv7_pctile"]]
            sector_median = sorted(iv_percentiles)[len(iv_percentiles) // 2] if iv_percentiles else None
            sector_mean = sum(iv_percentiles) / len(iv_percentiles) if iv_percentiles else None
        else:
            sector_median = None
            sector_mean = None
        
        # Determine if target is idiosyncratic
        is_idiosyncratic = False
        if target_iv.iv_pctile_1y and sector_median:
            deviation = abs(target_iv.iv_pctile_1y - sector_median)
            is_idiosyncratic = deviation > 20  # >20 percentile points = idiosyncratic
        
        return {
            "ticker": ticker,
            "name": target_company.name,
            "target_iv": {
                "iv7": target_iv.iv_mid,
                "iv7_pctile": target_iv.iv_pctile_1y,
                "as_of_date": target_iv.date.isoformat()
            },
            "sector_stats": {
                "median_iv_pctile": sector_median,
                "mean_iv_pctile": sector_mean,
                "sample_size": len(peer_data)
            },
            "is_idiosyncratic": is_idiosyncratic,
            "peers": peer_data,
            "filters": {
                "moa": moa_filter,
                "therapeutic_area": therapeutic_area or target_company.therapeutic_areas
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching peer comparison for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
