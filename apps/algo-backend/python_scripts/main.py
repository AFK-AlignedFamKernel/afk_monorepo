from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from database import engine
import models
from routers import google_trends, youtube
from utils.scheduler import run_scheduler

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Trend Analysis API")

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
    asyncio.create_task(run_scheduler())

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)