from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class TrendQuery(Base):
    __tablename__ = "trend_queries"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, index=True)
    timeframe = Column(String)
    geo = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    trends_data = relationship("TrendData", back_populates="query")

class TrendData(Base):
    __tablename__ = "trends_data"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("trend_queries.id"))
    date = Column(DateTime, index=True)
    value = Column(Float)
    is_partial = Column(Integer, default=0)
    query = relationship("TrendQuery", back_populates="trends_data")

class TrendPlot(Base):
    __tablename__ = "trend_plots"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("trend_queries.id"))
    plot_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    plot_metadata = Column(JSON)  # Store additional plot metadata 