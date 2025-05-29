from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from database import engine, Base
from routers import google_trends, youtube, niche_analytics
from utils.scheduler import run_scheduler
from category_scraper import CategoryScraper
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AFK Analytics API",
    description="API for analyzing trends and content across multiple platforms",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(google_trends.router)
app.include_router(youtube.router)
app.include_router(niche_analytics.router)

@app.get("/")
async def root():
    """Root endpoint that returns API information"""
    return {
        "name": "AFK API",
        "version": "1.0.0",
        "description": "API for AFK: fetching and analyzing Trends data",
        "endpoints": {
            "/google/trends/trending": "Get trending searches",
            "/google/trends/": "List or create trend queries",
            "/google/trends/{query_id}": "Get specific trend query details"
        }
    }

@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup"""
    # Start the scheduler
    # asyncio.create_task(run_scheduler())
    
    # Start the category scraper
    scraper = CategoryScraper()
    # asyncio.create_task(scraper.run_scraper())
    asyncio.create_task(scraper.run_scraper_process())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
    # uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)