from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Dict, Any, List

Base = declarative_base()

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    keywords = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    category_metadata = Column(JSON, default={})

    # Relationships
    trends = relationship("KeywordTrend", back_populates="category")
    leaderboards = relationship("Leaderboard", back_populates="category")
    platform_stats = relationship("PlatformStats", back_populates="category")

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "keywords": self.keywords,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_active": self.is_active,
            "metadata": self.category_metadata
        }

class ContentCreator(Base):
    __tablename__ = "content_creators"
    
    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, index=True)  # youtube, twitter, reddit
    platform_id = Column(String, index=True)  # channel_id, user_id, username
    name = Column(String)
    description = Column(Text)
    followers_count = Column(Integer, default=0)
    content_count = Column(Integer, default=0)
    total_views = Column(Integer, default=0)
    total_likes = Column(Integer, default=0)
    total_comments = Column(Integer, default=0)
    total_shares = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    mindshare_score = Column(Float, default=0.0)
    is_verified = Column(Boolean, default=False)
    creator_metadata = Column(JSON)  # Platform-specific metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    content = relationship("CreatorContent", back_populates="creator")
    platform_stats = relationship("PlatformStats", back_populates="creator")

class CreatorContent(Base):
    __tablename__ = "creator_content"
    
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("content_creators.id"))
    platform = Column(String, index=True)
    platform_content_id = Column(String, index=True)  # video_id, tweet_id, post_id
    title = Column(String)
    content = Column(Text)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    published_at = Column(DateTime)
    content_metadata = Column(JSON)  # Platform-specific metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("ContentCreator", back_populates="content")

class KeywordTrend(Base):
    __tablename__ = "keyword_trends"
    
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    timeframe = Column(String)
    geo = Column(String)
    interest_over_time = Column(JSON)
    related_topics = Column(JSON)
    related_queries = Column(JSON)
    trend_metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="trends")

class Leaderboard(Base):
    __tablename__ = "leaderboards"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    platform = Column(String, index=True)
    timeframe = Column(String)  # daily, weekly, monthly
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    rankings = Column(JSON)  # List of creator rankings with scores
    leaderboard_metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="leaderboards")

class PlatformStats(Base):
    __tablename__ = "platform_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, index=True)
    creator_id = Column(Integer, ForeignKey("content_creators.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    timeframe = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    mindshare_score = Column(Float, default=0.0)
    stats_metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="platform_stats")
    creator = relationship("ContentCreator", back_populates="platform_stats")

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "keyword": self.keyword,
            "timeframe": self.timeframe,
            "geo": self.geo,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_active": self.is_active,
            "metadata": self.stats_metadata
        }
    
    def get_latest_data(self) -> Dict[str, Any]:
        """Get the latest trend data point"""
        if not self.trend_data:
            return {}
        latest = max(self.trend_data, key=lambda x: x.date)
        return {
            "date": latest.date.isoformat(),
            "value": latest.value,
            "is_partial": latest.is_partial
        }

class TrendData(Base):
    __tablename__ = "trend_data"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("trend_queries.id"))
    date = Column(DateTime, index=True)
    value = Column(Float)
    is_partial = Column(Boolean, default=False)
    data_metadata = Column(JSON, default={})
    
    # Relationship
    query = relationship("TrendQuery", back_populates="trend_data")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "query_id": self.query_id,
            "date": self.date.isoformat(),
            "value": self.value,
            "is_partial": self.is_partial,
            "metadata": self.data_metadata
        }

class TrendPlot(Base):
    __tablename__ = "trend_plots"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("trend_queries.id"))
    plot_path = Column(String)
    plot_metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    query = relationship("TrendQuery", back_populates="trend_plots")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "query_id": self.query_id,
            "plot_path": self.plot_path,
            "plot_metadata": self.plot_metadata,
            "created_at": self.created_at.isoformat()
        }

class YouTubeData(Base):
    __tablename__ = "youtube_data"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("trend_queries.id"))
    video_id = Column(String, index=True)
    title = Column(String)
    channel_name = Column(String)
    views = Column(String)
    duration = Column(String)
    published_at = Column(DateTime)
    thumbnail_url = Column(String)
    video_url = Column(String)
    description = Column(String)
    video_metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    query = relationship("TrendQuery", back_populates="youtube_data")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "query_id": self.query_id,
            "video_id": self.video_id,
            "title": self.title,
            "channel_name": self.channel_name,
            "views": self.views,
            "duration": self.duration,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "thumbnail_url": self.thumbnail_url,
            "video_url": self.video_url,
            "description": self.description,
            "metadata": self.video_metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class CategoryTrendData(Base):
    __tablename__ = "category_trend_data"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    keyword = Column(String, index=True)
    timeframe = Column(String)
    geo = Column(String)
    interest_over_time = Column(JSON)  # Store the time series data
    related_topics = Column(JSON)  # Store related topics data
    related_queries = Column(JSON)  # Store related queries data
    timestamp = Column(DateTime, default=datetime.utcnow)
    data_metadata = Column(JSON, default={})
    
    # Relationship
    category = relationship("Category", backref="trend_data")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "category_id": self.category_id,
            "keyword": self.keyword,
            "timeframe": self.timeframe,
            "geo": self.geo,
            "interest_over_time": self.interest_over_time,
            "related_topics": self.related_topics,
            "related_queries": self.related_queries,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.data_metadata
        }

class TrendQuery(Base):
    __tablename__ = "trend_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, index=True)
    timeframe = Column(String)
    geo = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    query_metadata = Column(JSON, default={})
    
    # Relationships
    trend_data = relationship("TrendData", back_populates="query")
    trend_plots = relationship("TrendPlot", back_populates="query")
    youtube_data = relationship("YouTubeData", back_populates="query")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for API response"""
        return {
            "id": self.id,
            "keyword": self.keyword,
            "timeframe": self.timeframe,
            "geo": self.geo,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_active": self.is_active,
            "metadata": self.query_metadata
        } 