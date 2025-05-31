import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from database import get_db
from models import Category, CategoryTrendData, ContentCreator, CreatorContent
from utils.google_trends import GoogleTrendsAnalyzer
from utils.youtube_analyzer import YouTubeAnalyzer
from utils.twitter_analyzer import TwitterAnalyzer
from utils.reddit_analyzer import RedditAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/niche-analytics",
    tags=["niche-analytics"],
    responses={404: {"description": "Not found"}},
)

# Weights for Mindshare Calculation
MINDSHARE_WEIGHTS = {
    'youtube': {'views': 0.001, 'likes': 0.05, 'comments': 0.5},
    'twitter': {'retweets': 0.1, 'likes': 0.05, 'replies': 0.2, 'quotes': 0.15},
    'reddit': {'score': 0.05, 'comments': 0.2},
    'google_trends': {'interest': 0.3}
}

# Minimum content count for a creator to be considered "regular"
MIN_REGULAR_CONTENT_COUNT = 3

class NicheAnalyticsRequest(BaseModel):
    topic: str
    timeframe: Optional[str] = "today 12-m"
    max_search_items_per_platform: Optional[int] = 50

class NicheAnalyticsResponse(BaseModel):
    message: str
    topic: str
    top_creators: List[Dict]
    total_creators_analyzed: int
    google_trends_data: Optional[Dict]
    timestamp: str

@router.post("/niche-analytics", response_model=NicheAnalyticsResponse)
async def get_niche_analytics(request: NicheAnalyticsRequest):
    """
    Aggregate niche analytics data from multiple sources including:
    - Google Trends
    - YouTube
    - Twitter
    - Reddit
    """
    try:
        all_creators = {}
        
        # Initialize analyzers
        google_trends = GoogleTrendsAnalyzer()
        youtube_analyzer = YouTubeAnalyzer()
        twitter_analyzer = TwitterAnalyzer()
        reddit_analyzer = RedditAnalyzer()
        
        # --- Fetch Google Trends Data ---
        logger.info('Fetching Google Trends data...')
        google_trends_data = await google_trends.get_trend_data(
            request.topic,
            timeframe=request.timeframe
        )
        
        # --- Fetch YouTube Data ---
        logger.info('Fetching YouTube data...')
        youtube_creators = await youtube_analyzer.analyze_topic(
            request.topic,
            max_results=request.max_search_items_per_platform
        )
        
        for creator in youtube_creators:
            creator_id = f"youtube_{creator['channel_id']}"
            creator['mindshare'] = (
                creator['total_views'] * MINDSHARE_WEIGHTS['youtube']['views'] +
                creator['total_likes'] * MINDSHARE_WEIGHTS['youtube']['likes'] +
                creator['total_comments'] * MINDSHARE_WEIGHTS['youtube']['comments']
            )
            creator['platform_data'] = {'youtube': creator}
            
            if creator['content_count'] >= MIN_REGULAR_CONTENT_COUNT:
                all_creators[creator_id] = creator
        
        # --- Fetch Twitter Data ---
        logger.info('Fetching Twitter data...')
        twitter_creators = await twitter_analyzer.analyze_topic(
            request.topic,
            max_results=request.max_search_items_per_platform
        )
        
        for creator in twitter_creators:
            creator_id = f"twitter_{creator['id']}"
            creator['mindshare'] = (
                creator['total_retweets'] * MINDSHARE_WEIGHTS['twitter']['retweets'] +
                creator['total_likes'] * MINDSHARE_WEIGHTS['twitter']['likes'] +
                creator['total_replies'] * MINDSHARE_WEIGHTS['twitter']['replies'] +
                creator['total_quotes'] * MINDSHARE_WEIGHTS['twitter']['quotes']
            )
            
            if creator_id in all_creators:
                all_creators[creator_id]['mindshare'] += creator['mindshare']
                all_creators[creator_id]['content_count'] += creator['content_count']
                all_creators[creator_id]['platform_data']['twitter'] = creator
            else:
                creator['platform_data'] = {'twitter': creator}
                if creator['content_count'] >= MIN_REGULAR_CONTENT_COUNT:
                    all_creators[creator_id] = creator
        
        # --- Fetch Reddit Data ---
        logger.info('Fetching Reddit data...')
        reddit_creators = await reddit_analyzer.analyze_topic(
            request.topic,
            max_results=request.max_search_items_per_platform
        )
        
        for creator in reddit_creators:
            creator_id = f"reddit_{creator['username']}"
            creator['mindshare'] = (
                creator['total_score'] * MINDSHARE_WEIGHTS['reddit']['score'] +
                creator['total_comments'] * MINDSHARE_WEIGHTS['reddit']['comments']
            )
            
            if creator_id in all_creators:
                all_creators[creator_id]['mindshare'] += creator['mindshare']
                all_creators[creator_id]['content_count'] += creator['content_count']
                all_creators[creator_id]['platform_data']['reddit'] = creator
            else:
                creator['platform_data'] = {'reddit': creator}
                if creator['content_count'] >= MIN_REGULAR_CONTENT_COUNT:
                    all_creators[creator_id] = creator
        
        # --- Final Aggregation and Sorting ---
        final_creators = list(all_creators.values())
        final_creators.sort(key=lambda x: x['mindshare'], reverse=True)
        top_20_creators = final_creators[:20]
        
        return NicheAnalyticsResponse(
            message=f"Niche analytics for '{request.topic}' processed successfully.",
            topic=request.topic,
            top_creators=top_20_creators,
            total_creators_analyzed=len(final_creators),
            google_trends_data=google_trends_data,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error in niche analytics endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 