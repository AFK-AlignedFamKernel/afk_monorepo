from youtubesearchpython import VideosSearch, CustomSearch
from pytube import YouTube, Search
from typing import Dict, Any, List, Optional
import json
from datetime import datetime
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from .rate_limiter import with_retry, RateLimiter

# Configure logging
logger = logging.getLogger(__name__)

# Create a rate limiter instance for YouTube
youtube_limiter = RateLimiter(max_requests=5, time_window=60)  # 5 requests per minute

@with_retry(max_retries=3, rate_limiter=youtube_limiter)
async def get_youtube_trends(region: str = "US", limit: int = 10) -> Dict[str, Any]:
    """
    Get trending videos from YouTube using multiple methods.
    
    Parameters:
    - region: Geographical region (e.g., 'US', 'FR', 'GB')
    - limit: Maximum number of videos to return
    """
    try:
        # Try different methods to get trending videos
        videos = []
        
        # Method 1: Using youtube-search-python
        try:
            search = VideosSearch(
                "trending",
                region=region,
                limit=limit,
                language="en"
            )
            results = search.result()
            
            for video in results.get('result', []):
                try:
                    videos.append({
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
                    })
                except Exception as e:
                    logger.error(f"Error processing video from youtube-search-python: {str(e)}")
                    continue
        except Exception as e:
            logger.error(f"Error with youtube-search-python: {str(e)}")
        
        # Method 2: Using pytube
        if len(videos) < limit:
            try:
                search = Search("trending")
                for video in search.results[:limit]:
                    try:
                        yt = YouTube(video.watch_url)
                        videos.append({
                            'video_id': yt.video_id,
                            'title': yt.title,
                            'channel': {
                                'name': yt.author,
                                'id': yt.channel_id,
                                'subscribers': None
                            },
                            'views': str(yt.views),
                            'duration': str(yt.length),
                            'published': yt.publish_date.isoformat() if yt.publish_date else None,
                            'thumbnail': yt.thumbnail_url,
                            'link': video.watch_url,
                            'description': yt.description
                        })
                    except Exception as e:
                        logger.error(f"Error processing video from pytube: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error with pytube: {str(e)}")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_videos = []
        for video in videos:
            if video['video_id'] not in seen:
                seen.add(video['video_id'])
                unique_videos.append(video)
        
        return {
            'status': 'success',
            'processed_data': {
                'videos': unique_videos[:limit],
                'region': region,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting YouTube trends: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': f"Failed to get YouTube trends: {str(e)}"
        }

@with_retry(max_retries=3, rate_limiter=youtube_limiter)
async def search_youtube_videos(query: str, region: str = "US", limit: int = 10, sort_by: str = "relevance") -> Dict[str, Any]:
    """
    Search for videos on YouTube using multiple methods.
    
    Parameters:
    - query: Search query
    - region: Geographical region (e.g., "US", "FR", "GB")
    - limit: Maximum number of results to return
    - sort_by: Sort order ("relevance", "upload_date", "view_count", "rating")
    """
    try:
        videos = []
        
        # Method 1: Using youtube-search-python
        try:
            # Map sort_by to the correct parameter
            sort_mapping = {
                "relevance": "relevance",
                "upload_date": "date",
                "view_count": "views",
                "rating": "rating"
            }
            sort_param = sort_mapping.get(sort_by, "relevance")
            
            search = VideosSearch(
                query,
                region=region,
                limit=limit,
                language="en"
            )
            results = search.result()
            
            for video in results.get('result', []):
                try:
                    videos.append({
                        'video_id': video.get('id', ''),
                        'title': video.get('title', ''),
                        'channel': {
                            'name': video.get('channel', {}).get('name', ''),
                            'id': video.get('channel', {}).get('id', ''),
                            'subscribers': video.get('channel', {}).get('subscribers', '')
                        },
                        'views': video.get('viewCount', {}).get('text', '0'),
                        'duration': video.get('duration', ''),
                        'published': video.get('publishedTime', ''),
                        'thumbnail': video.get('thumbnails', [{}])[0].get('url', ''),
                        'link': video.get('link', ''),
                        'description': video.get('descriptionSnippet', [{}])[0].get('text', '') if video.get('descriptionSnippet') else ''
                    })
                except Exception as e:
                    logger.error(f"Error processing video from youtube-search-python: {str(e)}")
                    continue
        except Exception as e:
            logger.error(f"Error with youtube-search-python: {str(e)}")
        
        # Method 2: Using pytube
        if len(videos) < limit:
            try:
                search = Search(query)
                for video in search.results[:limit]:
                    try:
                        yt = YouTube(video.watch_url)
                        videos.append({
                            'video_id': yt.video_id,
                            'title': yt.title,
                            'channel': {
                                'name': yt.author,
                                'id': yt.channel_id,
                                'subscribers': None
                            },
                            'views': str(yt.views),
                            'duration': str(yt.length),
                            'published': yt.publish_date.isoformat() if yt.publish_date else None,
                            'thumbnail': yt.thumbnail_url,
                            'link': video.watch_url,
                            'description': yt.description
                        })
                    except Exception as e:
                        logger.error(f"Error processing video from pytube: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error with pytube: {str(e)}")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_videos = []
        for video in videos:
            if video['video_id'] not in seen:
                seen.add(video['video_id'])
                unique_videos.append(video)
        
        # If no videos found, try one more time with a different query format
        if not unique_videos:
            try:
                search = VideosSearch(
                    f"{query} news",  # Try with a more specific query
                    region=region,
                    limit=limit,
                    language="en"
                )
                results = search.result()
                
                for video in results.get('result', []):
                    try:
                        video_data = {
                            'video_id': video.get('id', ''),
                            'title': video.get('title', ''),
                            'channel': {
                                'name': video.get('channel', {}).get('name', ''),
                                'id': video.get('channel', {}).get('id', ''),
                                'subscribers': video.get('channel', {}).get('subscribers', '')
                            },
                            'views': video.get('viewCount', {}).get('text', '0'),
                            'duration': video.get('duration', ''),
                            'published': video.get('publishedTime', ''),
                            'thumbnail': video.get('thumbnails', [{}])[0].get('url', ''),
                            'link': video.get('link', ''),
                            'description': video.get('descriptionSnippet', [{}])[0].get('text', '') if video.get('descriptionSnippet') else ''
                        }
                        if video_data['video_id'] not in seen:
                            seen.add(video_data['video_id'])
                            unique_videos.append(video_data)
                    except Exception as e:
                        logger.error(f"Error processing video from retry search: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error with retry search: {str(e)}")
        
        return {
            'status': 'success',
            'processed_data': {
                'query': query,
                'region': region,
                'sort_by': sort_by,
                'results': unique_videos[:limit],
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error searching YouTube videos: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': f"Failed to search YouTube videos: {str(e)}"
        }

@with_retry(max_retries=3, rate_limiter=youtube_limiter)
async def get_video_details(video_id: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific YouTube video using multiple methods.
    
    Parameters:
    - video_id: The YouTube video ID
    """
    try:
        video_details = None
        
        # Method 1: Using pytube
        try:
            yt = YouTube(f"https://www.youtube.com/watch?v={video_id}")
            video_details = {
                'video_id': yt.video_id,
                'title': yt.title,
                'channel': {
                    'name': yt.author,
                    'id': yt.channel_id,
                    'subscribers': None
                },
                'views': str(yt.views),
                'duration': str(yt.length),
                'published': yt.publish_date.isoformat() if yt.publish_date else None,
                'thumbnail': yt.thumbnail_url,
                'link': f"https://www.youtube.com/watch?v={video_id}",
                'description': yt.description,
                'keywords': yt.keywords,
                'category': yt.category,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error with pytube: {str(e)}")
        
        # Method 2: Using youtube-search-python
        if not video_details:
            try:
                search = VideosSearch(video_id, limit=1)
                results = search.result()
                
                if results.get('result'):
                    video = results['result'][0]
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
            except Exception as e:
                logger.error(f"Error with youtube-search-python: {str(e)}")
        
        if not video_details:
            return {
                'status': 'error',
                'error': 'Video not found'
            }
        
        return {
            'status': 'success',
            'processed_data': video_details
        }
        
    except Exception as e:
        logger.error(f"Error getting video details: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': f"Failed to get video details: {str(e)}"
        } 