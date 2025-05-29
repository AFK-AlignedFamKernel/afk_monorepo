import tweepy
from typing import List, Dict
import asyncio
import logging
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class TwitterAnalyzer:
    def __init__(self):
        self.api_key = os.getenv('TWITTER_API_KEY')
        self.api_secret = os.getenv('TWITTER_API_SECRET')
        self.access_token = os.getenv('TWITTER_ACCESS_TOKEN')
        self.access_token_secret = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
        
        if not all([self.api_key, self.api_secret, self.access_token, self.access_token_secret]):
            raise ValueError("Twitter API credentials not found in environment variables")
        
        auth = tweepy.OAuthHandler(self.api_key, self.api_secret)
        auth.set_access_token(self.access_token, self.access_token_secret)
        self.api = tweepy.API(auth, wait_on_rate_limit=True)
        
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

    async def _get_user_tweets(self, user_id: str, max_results: int = 50) -> List[Dict]:
        """Get recent tweets from a user."""
        try:
            tweets = []
            for tweet in tweepy.Cursor(
                self.api.user_timeline,
                user_id=user_id,
                tweet_mode='extended',
                count=200
            ).items(max_results):
                tweets.append({
                    'tweet_id': tweet.id_str,
                    'text': tweet.full_text,
                    'created_at': tweet.created_at.isoformat(),
                    'retweet_count': tweet.retweet_count,
                    'favorite_count': tweet.favorite_count,
                    'reply_count': tweet.reply_count if hasattr(tweet, 'reply_count') else 0,
                    'quote_count': tweet.quote_count if hasattr(tweet, 'quote_count') else 0
                })
            
            return tweets
            
        except Exception as e:
            logger.error(f"Error getting tweets for user {user_id}: {str(e)}")
            return []

    async def analyze_topic(self, topic: str, max_results: int = 50) -> List[Dict]:
        """Analyze a topic and return top creators."""
        try:
            # Search for users
            users = []
            for user in tweepy.Cursor(
                self.api.search_users,
                q=topic,
                count=100
            ).items(max_results):
                users.append({
                    'id': user.id_str,
                    'username': user.screen_name,
                    'name': user.name,
                    'description': user.description,
                    'followers_count': user.followers_count,
                    'friends_count': user.friends_count,
                    'statuses_count': user.statuses_count,
                    'verified': user.verified
                })
            
            creators = []
            for user in users:
                # Get recent tweets
                tweets = await self._get_user_tweets(user['id'], max_results=10)
                
                if tweets:
                    total_retweets = sum(tweet['retweet_count'] for tweet in tweets)
                    total_likes = sum(tweet['favorite_count'] for tweet in tweets)
                    total_replies = sum(tweet['reply_count'] for tweet in tweets)
                    total_quotes = sum(tweet['quote_count'] for tweet in tweets)
                    
                    creators.append({
                        'id': user['id'],
                        'username': user['username'],
                        'name': user['name'],
                        'description': user['description'],
                        'followers_count': user['followers_count'],
                        'total_tweets': user['statuses_count'],
                        'total_retweets': total_retweets,
                        'total_likes': total_likes,
                        'total_replies': total_replies,
                        'total_quotes': total_quotes,
                        'content_count': len(tweets),
                        'recent_tweets': tweets[:5],  # Keep only 5 most recent tweets
                        'verified': user['verified'],
                        'timestamp': datetime.utcnow().isoformat()
                    })
                
                await asyncio.sleep(self.timeout_between_requests)
            
            return creators
            
        except Exception as e:
            if "Rate limit" in str(e):
                retry_count = 0
                while retry_count < self.max_retries:
                    await self._handle_rate_limit(retry_count)
                    retry_count += 1
                    try:
                        return await self.analyze_topic(topic, max_results)
                    except Exception as retry_error:
                        if "Rate limit" not in str(retry_error):
                            raise retry_error
            
            logger.error(f"Error analyzing topic {topic}: {str(e)}")
            return [] 