from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
from datetime import datetime
import pandas as pd

from database import get_db
from models import TrendQuery, TrendData, TrendPlot
from utils.google_trends import get_google_trends_data, get_trending_searches, get_trends_for_keyword
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
    result = await get_trending_searches(geo, category)
    
    if result['status'] != 'success':
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch trending searches'))
    
    return result['processed_data']

@router.get("/trends/")
async def get_trend_data(
    keyword: str,
    timeframe: str = "today 12-m",
    geo: str = "US",
    db: Session = Depends(get_db)
):
    """
    Get trend data for a keyword.
    
    Parameters:
    - keyword: The search term to analyze
    - timeframe: Time range for the data (e.g., 'today 12-m', '2023-01-01 2023-12-31')
    - geo: Geographical region (e.g., 'US', 'FR', 'GB')
    """
    # Get trend data
    result = await get_trends_for_keyword(keyword, geo, timeframe)
    
    if result['status'] != 'success':
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch trend data'))
    
    # Format the data for UI
    formatted_result = format_trend_data_for_ui(result['processed_data'])
    
    if formatted_result['status'] != 'success':
        raise HTTPException(status_code=400, detail=formatted_result.get('error', 'Failed to format trend data'))
    
    return formatted_result['data']

@router.get("/trends/{query_id}")
async def get_trend_query(query_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific trend query"""
    query = db.query(TrendQuery).filter(TrendQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Trend query not found")
    
    # Get the latest data
    result = await get_trends_for_keyword(
        keyword=query.keyword,
        timeframe=query.timeframe,
        geo=query.geo
    )
    
    if result['status'] != 'success':
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch trend data'))
    
    # Format the data for UI
    formatted_result = format_trend_data_for_ui(result['processed_data'])
    
    if formatted_result['status'] != 'success':
        raise HTTPException(status_code=400, detail=formatted_result.get('error', 'Failed to format trend data'))
    
    return {
        **query.to_dict(),
        'data': formatted_result['data']
    }

@router.get("/trends/{query_id}/insights")
async def get_trend_insights(query_id: int, db: Session = Depends(get_db)):
    """Get detailed insights about a trend query"""
    query = db.query(TrendQuery).filter(TrendQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Trend query not found")
    
    # Get the latest data
    result = await get_google_trends_data(
        keyword=query.keyword,
        timeframe=query.timeframe,
        geo=query.geo
    )
    
    if result['status'] != 'success':
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch trend data'))
    
    # Generate insights
    insights = get_keyword_insights(result['processed_data'])
    
    return {
        'query_id': query_id,
        'keyword': query.keyword,
        'insights': insights
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
    # Get Google Trends data first
    trends_result = await get_trends_for_keyword(keyword, geo, timeframe)
    
    if trends_result['status'] != 'success':
        raise HTTPException(status_code=400, detail=trends_result.get('error', 'Failed to fetch trend data'))
    
    # Format the data for UI
    formatted_result = format_trend_data_for_ui(trends_result['processed_data'])
    
    if formatted_result['status'] != 'success':
        raise HTTPException(status_code=400, detail=formatted_result.get('error', 'Failed to format trend data'))
    
    # Check if query already exists
    existing_query = db.query(TrendQuery).filter(
        TrendQuery.keyword == keyword,
        TrendQuery.timeframe == timeframe,
        TrendQuery.geo == geo
    ).first()
    
    if existing_query:
        # Update existing query with new data
        existing_query.query_metadata.update({
            'related_queries': trends_result['processed_data'].get('related_queries', {}),
            'related_topics': trends_result['processed_data'].get('related_topics', {}),
            'last_checked': datetime.utcnow().isoformat()
        })
        db.commit()
        db.refresh(existing_query)
        
        return {
            **formatted_result['data'],
            'is_cached': True
        }
    
    # Create new trend query
    trend_query = TrendQuery(
        keyword=keyword,
        timeframe=timeframe,
        geo=geo,
        query_metadata={
            'related_queries': trends_result['processed_data'].get('related_queries', {}),
            'related_topics': trends_result['processed_data'].get('related_topics', {}),
            'last_checked': datetime.utcnow().isoformat()
        }
    )
    
    db.add(trend_query)
    db.commit()
    db.refresh(trend_query)
    
    # Save trend data
    for data_point in trends_result['processed_data']['data']:
        trend_data = TrendData(
            query_id=trend_query.id,
            date=datetime.fromisoformat(data_point['date']),
            value=data_point['value'],
            is_partial=data_point['is_partial'],
            data_metadata={}
        )
        db.add(trend_data)
    
    db.commit()
    
    return {
        **formatted_result['data'],
        'is_cached': False
    }

@router.get("/trends/keyword/{keyword}")
async def get_trend_keyword(
    keyword: str,
    geo: str = "US",
    timeframe: str = "today 12-m",
    db: Session = Depends(get_db)
):
    """
    Get trend data for a specific keyword.
    
    Parameters:
    - keyword: The search term to analyze
    - geo: Geographical region (e.g., 'US', 'FR', 'GB')
    - timeframe: Time range for the data (e.g., 'today 12-m', '2023-01-01 2023-12-31')
    """
    # Get trend data
    result = await get_trends_for_keyword(keyword, geo, timeframe)
    
    if result['status'] != 'success':
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch trend data'))
    
    # Format the data for UI
    formatted_result = format_trend_data_for_ui(result['processed_data'])
    
    if formatted_result['status'] != 'success':
        raise HTTPException(status_code=400, detail=formatted_result.get('error', 'Failed to format trend data'))
    
    return formatted_result['data'] 