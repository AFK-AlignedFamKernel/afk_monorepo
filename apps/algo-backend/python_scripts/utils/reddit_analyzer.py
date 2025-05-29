import praw
from typing import List, Dict
import asyncio
import logging
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class RedditAnalyzer:
    def __init__(self):
        self.client_id = os.getenv('REDDIT_CLIENT_ID')
        self.client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        self.user_agent = os.getenv('REDDIT_USER_AGENT', 'AFKAnalytics/1.0')
        
        if not all([self.client_id, self.client_secret]):
            raise ValueError("Reddit API credentials not found in environment variables")
        
        self.reddit = praw.Reddit(
            client_id=self.client_id,
            client_secret=self.client_secret,
            user_agent=self.user_agent
        )
        
        self.timeout_between_requests = 60  # 1 minute between requests
        self.max_retries = 5
        self.base_retry_delay = 300  # 5 minutes base delay
        self.max_retry_delay = 3600  # Maximum 1 hour delay

    async def _handle_rate_limit(self, retry_count: int) -> None:
        """Handle rate limit with exponential backoff."""
        import random
        delay = min(self.base_retry_delay * (2 ** retry_count), self.max_retry_delay)
        jitter = random.uniform(0, 0.2 * delay)
        total_delay = delay + jitter
        
        logger.warning(
            f"Rate limit hit. Retry {retry_count + 1}/{self.max_retries}. "
            f"Waiting for {total_delay/60:.1f} minutes before retry."
        )
        
        await asyncio.sleep(total_delay)

    async def _get_user_posts(self, username: str, max_results: int = 50) -> List[Dict]:
        """Get recent posts from a user."""
        try:
            user = self.reddit.redditor(username)
            posts = []
            
            for submission in user.submissions.new(limit=max_results):
                posts.append({
                    'post_id': submission.id,
                    'title': submission.title,
                    'text': submission.selftext,
                    'created_at': datetime.fromtimestamp(submission.created_utc).isoformat(),
                    'score': submission.score,
                    'upvote_ratio': submission.upvote_ratio,
                    'num_comments': submission.num_comments,
                    'subreddit': submission.subreddit.display_name,
                    'url': submission.url
                })
            
            return posts
            
        except Exception as e:
            logger.error(f"Error getting posts for user {username}: {str(e)}")
            return []

    async def analyze_topic(self, topic: str, max_results: int = 50) -> List[Dict]:
        """Analyze a topic and return top creators."""
        try:
            # Search for users in relevant subreddits
            subreddits = self.reddit.subreddits.search(topic, limit=5)
            users = set()
            
            for subreddit in subreddits:
                for submission in subreddit.hot(limit=100):
                    users.add(submission.author.name if submission.author else None)
                await asyncio.sleep(self.timeout_between_requests)
            
            creators = []
            for username in users:
                if not username:
                    continue
                    
                # Get user info
                try:
                    user = self.reddit.redditor(username)
                    user_info = {
                        'username': username,
                        'created_at': datetime.fromtimestamp(user.created_utc).isoformat(),
                        'karma': user.link_karma + user.comment_karma,
                        'is_mod': any(subreddit for subreddit in user.moderated()),
                        'is_gold': user.is_gold,
                        'is_verified': user.verified
                    }
                except Exception as e:
                    logger.error(f"Error getting user info for {username}: {str(e)}")
                    continue
                
                # Get recent posts
                posts = await self._get_user_posts(username, max_results=10)
                
                if posts:
                    total_score = sum(post['score'] for post in posts)
                    total_comments = sum(post['num_comments'] for post in posts)
                    
                    creators.append({
                        **user_info,
                        'total_posts': len(posts),
                        'total_score': total_score,
                        'total_comments': total_comments,
                        'content_count': len(posts),
                        'recent_posts': posts[:5],  # Keep only 5 most recent posts
                        'timestamp': datetime.utcnow().isoformat()
                    })
                
                await asyncio.sleep(self.timeout_between_requests)
            
            return creators
            
        except Exception as e:
            if "RATELIMIT" in str(e):
                retry_count = 0
                while retry_count < self.max_retries:
                    await self._handle_rate_limit(retry_count)
                    retry_count += 1
                    try:
                        return await self.analyze_topic(topic, max_results)
                    except Exception as retry_error:
                        if "RATELIMIT" not in str(retry_error):
                            raise retry_error
            
            logger.error(f"Error analyzing topic {topic}: {str(e)}")
            return [] 