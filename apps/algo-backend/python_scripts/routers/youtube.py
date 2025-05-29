from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from database import get_db
from models import TrendQuery, YouTubeData, ContentCreator, CreatorContent
from utils.youtube_scraper import get_youtube_trends, search_youtube_videos, get_video_details
from utils.beautifulsoup_scraper import scrape_youtube_trends, scrape_youtube_search, scrape_video_details
from utils.youtube_analyzer import YouTubeAnalyzer

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/youtube",
    tags=["youtube"],
    responses={404: {"description": "Not found"}},
)

@router.get("/trends")
async def get_trends(
    region: str = Query("US", description="Geographical region (e.g., 'US', 'FR', 'GB')"),
    limit: int = Query(10, description="Maximum number of videos to return"),
    db: Session = Depends(get_db)
):
    """
    Get trending videos from YouTube.
    """
    try:
        # Try primary method (youtube-search-python)
        result = await get_youtube_trends(region=region, limit=limit)
        
        # If primary method fails, try BeautifulSoup scraping
        if result.get('status') == 'error':
            logger.warning(f"Primary method failed, trying BeautifulSoup scraping: {result.get('error')}")
            result = await scrape_youtube_trends(region=region, limit=limit)
        
        if result.get('status') == 'error':
            raise HTTPException(status_code=400, detail=result.get('error'))
        
        return result.get('processed_data')
        
    except Exception as e:
        logger.error(f"Error getting YouTube trends: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_videos(
    query: str = Query(..., description="Search query"),
    region: str = Query("US", description="Geographical region (e.g., 'US', 'FR', 'GB')"),
    limit: int = Query(10, description="Maximum number of results to return"),
    sort_by: str = Query("relevance", description="Sort order (relevance, rating, upload_date, view_count)"),
    db: Session = Depends(get_db)
):
    """
    Search for YouTube videos.
    """
    try:
        # Try primary method (youtube-search-python)
        result = await search_youtube_videos(query=query, region=region, limit=limit, sort_by=sort_by)
        
        # If primary method fails, try BeautifulSoup scraping
        if result.get('status') == 'error':
            logger.warning(f"Primary method failed, trying BeautifulSoup scraping: {result.get('error')}")
            result = await scrape_youtube_search(query=query, region=region, limit=limit)
        
        if result.get('status') == 'error':
            raise HTTPException(status_code=400, detail=result.get('error'))
        
        return result.get('processed_data')
        
    except Exception as e:
        logger.error(f"Error searching YouTube videos: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/video/{video_id}")
async def get_video(
    video_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific YouTube video.
    """
    try:
        # Try primary method (youtube-search-python)
        result = await get_video_details(video_id=video_id)
        
        # If primary method fails, try BeautifulSoup scraping
        if result.get('status') == 'error':
            logger.warning(f"Primary method failed, trying BeautifulSoup scraping: {result.get('error')}")
            result = await scrape_video_details(video_id=video_id)
        
        if result.get('status') == 'error':
            raise HTTPException(status_code=400, detail=result.get('error'))
        
        return result.get('processed_data')
        
    except Exception as e:
        logger.error(f"Error getting video details: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/queries/{query_id}/videos")
async def get_query_videos(
    query_id: int,
    db: Session = Depends(get_db)
):
    """Get all YouTube videos associated with a trend query"""
    query = db.query(TrendQuery).filter(TrendQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Trend query not found")
    
    videos = db.query(YouTubeData).filter(YouTubeData.query_id == query_id).all()
    return [video.to_dict() for video in videos]

@router.post("/queries/{query_id}/videos")
async def add_video_to_query(
    query_id: int,
    video_id: str,
    db: Session = Depends(get_db)
):
    """Add a YouTube video to a trend query"""
    # Check if query exists
    query = db.query(TrendQuery).filter(TrendQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Trend query not found")
    
    # Get video details
    result = get_video_details(video_id)
    if result['status'] != 'success':
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to get video details'))
    
    video_data = result['processed_data']
    
    # Create new YouTube data record
    youtube_data = YouTubeData(
        query_id=query_id,
        video_id=video_data['video_id'],
        title=video_data['title'],
        channel_name=video_data['channel']['name'],
        views=video_data['views'],
        duration=video_data['duration'],
        published_at=datetime.fromisoformat(video_data['published'].replace('Z', '+00:00')),
        thumbnail_url=video_data['thumbnail'],
        video_url=video_data['link'],
        description=video_data['description'],
        video_metadata={
            'channel_id': video_data['channel']['id'],
            'subscribers': video_data['channel']['subscribers'],
            'keywords': video_data['keywords'],
            'category': video_data['category']
        }
    )
    
    db.add(youtube_data)
    db.commit()
    db.refresh(youtube_data)
    
    return youtube_data.to_dict()

@router.get("/trends/history")
async def get_trends_history(
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(10, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Get historical trend data from the database.
    """
    try:
        # Query the database for trend queries with YouTube data
        queries = db.query(TrendQuery).filter(
            TrendQuery.youtube_data.any()
        ).offset(skip).limit(limit).all()
        
        results = []
        for query in queries:
            youtube_data = query.youtube_data[0] if query.youtube_data else None
            if youtube_data:
                results.append({
                    'query_id': query.id,
                    'keyword': query.keyword,
                    'region': query.region,
                    'video_id': youtube_data.video_id,
                    'title': youtube_data.title,
                    'channel_name': youtube_data.channel_name,
                    'views': youtube_data.views,
                    'duration': youtube_data.duration,
                    'published_at': youtube_data.published_at,
                    'thumbnail_url': youtube_data.thumbnail_url,
                    'video_url': youtube_data.video_url,
                    'description': youtube_data.description,
                    'created_at': youtube_data.created_at,
                    'updated_at': youtube_data.updated_at
                })
        
        return {
            'total': len(results),
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error getting trends history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 