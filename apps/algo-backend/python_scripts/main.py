from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
from datetime import datetime
import pandas as pd

from database import get_db, engine
import models
from google_trends import get_google_trends_data, get_trending_searches
from process_trends import process_trends_data

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Google Trends API")

# Create plots directory if it doesn't exist
PLOTS_DIR = "plots"
os.makedirs(PLOTS_DIR, exist_ok=True)

@app.get("/trends/trending")
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

@app.get("/trends/")
async def list_trend_queries(
    skip: int = 0,
    limit: int = 10,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.TrendQuery)
    if keyword:
        query = query.filter(models.TrendQuery.keyword.ilike(f"%{keyword}%"))
    
    queries = query.offset(skip).limit(limit).all()
    return queries

@app.get("/trends/{query_id}")
async def get_trend_query(query_id: int, db: Session = Depends(get_db)):
    query = db.query(models.TrendQuery).filter(models.TrendQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Trend query not found")
    
    # Get associated data
    data = db.query(models.TrendData).filter(models.TrendData.query_id == query_id).all()
    plot = db.query(models.TrendPlot).filter(models.TrendPlot.query_id == query_id).first()
    
    return {
        "query": {
            "id": query.id,
            "keyword": query.keyword,
            "timeframe": query.timeframe,
            "geo": query.geo,
            "created_at": query.created_at
        },
        "data": [{
            "date": d.date,
            "value": d.value,
            "is_partial": d.is_partial
        } for d in data],
        "plot_path": plot.plot_path if plot else None
    }

@app.post("/trends/")
async def create_trend_query(
    keyword: str,
    timeframe: str = "today 12-m",
    geo: str = "US",
    db: Session = Depends(get_db)
):
    # Get trends data
    trends_result = get_google_trends_data(keyword, timeframe, geo)
    
    if trends_result['status'] != 'success':
        raise HTTPException(status_code=400, detail=trends_result.get('error', 'Failed to fetch trends data'))
    
    print("trends_result", trends_result)
    # Create trend query record
    db_query = models.TrendQuery(
        keyword=keyword,
        timeframe=timeframe,
        geo=geo
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
            
        db_data = models.TrendData(
            query_id=db_query.id,
            date=date,
            value=data_point[keyword],
            is_partial=data_point.get('isPartial', 0)
        )
        db.add(db_data)
    
    # Generate and save plot
    plot_filename = f"trend_{db_query.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    plot_path = os.path.join(PLOTS_DIR, plot_filename)
    
    # Process and save plot
    process_trends_data(trends_result)
    os.rename('trends_plot.png', plot_path)
    
    # Save plot record
    db_plot = models.TrendPlot(
        query_id=db_query.id,
        plot_path=plot_path,
        plot_metadata={
            'keyword': keyword,
            'timeframe': timeframe,
            'geo': geo
        }
    )
    db.add(db_plot)
    db.commit()
    
    return {
        "query_id": db_query.id,
        "plot_path": plot_path,
        "data": trends_result['processed_data']
    } 