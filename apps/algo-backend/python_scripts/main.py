from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from database import engine
import models
from routers.google_trends import router as google_trends_router

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Google Trends API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(google_trends_router)

@app.get("/")
async def root():
    """Root endpoint that returns API information"""
    return {
        "name": "Google Trends API",
        "version": "1.0.0",
        "description": "API for fetching and analyzing Google Trends data",
        "endpoints": {
            "/google/trends/trending": "Get trending searches",
            "/google/trends/": "List or create trend queries",
            "/google/trends/{query_id}": "Get specific trend query details"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 