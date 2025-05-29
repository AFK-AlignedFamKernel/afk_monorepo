from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from database import get_db
from models import TrendQuery, YouTubeData
from utils.youtube_scraper import get_youtube_trends, search_youtube_videos, get_video_details

router = APIRouter(prefix="/youtube", tags=["youtube"])

@router.get("/trends")
async def get_trending_videos(
    region: str = "US",
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get trending videos from YouTube.
    
    Parameters:
    - region: Geographical region (e.g., 'US', 'FR', 'GB')
    - limit: Maximum number of videos to return
    """
    result = get_youtube_trends(region, limit)
    
    if result['status'] != 'success':
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch trending videos'))
    
    return result['processed_data']

@router.get("/search")
async def search_videos(
    query: str,
    region: str = "US",
    limit: int = 10,
    sort_by: str = "relevance",
    db: Session = Depends(get_db)
):
    """
    Search for videos on YouTube.
    
    Parameters:
    - query: Search term
    - region: Geographical region (e.g., 'US', 'FR', 'GB')
    - limit: Maximum number of videos to return
    - sort_by: Sort order ('relevance', 'upload_date', 'view_count', 'rating')
    """
    result = search_youtube_videos(query, region, limit, sort_by)
    
    if result['status'] != 'success':
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to search videos'))
    
    return result['processed_data']

@router.get("/videos/{video_id}")
async def get_video(
    video_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific YouTube video.
    
    Parameters:
    - video_id: The YouTube video ID
    """
    result = get_video_details(video_id)
    
    if result['status'] != 'success':
        raise HTTPException(status_code=404, detail=result.get('error', 'Video not found'))
    
    return result['processed_data']

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