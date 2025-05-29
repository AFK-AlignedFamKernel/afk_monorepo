from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Dict, Any, List

Base = declarative_base()

class TrendQuery(Base):
    __tablename__ = "trend_queries"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, index=True)
    timeframe = Column(String)
    geo = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    query_metadata = Column(JSON)
    
    # Relationships
    trend_data = relationship("TrendData", back_populates="query", cascade="all, delete-orphan")
    trend_plots = relationship("TrendPlot", back_populates="query", cascade="all, delete-orphan")
    youtube_data = relationship("YouTubeData", back_populates="query", cascade="all, delete-orphan")
    
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