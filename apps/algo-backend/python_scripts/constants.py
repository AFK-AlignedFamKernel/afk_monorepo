import asyncio
import logging
from datetime import datetime
import time
from typing import Dict, List, Optional
import random
from pytrends.request import TrendReq
import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal
from models import TrendData, Category
import requests
from requests.exceptions import HTTPError

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
        "cryptocurrency", "stock market", "investing", "bitcoin", "ethereum",
        "trading", "defi", "nft", "web3", "digital banking", "fintech",
        "crypto trading", "blockchain finance"
    ],
    "Entertainment": [
        "gaming", "streaming", "movies", "music", "esports", "anime",
        "virtual concerts", "metaverse", "video games", "streaming platforms",
        "digital entertainment", "online gaming"
    ],
    "Art": [
        "digital art", "nft art", "ai art", "generative art", "digital artists",
        "art market", "art galleries", "art exhibitions", "digital creativity",
        "contemporary art", "digital design"
    ],
    "Science": [
        "space exploration", "climate change", "renewable energy", "biotechnology",
        "genetics", "quantum physics", "astronomy", "scientific research",
        "environmental science", "medical research"
    ],
    "Health": [
        "mental health", "fitness", "nutrition", "wellness", "meditation",
        "yoga", "healthcare technology", "digital health", "telemedicine",
        "health monitoring"
    ],
    "Education": [
        "online learning", "edtech", "coding", "programming", "data science courses",
        "digital skills", "remote education", "e-learning", "educational technology",
        "online courses"
    ],
    "Business": [
        "startups", "entrepreneurship", "remote work", "digital marketing",
        "ecommerce", "business technology", "innovation", "digital transformation",
        "business analytics", "digital strategy"
    ],
    "Social Media": [
        "social networks", "content creation", "influencers", "digital marketing",
        "social media trends", "platform updates", "social media marketing",
        "content strategy", "digital presence"
    ],
    "Sports": [
        "esports", "sports technology", "fantasy sports", "sports analytics",
        "sports betting", "sports streaming", "digital sports", "sports gaming",
        "sports technology"
    ],
    "Fashion": [
        "digital fashion", "sustainable fashion", "fashion technology",
        "virtual fashion", "fashion trends", "digital clothing", "fashion tech",
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
        self.pytrends = TrendReq(hl='en-US', tz=360, timeout=(10, 25))
        self.db = SessionLocal()
        self.timeout_between_requests = 90  # 1.5 minutes between requests
        self.timeout_between_categories = 420  # 7 minutes between categories
        self.max_retries = 5
        self.base_retry_delay = 180  # 3 minutes base delay
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
        """Handle 429 error with exponential backoff."""
        delay = self.base_retry_delay * (2 ** retry_count)  # Exponential backoff
        jitter = random.uniform(0, 0.1 * delay)  # Add 10% jitter
        total_delay = delay + jitter
        
        logger.warning(f"Rate limit hit (429). Retry {retry_count + 1}/{self.max_retries}. "
                      f"Waiting for {total_delay/60:.1f} minutes before retry.")
        await asyncio.sleep(total_delay)

    async def _make_trend_request(self, keyword: str, retry_count: int = 0) -> Optional[pd.DataFrame]:
        """Make a request to Google Trends with retry logic."""
        try:
            self.pytrends.build_payload(
                kw_list=[keyword],
                cat=0,
                timeframe='today 12-m',
                geo='US'
            )
            return self.pytrends.interest_over_time()
        except HTTPError as e:
            if e.response.status_code == 429 and retry_count < self.max_retries:
                await self._handle_429_error(retry_count)
                return await self._make_trend_request(keyword, retry_count + 1)
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
            
            # Get interest over time with retry mechanism
            interest_over_time = await self._make_trend_request(keyword)
            if interest_over_time is None or interest_over_time.empty:
                logger.warning(f"No data found for keyword: {keyword}")
                return

            # Get related queries with retry mechanism
            try:
                related_queries = self.pytrends.related_queries()
                top_queries = related_queries.get(keyword, {}).get('top', pd.DataFrame())
                rising_queries = related_queries.get(keyword, {}).get('rising', pd.DataFrame())
            except HTTPError as e:
                if e.response.status_code == 429:
                    await self._handle_429_error(0)
                    # Retry getting related queries
                    related_queries = self.pytrends.related_queries()
                    top_queries = related_queries.get(keyword, {}).get('top', pd.DataFrame())
                    rising_queries = related_queries.get(keyword, {}).get('rising', pd.DataFrame())
                else:
                    logger.error(f"Error getting related queries for {keyword}: {str(e)}")
                    top_queries = pd.DataFrame()
                    rising_queries = pd.DataFrame()

            # Get category from database
            db_category = self.db.query(Category).filter(Category.name == category).first()
            if not db_category:
                logger.error(f"Category {category} not found in database")
                return

            # Prepare data for database
            trend_data = TrendData(
                keyword=keyword,
                category=category,
                timeframe='today 12-m',
                geo='US',
                time_series={
                    'dates': interest_over_time.index.strftime('%Y-%m-%d').tolist(),
                    'values': interest_over_time[keyword].tolist(),
                    'is_partial': [False] * len(interest_over_time)
                },
                related_queries={
                    'top': top_queries.to_dict('records') if not top_queries.empty else [],
                    'rising': rising_queries.to_dict('records') if not rising_queries.empty else []
                },
                timestamp=datetime.utcnow().isoformat()
            )

            # Save to database
            self.db.add(trend_data)
            self.db.commit()
            logger.info(f"Successfully saved data for keyword: {keyword}")

            # Random timeout between requests (60-90 seconds)
            await asyncio.sleep(random.uniform(60, 90))

        except Exception as e:
            logger.error(f"Error scraping keyword {keyword}: {str(e)}")
            self.db.rollback()
            # Longer timeout on error (3-4 minutes)
            await asyncio.sleep(random.uniform(180, 240))

    async def scrape_category(self, category: str, keywords: List[str]) -> None:
        """Scrape all keywords in a category with timeouts."""
        logger.info(f"Starting to scrape category: {category}")
        
        for keyword in keywords:
            await self.scrape_keyword(keyword, category)
        
        logger.info(f"Finished scraping category: {category}")
        # Timeout between categories (5-7 minutes)
        await asyncio.sleep(random.uniform(300, 420))

    async def run_scraper(self) -> None:
        """Main scraper function that runs every 4 hours."""
        while True:
            try:
                logger.info("Starting new scraping cycle")
                
                for category, keywords in CATEGORIES.items():
                    await self.scrape_category(category, keywords)
                
                logger.info("Completed scraping cycle")
                # Wait 4 hours before next cycle
                await asyncio.sleep(14400)  # 4 hours = 14400 seconds
                
            except Exception as e:
                logger.error(f"Error in scraping cycle: {str(e)}")
                # Wait 30 minutes before retrying on error
                await asyncio.sleep(1800)

    def __del__(self):
        """Cleanup database connection."""
        self.db.close()

async def main():
    scraper = CategoryScraper()
    await scraper.run_scraper()

if __name__ == "__main__":
    asyncio.run(main()) 