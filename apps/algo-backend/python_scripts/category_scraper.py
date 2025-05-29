import asyncio
import logging
from datetime import datetime, timedelta
import time
from typing import Dict, List, Optional
import random
from pytrends.request import TrendReq
import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal
from models import TrendData, Category, CategoryTrendData, ContentCreator, CreatorContent, KeywordTrend, Leaderboard, PlatformStats
import requests
from requests.exceptions import HTTPError
from utils.google_trends import GoogleTrendsAnalyzer
from utils.youtube_analyzer import YouTubeAnalyzer
from utils.twitter_analyzer import TwitterAnalyzer
from utils.reddit_analyzer import RedditAnalyzer
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define major categories and their keywords
CATEGORIES: Dict[str, List[str]] = {
    "Technology": [
        "artificial intelligence", "blockchain", "cloud computing", "cybersecurity",
        "data science", "machine learning", "quantum computing", "virtual reality",
        "augmented reality", "internet of things", "5G technology", "robotics"
    ],
    "Finance": [
    #     "cryptocurrency", "stock market", "investing", "bitcoin", "ethereum",
    #     "trading", "defi", "nft", "web3", "digital banking", "fintech",
    #     "crypto trading", "blockchain finance", "interest rates", "stock market trends",
    #     "investment strategies", "financial markets", "economic indicators",
    #     "financial news", "economic analysis", "geopolitical events", "economic forecasts",
    ],
    "Economics": [
        "interest rates", "geopolitics", "politics",
    ],
    "Entertainment": [
    #     "gaming", "streaming", "movies", "music", "esports", "anime",
    #     "virtual concerts", "metaverse", "video games", "streaming platforms",
    #     "digital entertainment", "online gaming"
    ],
    "Art": [
    #     "digital art", "nft art", "ai art", "generative art", "digital artists",
    #     "art market", "art galleries", "art exhibitions", "digital creativity",
    #     "contemporary art", "digital design"
    ],
    "Science": [
    #     "space exploration", "climate change", "renewable energy", "biotechnology",
    #     "genetics", "quantum physics", "astronomy", "scientific research",
    #     "environmental science", "medical research"
    ],
    "Health": [
    #     "mental health", "fitness", "nutrition", "wellness", "meditation",
    #     "yoga", "healthcare technology", "digital health", "telemedicine",
    #     "health monitoring"
    ],
    "Education": [
        # "online learning", "edtech", "coding", "programming", "data science courses",
        # "digital skills", "remote education", "e-learning", "educational technology",
        # "online courses"
    ],
    "Business": [
        "startups", "entrepreneurship", "remote work", "digital marketing",
        "ecommerce", "business technology", "innovation", "digital transformation",
        "business analytics", "digital strategy"
    ],
    "Social Media": [
        # "social networks", "content creation", "influencers", "digital marketing",
        # "social media trends", "platform updates", "social media marketing",
        # "content strategy", "digital presence"
    ],
    "Sports": [
        # "esports", "sports technology", "fantasy sports", "sports analytics",
        # "sports betting", "sports streaming", "digital sports", "sports gaming",
        # "sports technology"
    ],
    "Fashion": [
        "digital clothing", "fashion tech",
        "wearable technology"
    ],
    "Food": [
        "food technology", "sustainable food", "food delivery", "food innovation",
        "digital food", "food tech", "smart kitchen", "food trends"
    ],
    "Travel": [
        "digital travel", "travel technology", "virtual tourism", "travel tech",
        "smart travel", "digital nomad", "travel innovation", "travel trends"
    ],
    "Real Estate": [
        "proptech", "digital real estate", "virtual property", "real estate tech",
        "smart homes", "real estate innovation", "property technology"
    ],
    "Automotive": [
        "electric vehicles", "autonomous cars", "automotive technology",
        "smart cars", "car tech", "automotive innovation", "future mobility"
    ]
}

