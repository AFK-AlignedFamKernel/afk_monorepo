from youtubesearchpython import VideosSearch, CustomSearch
from typing import Dict, Any, List
import json
from datetime import datetime

def get_youtube_trends(region: str = "US", limit: int = 10) -> Dict[str, Any]:
    """
    Get trending videos from YouTube.
    
    Parameters:
    - region: Geographical region (e.g., 'US', 'FR', 'GB')
    - limit: Maximum number of videos to return
    """
    try:
        # Initialize video search for trending videos
        search = VideosSearch(
            "trending",
            region=region,
            limit=limit,
            language="en",
            # order="view_count"  # Sort by view count to get popular videos
        )
        
        # Get results
        results = search.result()
        
        # Process the data
        videos = []
        for video in results.get('result', []):
            processed_video = {
                'video_id': video.get('id'),
                'title': video.get('title'),
                'channel': {
                    'name': video.get('channel', {}).get('name'),
                    'id': video.get('channel', {}).get('id'),
                    'subscribers': video.get('channel', {}).get('subscribers')
                },
                'views': video.get('viewCount', {}).get('text'),
                'duration': video.get('duration'),
                'published': video.get('publishedTime'),
                'thumbnail': video.get('thumbnails', [{}])[0].get('url'),
                'link': video.get('link'),
                'description': video.get('description')
            }
            videos.append(processed_video)
        
        return {
            'status': 'success',
            'processed_data': {
                'videos': videos,
                'region': region,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def search_youtube_videos(
    query: str,
    region: str = "US",
    limit: int = 10,
    sort_by: str = "relevance"
) -> Dict[str, Any]:
    """
    Search for videos on YouTube.
    
    Parameters:
    - query: Search term
    - region: Geographical region (e.g., 'US', 'FR', 'GB')
    - limit: Maximum number of videos to return
    - sort_by: Sort order ('relevance', 'upload_date', 'view_count', 'rating')
    """
    try:
        # Initialize video search
        search = VideosSearch(
            query,
            region=region,
            limit=limit,
            language="en",
            order=sort_by
        )
        
        # Get results
        results = search.result()
        
        # Process the data
        videos = []
        for video in results.get('result', []):
            processed_video = {
                'video_id': video.get('id'),
                'title': video.get('title'),
                'channel': video.get('channel', {}).get('name'),
                'views': video.get('viewCount', {}).get('text'),
                'duration': video.get('duration'),
                'published': video.get('publishedTime'),
                'thumbnail': video.get('thumbnails', [{}])[0].get('url'),
                'link': video.get('link'),
                'description': video.get('description')
            }
            videos.append(processed_video)
        
        return {
            'status': 'success',
            'processed_data': {
                'query': query,
                'videos': videos,
                'region': region,
                'sort_by': sort_by,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def get_video_details(video_id: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific YouTube video.
    
    Parameters:
    - video_id: The YouTube video ID
    """
    try:
        # Initialize video search with specific video ID
        search = VideosSearch(video_id, limit=1)
        
        # Get results
        results = search.result()
        
        if not results.get('result'):
            return {
                'status': 'error',
                'error': 'Video not found'
            }
        
        video = results['result'][0]
        
        # Process the data
        video_details = {
            'video_id': video.get('id'),
            'title': video.get('title'),
            'channel': {
                'name': video.get('channel', {}).get('name'),
                'id': video.get('channel', {}).get('id'),
                'subscribers': video.get('channel', {}).get('subscribers')
            },
            'views': video.get('viewCount', {}).get('text'),
            'duration': video.get('duration'),
            'published': video.get('publishedTime'),
            'thumbnail': video.get('thumbnails', [{}])[0].get('url'),
            'link': video.get('link'),
            'description': video.get('description'),
            'keywords': video.get('keywords', []),
            'category': video.get('category'),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return {
            'status': 'success',
            'processed_data': video_details
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        } 