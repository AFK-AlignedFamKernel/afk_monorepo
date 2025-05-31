from bs4 import BeautifulSoup
import requests
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
from .rate_limiter import with_retry, RateLimiter

# Configure logging
logger = logging.getLogger(__name__)

# Create a rate limiter instance for web scraping
scraper_limiter = RateLimiter(max_requests=10, time_window=60)  # 10 requests per minute

@with_retry(max_retries=3, rate_limiter=scraper_limiter)
async def scrape_youtube_trends(region: str = "US", limit: int = 10) -> Dict[str, Any]:
    """
    Scrape trending videos from YouTube using BeautifulSoup.
    
    Parameters:
    - region: Geographical region (e.g., 'US', 'FR', 'GB')
    - limit: Maximum number of videos to return
    """
    try:
        # Construct URL
        url = f"https://www.youtube.com/feed/trending?bp={region}"
        
        # Set headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Make request
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find video elements
        videos = []
        video_elements = soup.find_all('div', {'class': 'ytd-video-renderer'})
        
        for element in video_elements[:limit]:
            try:
                # Extract video details
                title_element = element.find('a', {'id': 'video-title'})
                channel_element = element.find('a', {'class': 'yt-simple-endpoint style-scope yt-formatted-string'})
                views_element = element.find('span', {'class': 'style-scope ytd-video-meta-block'})
                duration_element = element.find('span', {'class': 'style-scope ytd-thumbnail-overlay-time-status-renderer'})
                
                if title_element and channel_element:
                    video = {
                        'video_id': title_element.get('href', '').split('v=')[-1],
                        'title': title_element.get('title', ''),
                        'channel': {
                            'name': channel_element.text.strip(),
                            'id': channel_element.get('href', '').split('/')[-1],
                            'subscribers': None
                        },
                        'views': views_element.text.strip() if views_element else '0',
                        'duration': duration_element.text.strip() if duration_element else '',
                        'published': None,
                        'thumbnail': f"https://i.ytimg.com/vi/{title_element.get('href', '').split('v=')[-1]}/maxresdefault.jpg",
                        'link': f"https://www.youtube.com{title_element.get('href', '')}",
                        'description': None
                    }
                    videos.append(video)
            except Exception as e:
                logger.error(f"Error processing video element: {str(e)}")
                continue
        
        return {
            'status': 'success',
            'processed_data': {
                'videos': videos,
                'region': region,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error scraping YouTube trends: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': f"Failed to scrape YouTube trends: {str(e)}"
        }

@with_retry(max_retries=3, rate_limiter=scraper_limiter)
async def scrape_youtube_search(query: str, region: str = "US", limit: int = 10) -> Dict[str, Any]:
    """
    Scrape YouTube search results using BeautifulSoup.
    
    Parameters:
    - query: Search query
    - region: Geographical region (e.g., "US", "FR", "GB")
    - limit: Maximum number of results to return
    """
    try:
        # Construct URL with proper encoding and parameters
        encoded_query = requests.utils.quote(query)
        url = f"https://www.youtube.com/results?search_query={encoded_query}&sp=CAI%253D&hl=en&gl={region}"
        
        # Set headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        }
        
        # Make request
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find video elements
        videos = []
        video_elements = soup.find_all('div', {'class': 'ytd-video-renderer'})
        
        for element in video_elements[:limit]:
            try:
                # Extract video details
                title_element = element.find('a', {'id': 'video-title'})
                channel_element = element.find('a', {'class': 'yt-simple-endpoint style-scope yt-formatted-string'})
                views_element = element.find('span', {'class': 'style-scope ytd-video-meta-block'})
                duration_element = element.find('span', {'class': 'style-scope ytd-thumbnail-overlay-time-status-renderer'})
                
                if title_element and channel_element:
                    video_id = title_element.get('href', '').split('v=')[-1]
                    if not video_id:
                        continue
                        
                    video = {
                        'video_id': video_id,
                        'title': title_element.get('title', ''),
                        'channel': {
                            'name': channel_element.text.strip(),
                            'id': channel_element.get('href', '').split('/')[-1],
                            'subscribers': None
                        },
                        'views': views_element.text.strip() if views_element else '0',
                        'duration': duration_element.text.strip() if duration_element else '',
                        'published': None,
                        'thumbnail': f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
                        'link': f"https://www.youtube.com/watch?v={video_id}",
                        'description': None
                    }
                    videos.append(video)
            except Exception as e:
                logger.error(f"Error processing video element: {str(e)}")
                continue
        
        # If no videos found, try with a different query format
        if not videos:
            try:
                # Try with a more specific query
                encoded_query = requests.utils.quote(f"{query} news")
                url = f"https://www.youtube.com/results?search_query={encoded_query}&sp=CAI%253D&hl=en&gl={region}"
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                video_elements = soup.find_all('div', {'class': 'ytd-video-renderer'})
                
                for element in video_elements[:limit]:
                    try:
                        title_element = element.find('a', {'id': 'video-title'})
                        channel_element = element.find('a', {'class': 'yt-simple-endpoint style-scope yt-formatted-string'})
                        views_element = element.find('span', {'class': 'style-scope ytd-video-meta-block'})
                        duration_element = element.find('span', {'class': 'style-scope ytd-thumbnail-overlay-time-status-renderer'})
                        
                        if title_element and channel_element:
                            video_id = title_element.get('href', '').split('v=')[-1]
                            if not video_id:
                                continue
                                
                            video = {
                                'video_id': video_id,
                                'title': title_element.get('title', ''),
                                'channel': {
                                    'name': channel_element.text.strip(),
                                    'id': channel_element.get('href', '').split('/')[-1],
                                    'subscribers': None
                                },
                                'views': views_element.text.strip() if views_element else '0',
                                'duration': duration_element.text.strip() if duration_element else '',
                                'published': None,
                                'thumbnail': f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
                                'link': f"https://www.youtube.com/watch?v={video_id}",
                                'description': None
                            }
                            videos.append(video)
                    except Exception as e:
                        logger.error(f"Error processing video element in retry: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error with retry search: {str(e)}")
        
        return {
            'status': 'success',
            'processed_data': {
                'query': query,
                'region': region,
                'results': videos,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error scraping YouTube search: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': f"Failed to scrape YouTube search: {str(e)}"
        }

@with_retry(max_retries=3, rate_limiter=scraper_limiter)
async def scrape_video_details(video_id: str) -> Dict[str, Any]:
    """
    Scrape detailed information about a specific YouTube video using BeautifulSoup.
    
    Parameters:
    - video_id: The YouTube video ID
    """
    try:
        # Construct URL
        url = f"https://www.youtube.com/watch?v={video_id}"
        
        # Set headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Make request
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract video details
        title_element = soup.find('h1', {'class': 'title'})
        channel_element = soup.find('a', {'class': 'yt-simple-endpoint style-scope yt-formatted-string'})
        views_element = soup.find('span', {'class': 'view-count'})
        description_element = soup.find('div', {'id': 'description'})
        
        if not title_element or not channel_element:
            return {
                'status': 'error',
                'error': 'Video not found'
            }
        
        video_details = {
            'video_id': video_id,
            'title': title_element.text.strip(),
            'channel': {
                'name': channel_element.text.strip(),
                'id': channel_element.get('href', '').split('/')[-1],
                'subscribers': None
            },
            'views': views_element.text.strip() if views_element else '0',
            'duration': None,
            'published': None,
            'thumbnail': f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
            'link': url,
            'description': description_element.text.strip() if description_element else None,
            'keywords': None,
            'category': None,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return {
            'status': 'success',
            'processed_data': video_details
        }
        
    except Exception as e:
        logger.error(f"Error scraping video details: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': f"Failed to scrape video details: {str(e)}"
        } 