class CategoryScraper:
    def __init__(self):
        self.pytrends = TrendReq(hl='en-US', tz=360, timeout=(30, 60))  # Increased timeout
        self.db = SessionLocal()
        self.timeout_between_requests = 120  # 2 minutes between requests
        self.timeout_between_categories = 600  # 10 minutes between categories
        self.max_retries = 5
        self.base_retry_delay = 300  # 5 minutes base delay
        self.max_retry_delay = 3600  # Maximum 1 hour delay
        self.google_trends = GoogleTrendsAnalyzer()
        self.youtube_analyzer = YouTubeAnalyzer()
        self.twitter_analyzer = TwitterAnalyzer()
        self.reddit_analyzer = RedditAnalyzer()
        self._initialize_categories()

    def _initialize_categories(self):
        """Initialize categories in the database if they don't exist."""
        for category_name, keywords in CATEGORIES.items():
            existing_category = self.db.query(Category).filter(Category.name == category_name).first()
            if not existing_category:
                category = Category(
                    name=category_name,
                    description=f"Category for {category_name} related trends",
                    keywords=keywords,
                    is_active=True
                )
                self.db.add(category)
        self.db.commit()

    async def _handle_429_error(self, retry_count: int) -> None:
        """Handle 429 error with exponential backoff and jitter."""
        # Calculate delay with exponential backoff
        delay = min(self.base_retry_delay * (2 ** retry_count), self.max_retry_delay)
        
        # Add jitter (random variation) to prevent thundering herd
        jitter = random.uniform(0, 0.2 * delay)  # 20% jitter
        total_delay = delay + jitter
        
        logger.warning(
            f"Rate limit hit (429). Retry {retry_count + 1}/{self.max_retries}. "
            f"Waiting for {total_delay/60:.1f} minutes before retry. "
            f"(Base delay: {delay/60:.1f} min, Jitter: {jitter/60:.1f} min)"
        )
        
        # Log the total wait time
        wait_until = datetime.utcnow() + timedelta(seconds=total_delay)
        logger.info(f"Will retry at: {wait_until.isoformat()}")
        
        await asyncio.sleep(total_delay)

    async def _make_trend_request(self, keyword: str, retry_count: int = 0) -> Optional[Dict]:
        """Make a request to Google Trends with retry logic and get all related data."""
        try:
            # Add timeout between requests
            if retry_count > 0:
                await asyncio.sleep(self.timeout_between_requests)
            
            self.pytrends.build_payload(
                kw_list=[keyword],
                cat=0,
                timeframe='today 12-m',
                geo='US'
            )
            
            # Get all available data with individual timeouts
            interest_over_time = self.pytrends.interest_over_time()
            await asyncio.sleep(30)  # Wait between requests
            
            related_topics = self.pytrends.related_topics()
            await asyncio.sleep(30)  # Wait between requests
            
            related_queries = self.pytrends.related_queries()
            
            return {
                'interest_over_time': interest_over_time,
                'related_topics': related_topics,
                'related_queries': related_queries
            }
        except HTTPError as e:
            if e.response.status_code == 429:
                if retry_count < self.max_retries:
                    await self._handle_429_error(retry_count)
                    return await self._make_trend_request(keyword, retry_count + 1)
                else:
                    logger.error(f"Max retries ({self.max_retries}) exceeded for keyword {keyword}")
                    return None
            else:
                logger.error(f"HTTP Error for keyword {keyword}: {str(e)}")
                return None
        except Exception as e:
            logger.error(f"Error making request for keyword {keyword}: {str(e)}")
            return None

    async def scrape_keyword(self, keyword: str, category: str) -> None:
        """Scrape data for a single keyword with timeout."""
        try:
            logger.info(f"Scraping data for keyword: {keyword} in category: {category}")
            
            # Get all trend data with retry mechanism
            trend_data = await self._make_trend_request(keyword)
            if trend_data is None:
                logger.warning(f"No data found for keyword: {keyword}")
                # Wait longer on failure
                await asyncio.sleep(random.uniform(180, 300))
                return

            # Get category from database
            db_category = self.db.query(Category).filter(Category.name == category).first()
            if not db_category:
                logger.error(f"Category {category} not found in database")
                return

            # Prepare interest over time data
            interest_over_time = trend_data['interest_over_time']
            if interest_over_time.empty:
                logger.warning(f"No interest over time data for keyword: {keyword}")
                return

            # Prepare related topics data
            related_topics = trend_data['related_topics'].get(keyword, {})
            top_topics = related_topics.get('top', pd.DataFrame())
            rising_topics = related_topics.get('rising', pd.DataFrame())

            # Prepare related queries data
            related_queries = trend_data['related_queries'].get(keyword, {})
            top_queries = related_queries.get('top', pd.DataFrame())
            rising_queries = related_queries.get('rising', pd.DataFrame())

            # Create category trend data entry
            category_trend_data = CategoryTrendData(
                category_id=db_category.id,
                keyword=keyword,
                timeframe='today 12-m',
                geo='US',
                interest_over_time={
                    'dates': interest_over_time.index.strftime('%Y-%m-%d').tolist(),
                    'values': interest_over_time[keyword].tolist(),
                    'is_partial': [False] * len(interest_over_time)
                },
                related_topics={
                    'top': top_topics.to_dict('records') if not top_topics.empty else [],
                    'rising': rising_topics.to_dict('records') if not rising_topics.empty else []
                },
                related_queries={
                    'top': top_queries.to_dict('records') if not top_queries.empty else [],
                    'rising': rising_queries.to_dict('records') if not rising_queries.empty else []
                },
                timestamp=datetime.utcnow(),
                data_metadata={
                    'category_name': category,
                    'scraped_at': datetime.utcnow().isoformat()
                }
            )

            # Save to database
            self.db.add(category_trend_data)
            self.db.commit()
            logger.info(f"Successfully saved all data for keyword: {keyword} in category: {category}")

            # Random timeout between requests (90-120 seconds)
            await asyncio.sleep(random.uniform(90, 120))

        except Exception as e:
            logger.error(f"Error scraping keyword {keyword}: {str(e)}")
            self.db.rollback()
            # Longer timeout on error (5-7 minutes)
            await asyncio.sleep(random.uniform(300, 420))

    async def scrape_category(self, category: str, keywords: List[str]) -> None:
        """Scrape all keywords in a category with timeouts."""
        logger.info(f"Starting to scrape category: {category}")
        
        # TODO
        await self.scrape_keyword(category, category)
        # for keyword in keywords:
            # await self.scrape_keyword(keyword, category)
        # for keyword in keywords:
        #     await self.scrape_keyword(keyword, category)
        
        logger.info(f"Finished scraping category: {category}")
        # Timeout between categories (8-10 minutes)
        await asyncio.sleep(random.uniform(480, 600))

    async def process_category(self, category: Category):
        """Process a category and save all related data."""
        try:
            # Process each keyword in the category
            for keyword in category.keywords:
                # Get trend data
                trend_data = await self.google_trends.get_trend_data(keyword)
                if trend_data:
                    await self._save_trend({
                        'keyword': keyword,
                        'timeframe': 'today 12-m',
                        'geo': 'US',
                        'interest_over_time': trend_data.get('interest_over_time'),
                        'related_topics': trend_data.get('related_topics'),
                        'related_queries': trend_data.get('related_queries'),
                        'trend_metadata': trend_data
                    }, category.id)
                
                # Get YouTube creators
                youtube_creators = await self.youtube_analyzer.analyze_topic(keyword)
                for creator in youtube_creators:
                    saved_creator = await self._save_creator({
                        'platform': 'youtube',
                        'platform_id': creator['channel_id'],
                        'name': creator['title'],
                        'description': creator['description'],
                        'followers_count': creator['subscriber_count'],
                        'content_count': creator['content_count'],
                        'total_views': creator['total_views'],
                        'total_likes': creator['total_likes'],
                        'total_comments': creator['total_comments'],
                        'is_verified': False,
                        'creator_metadata': creator
                    }, 'youtube')
                    
                    if saved_creator:
                        for video in creator['recent_videos']:
                            await self._save_content({
                                'platform': 'youtube',
                                'platform_content_id': video['video_id'],
                                'title': video['title'],
                                'views': video['view_count'],
                                'likes': video['like_count'],
                                'comments': video['comment_count'],
                                'published_at': datetime.fromisoformat(video['published_at']),
                                'content_metadata': video
                            }, saved_creator.id)
                
                # Get Twitter creators
                twitter_creators = await self.twitter_analyzer.analyze_topic(keyword)
                for creator in twitter_creators:
                    saved_creator = await self._save_creator({
                        'platform': 'twitter',
                        'platform_id': creator['id'],
                        'name': creator['name'],
                        'description': creator['description'],
                        'followers_count': creator['followers_count'],
                        'content_count': creator['content_count'],
                        'total_likes': creator['total_likes'],
                        'total_comments': creator['total_replies'],
                        'total_shares': creator['total_retweets'],
                        'is_verified': creator['verified'],
                        'creator_metadata': creator
                    }, 'twitter')
                    
                    if saved_creator:
                        for tweet in creator['recent_tweets']:
                            await self._save_content({
                                'platform': 'twitter',
                                'platform_content_id': tweet['tweet_id'],
                                'content': tweet['text'],
                                'likes': tweet['favorite_count'],
                                'comments': tweet['reply_count'],
                                'shares': tweet['retweet_count'],
                                'published_at': datetime.fromisoformat(tweet['created_at']),
                                'content_metadata': tweet
                            }, saved_creator.id)
                
                # Get Reddit creators
                reddit_creators = await self.reddit_analyzer.analyze_topic(keyword)
                for creator in reddit_creators:
                    saved_creator = await self._save_creator({
                        'platform': 'reddit',
                        'platform_id': creator['username'],
                        'name': creator['username'],
                        'description': '',
                        'followers_count': 0,
                        'content_count': creator['content_count'],
                        'total_likes': creator['total_score'],
                        'total_comments': creator['total_comments'],
                        'is_verified': creator['is_verified'],
                        'creator_metadata': creator
                    }, 'reddit')
                    
                    if saved_creator:
                        for post in creator['recent_posts']:
                            await self._save_content({
                                'platform': 'reddit',
                                'platform_content_id': post['post_id'],
                                'title': post['title'],
                                'content': post['text'],
                                'likes': post['score'],
                                'comments': post['num_comments'],
                                'published_at': datetime.fromisoformat(post['created_at']),
                                'content_metadata': post
                            }, saved_creator.id)
                
                # Calculate and save platform stats
                for platform in ['youtube', 'twitter', 'reddit']:
                    creators = self.db.query(ContentCreator).filter_by(
                        platform=platform
                    ).all()
                    
                    for creator in creators:
                        await self._save_platform_stats({
                            'platform': platform,
                            'creator_id': creator.id,
                            'category_id': category.id,
                            'timeframe': 'daily',
                            'start_date': datetime.utcnow().date(),
                            'end_date': datetime.utcnow().date(),
                            'views': creator.total_views,
                            'likes': creator.total_likes,
                            'comments': creator.total_comments,
                            'shares': creator.total_shares,
                            'engagement_rate': creator.engagement_rate,
                            'mindshare_score': creator.mindshare_score,
                            'stats_metadata': {}
                        })
                
                # Create leaderboards
                for platform in ['youtube', 'twitter', 'reddit']:
                    creators = self.db.query(ContentCreator).filter_by(
                        platform=platform
                    ).order_by(ContentCreator.mindshare_score.desc()).limit(100).all()
                    
                    rankings = [{
                        'rank': i + 1,
                        'creator_id': creator.id,
                        'name': creator.name,
                        'mindshare_score': creator.mindshare_score,
                        'engagement_rate': creator.engagement_rate
                    } for i, creator in enumerate(creators)]
                    
                    await self._save_leaderboard({
                        'category_id': category.id,
                        'platform': platform,
                        'timeframe': 'daily',
                        'start_date': datetime.utcnow().date(),
                        'end_date': datetime.utcnow().date(),
                        'rankings': rankings,
                        'leaderboard_metadata': {}
                    })
                
        except Exception as e:
            logger.error(f"Error processing category {category.name}: {str(e)}")

    async def run_scraper(self) -> None:
        """Main scraper function that runs every 4 hours."""
        while True:
            try:
                for category, keywords in CATEGORIES.items():
                    await self.scrape_category(category, keywords)
                
                # Wait 4 hours before next run
                logger.info("Completed full scraping cycle. Waiting 4 hours before next run.")
                await asyncio.sleep(14400)  # 4 hours
                
            except Exception as e:
                logger.error(f"Error in scraper main loop: {str(e)}")
                # Wait 30 minutes on error before retrying
                await asyncio.sleep(1800)

    async def _save_creator(self, creator_data: dict, platform: str) -> ContentCreator:
        """Save or update a content creator."""
        try:
            # Check if creator exists
            creator = self.db.query(ContentCreator).filter_by(
                platform=platform,
                platform_id=creator_data['platform_id']
            ).first()
            
            if creator:
                # Update existing creator
                for key, value in creator_data.items():
                    if hasattr(creator, key):
                        setattr(creator, key, value)
            else:
                # Create new creator
                creator = ContentCreator(**creator_data)
                self.db.add(creator)
            
            self.db.commit()
            return creator
            
        except Exception as e:
            logger.error(f"Error saving creator: {str(e)}")
            self.db.rollback()
            return None

    async def _save_content(self, content_data: dict, creator_id: int) -> CreatorContent:
        """Save or update creator content."""
        try:
            # Check if content exists
            content = self.db.query(CreatorContent).filter_by(
                platform_content_id=content_data['platform_content_id']
            ).first()
            
            if content:
                # Update existing content
                for key, value in content_data.items():
                    if hasattr(content, key):
                        setattr(content, key, value)
            else:
                # Create new content
                content_data['creator_id'] = creator_id
                content = CreatorContent(**content_data)
                self.db.add(content)
            
            self.db.commit()
            return content
            
        except Exception as e:
            logger.error(f"Error saving content: {str(e)}")
            self.db.rollback()
            return None

    async def _save_trend(self, trend_data: dict, category_id: int) -> KeywordTrend:
        """Save or update keyword trend."""
        try:
            # Check if trend exists
            trend = self.db.query(KeywordTrend).filter_by(
                keyword=trend_data['keyword'],
                category_id=category_id
            ).first()
            
            if trend:
                # Update existing trend
                for key, value in trend_data.items():
                    if hasattr(trend, key):
                        setattr(trend, key, value)
            else:
                # Create new trend
                trend_data['category_id'] = category_id
                trend = KeywordTrend(**trend_data)
                self.db.add(trend)
            
            self.db.commit()
            return trend
            
        except Exception as e:
            logger.error(f"Error saving trend: {str(e)}")
            self.db.rollback()
            return None

    async def _save_leaderboard(self, leaderboard_data: dict) -> Leaderboard:
        """Save or update leaderboard."""
        try:
            # Check if leaderboard exists
            leaderboard = self.db.query(Leaderboard).filter_by(
                category_id=leaderboard_data['category_id'],
                platform=leaderboard_data['platform'],
                timeframe=leaderboard_data['timeframe'],
                start_date=leaderboard_data['start_date']
            ).first()
            
            if leaderboard:
                # Update existing leaderboard
                for key, value in leaderboard_data.items():
                    if hasattr(leaderboard, key):
                        setattr(leaderboard, key, value)
            else:
                # Create new leaderboard
                leaderboard = Leaderboard(**leaderboard_data)
                self.db.add(leaderboard)
            
            self.db.commit()
            return leaderboard
            
        except Exception as e:
            logger.error(f"Error saving leaderboard: {str(e)}")
            self.db.rollback()
            return None

    async def _save_platform_stats(self, stats_data: dict) -> PlatformStats:
        """Save or update platform stats."""
        try:
            # Check if stats exist
            stats = self.db.query(PlatformStats).filter_by(
                platform=stats_data['platform'],
                creator_id=stats_data['creator_id'],
                category_id=stats_data['category_id'],
                timeframe=stats_data['timeframe'],
                start_date=stats_data['start_date']
            ).first()
            
            if stats:
                # Update existing stats
                for key, value in stats_data.items():
                    if hasattr(stats, key):
                        setattr(stats, key, value)
            else:
                # Create new stats
                stats = PlatformStats(**stats_data)
                self.db.add(stats)
            
            self.db.commit()
            return stats
            
        except Exception as e:
            logger.error(f"Error saving platform stats: {str(e)}")
            self.db.rollback()
            return None

    def __del__(self):
        """Cleanup database connection."""
        self.db.close()

async def main():
    scraper = CategoryScraper()
    await scraper.run_scraper()

if __name__ == "__main__":
    asyncio.run(main()) 