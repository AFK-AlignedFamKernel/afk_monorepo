from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
from datetime import datetime
import pandas as pd

from database import get_db
from models import TrendQuery, TrendData, TrendPlot
from utils.google_trends import get_google_trends_data, get_trending_searches
from utils.data_processing import (
    format_trend_data_for_ui,
    get_trend_periods,
    get_keyword_insights
)

router = APIRouter(prefix="/google", tags=["google"])

# Create plots directory if it doesn't exist
PLOTS_DIR = "plots"
os.makedirs(PLOTS_DIR, exist_ok=True)

@router.get("/trends/trending")
async def get_trending(
    geo: str = "US",
    category: str = "all",
    db: Session = Depends(get_db)
):
    """
    Get trending searches from Google Trends.
    
    Parameters:
    - geo: Geographical region (e.g., 'US', 'FR', 'GB')
    - category: Category of trending searches ('all', 'news', 'sports', etc.)
    """
    result = get_trending_searches(geo, category)
    
    if result['status'] != 'success':
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch trending searches'))
    
    return result['processed_data']

@router.get("/trends/")
async def list_trend_queries(
    skip: int = 0,
    limit: int = 10,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all trend queries with optional filtering by keyword"""
    query = db.query(TrendQuery)
    if keyword:
        query = query.filter(TrendQuery.keyword.ilike(f"%{keyword}%"))
    
    queries = query.offset(skip).limit(limit).all()
    return [q.to_dict() for q in queries]

@router.get("/trends/{query_id}")
async def get_trend_query(query_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific trend query"""
    query = db.query(TrendQuery).filter(TrendQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Trend query not found")
    
    # Get associated data
    data = db.query(TrendData).filter(TrendData.query_id == query_id).all()
    plot = db.query(TrendPlot).filter(TrendPlot.query_id == query_id).first()
    
    # Format data for UI
    data_dicts = [d.to_dict() for d in data]
    ui_data = format_trend_data_for_ui(data_dicts)
    
    return {
        "query": query.to_dict(),
        "data": ui_data,
        "plot": plot.to_dict() if plot else None
    }

@router.get("/trends/{query_id}/insights")
async def get_trend_insights(query_id: int, db: Session = Depends(get_db)):
    """Get detailed insights about a trend query"""
    query = db.query(TrendQuery).filter(TrendQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Trend query not found")
    
    # Get associated data
    data = db.query(TrendData).filter(TrendData.query_id == query_id).all()
    data_dicts = [d.to_dict() for d in data]
    
    # Get fresh related queries data
    trends_result = get_google_trends_data(query.keyword, query.timeframe, query.geo)
    related_queries = trends_result.get('processed_data', {}).get('related_queries', {})
    
    # Generate insights
    insights = get_keyword_insights(data_dicts, related_queries)
    
    return {
        "query": query.to_dict(),
        "insights": insights,
        "periods": get_trend_periods(data_dicts)
    }

@router.post("/trends/")
async def create_trend_query(
    keyword: str,
    timeframe: str = "today 12-m",
    geo: str = "US",
    db: Session = Depends(get_db)
):
    """
    Create a new trend query with enhanced Google Trends data.
    
    Parameters:
    - keyword: The search term to analyze
    - timeframe: Time range for the data (e.g., 'today 12-m', '2023-01-01 2023-12-31')
    - geo: Geographical region (e.g., 'US', 'FR', 'GB')
    """
    # Get trends data with enhanced information
    trends_result = get_google_trends_data(keyword, timeframe, geo)
    
    if trends_result['status'] != 'success':
        raise HTTPException(status_code=400, detail=trends_result.get('error', 'Failed to fetch trends data'))
    
    # Create trend query record
    db_query = TrendQuery(
        keyword=keyword,
        timeframe=timeframe,
        geo=geo,
        query_metadata={
            'related_queries': trends_result['processed_data'].get('related_queries', {}),
            'suggestions': trends_result['processed_data'].get('suggestions', [])
        }
    )
    db.add(db_query)
    db.commit()
    db.refresh(db_query)
    
    # Save trend data
    for data_point in trends_result['processed_data']['data']:
        # Convert date string to datetime object
        date_str = data_point['date']
        if isinstance(date_str, pd.Timestamp):
            date = date_str.to_pydatetime()
        else:
            date = pd.to_datetime(date_str).to_pydatetime()
            
        db_data = TrendData(
            query_id=db_query.id,
            date=date,
            value=data_point[keyword],
            is_partial=data_point.get('isPartial', 0),
            data_metadata=data_point
        )
        db.add(db_data)
    
    # Generate and save plot
    plot_filename = f"trend_{db_query.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    plot_path = os.path.join(PLOTS_DIR, plot_filename)
    
    # Process and save plot
    from ..process_trends import process_trends_data
    process_trends_data(trends_result)
    os.rename('trends_plot.png', plot_path)
    
    # Save plot record
    db_plot = TrendPlot(
        query_id=db_query.id,
        plot_path=plot_path,
        plot_metadata={
            'keyword': keyword,
            'timeframe': timeframe,
            'geo': geo,
            'created_at': datetime.now().isoformat()
        }
    )
    db.add(db_plot)
    db.commit()
    
    # Format response with UI-friendly data
    data_dicts = [d.to_dict() for d in db_query.data]
    ui_data = format_trend_data_for_ui(data_dicts)
    
    return {
        "query": db_query.to_dict(),
        "data": ui_data,
        "plot": db_plot.to_dict(),
        "insights": get_keyword_insights(data_dicts, trends_result['processed_data'].get('related_queries', {}))
    } 