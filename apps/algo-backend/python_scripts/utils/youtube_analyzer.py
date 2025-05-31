from googleapiclient.discovery import build
from typing import List, Dict
import asyncio
import logging
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class YouTubeAnalyzer:
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        if not self.api_key:
            raise ValueError("YouTube API key not found in environment variables")
        
        self.youtube = build('youtube', 'v3', developerKey=self.api_key)
        self.timeout_between_requests = 60  # 1 minute between requests
        self.max_retries = 5
        self.base_retry_delay = 300  # 5 minutes base delay
        self.max_retry_delay = 3600  # Maximum 1 hour delay

    async def _handle_quota_exceeded(self, retry_count: int) -> None:
        """Handle quota exceeded error with exponential backoff."""
        import random
        delay = min(self.base_retry_delay * (2 ** retry_count), self.max_retry_delay)
        jitter = random.uniform(0, 0.2 * delay)
        total_delay = delay + jitter
        
        logger.warning(
            f"Quota exceeded. Retry {retry_count + 1}/{self.max_retries}. "
            f"Waiting for {total_delay/60:.1f} minutes before retry."
        )
        
        await asyncio.sleep(total_delay)

    async def _get_channel_stats(self, channel_id: str) -> Dict:
        """Get channel statistics."""
        try:
            response = self.youtube.channels().list(
                part='statistics,snippet',
                id=channel_id
            ).execute()
            
            if not response['items']:
                return None
                
            channel = response['items'][0]
            return {
                'channel_id': channel_id,
                'title': channel['snippet']['title'],
                'description': channel['snippet']['description'],
                'subscriber_count': int(channel['statistics'].get('subscriberCount', 0)),
                'video_count': int(channel['statistics'].get('videoCount', 0)),
                'view_count': int(channel['statistics'].get('viewCount', 0))
            }
        except Exception as e:
            logger.error(f"Error getting channel stats for {channel_id}: {str(e)}")
            return None

    async def _get_channel_videos(self, channel_id: str, max_results: int = 50) -> List[Dict]:
        """Get recent videos from a channel."""
        try:
            # First get the uploads playlist ID
            response = self.youtube.channels().list(
                part='contentDetails',
                id=channel_id
            ).execute()
            
            if not response['items']:
                return []
                
            uploads_playlist_id = response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            
            # Get videos from the uploads playlist
            videos = []
            next_page_token = None
            
            while len(videos) < max_results:
                response = self.youtube.playlistItems().list(
                    part='snippet,contentDetails',
                    playlistId=uploads_playlist_id,
                    maxResults=min(50, max_results - len(videos)),
                    pageToken=next_page_token
                ).execute()
                
                for item in response['items']:
                    video_id = item['contentDetails']['videoId']
                    video_response = self.youtube.videos().list(
                        part='statistics',
                        id=video_id
                    ).execute()
                    
                    if video_response['items']:
                        video_stats = video_response['items'][0]['statistics']
                        videos.append({
                            'video_id': video_id,
                            'title': item['snippet']['title'],
                            'published_at': item['snippet']['publishedAt'],
                            'view_count': int(video_stats.get('viewCount', 0)),
                            'like_count': int(video_stats.get('likeCount', 0)),
                            'comment_count': int(video_stats.get('commentCount', 0))
                        })
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break
                    
                await asyncio.sleep(self.timeout_between_requests)
            
            return videos
            
        except Exception as e:
            logger.error(f"Error getting channel videos for {channel_id}: {str(e)}")
            return []

    async def analyze_topic(self, topic: str, max_results: int = 50) -> List[Dict]:
        """Analyze a topic and return top creators."""
        try:
            # Search for channels
            response = self.youtube.search().list(
                part='snippet',
                q=topic,
                type='channel',
                maxResults=max_results
            ).execute()
            
            creators = []
            for item in response['items']:
                channel_id = item['id']['channelId']
                
                # Get channel stats
                channel_stats = await self._get_channel_stats(channel_id)
                if not channel_stats:
                    continue
                
                # Get recent videos
                videos = await self._get_channel_videos(channel_id, max_results=10)
                
                if videos:
                    total_views = sum(video['view_count'] for video in videos)
                    total_likes = sum(video['like_count'] for video in videos)
                    total_comments = sum(video['comment_count'] for video in videos)
                    
                    creators.append({
                        'channel_id': channel_id,
                        'title': channel_stats['title'],
                        'description': channel_stats['description'],
                        'subscriber_count': channel_stats['subscriber_count'],
                        'total_videos': channel_stats['video_count'],
                        'total_views': total_views,
                        'total_likes': total_likes,
                        'total_comments': total_comments,
                        'content_count': len(videos),
                        'recent_videos': videos[:5],  # Keep only 5 most recent videos
                        'timestamp': datetime.utcnow().isoformat()
                    })
                
                await asyncio.sleep(self.timeout_between_requests)
            
            print("creators", creators)
            return creators
            
        except Exception as e:
            if "quotaExceeded" in str(e):
                retry_count = 0
                while retry_count < self.max_retries:
                    await self._handle_quota_exceeded(retry_count)
                    retry_count += 1
                    try:
                        return await self.analyze_topic(topic, max_results)
                    except Exception as retry_error:
                        if "quotaExceeded" not in str(retry_error):
                            raise retry_error
            
            logger.error(f"Error analyzing topic {topic}: {str(e)}")
            return [] 