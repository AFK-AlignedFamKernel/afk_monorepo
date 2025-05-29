import asyncio
from datetime import datetime
import os
from dotenv import load_dotenv
import pandas as pd

from database import SessionLocal
from models import TrendQuery, TrendData
from utils.google_trends import get_google_trends_data

# Load environment variables
load_dotenv()

# Get cron interval from environment variable (default: 1 hour)
CRON_INTERVAL = int(os.getenv('TREND_CHECK_INTERVAL', 3600))  # in seconds

async def check_keywords():
    """Periodically check all active keywords for updates"""
    db = SessionLocal()
    try:
        # Get all active queries
        queries = db.query(TrendQuery).filter(TrendQuery.is_active == True).all()
        
        for query in queries:
            try:
                # Get fresh data
                trends_result = await get_google_trends_data(
                    query.keyword,
                    query.timeframe,
                    query.geo
                )
                
                if trends_result['status'] == 'success':
                    # Update query metadata
                    query.query_metadata.update({
                        'related_queries': trends_result['processed_data'].get('related_queries', {}),
                        'suggestions': trends_result['processed_data'].get('suggestions', []),
                        'last_checked': datetime.utcnow().isoformat()
                    })
                    
                    # Add new data points
                    for data_point in trends_result['processed_data']['data']:
                        date_str = data_point['date']
                        if isinstance(date_str, pd.Timestamp):
                            date = date_str.to_pydatetime()
                        else:
                            date = pd.to_datetime(date_str).to_pydatetime()
                            
                        # Check if data point already exists
                        existing = db.query(TrendData).filter(
                            TrendData.query_id == query.id,
                            TrendData.date == date
                        ).first()
                        
                        if not existing:
                            db_data = TrendData(
                                query_id=query.id,
                                date=date,
                                value=data_point[query.keyword],
                                is_partial=data_point.get('isPartial', 0),
                                data_metadata=data_point
                            )
                            db.add(db_data)
                    
                    db.commit()
                    
            except Exception as e:
                print(f"Error checking keyword {query.keyword}: {str(e)}")
                continue
                
    except Exception as e:
        print(f"Error in check_keywords: {str(e)}")
    finally:
        db.close()

async def run_scheduler():
    """Run the scheduler loop"""
    while True:
        try:
            await check_keywords()
        except Exception as e:
            print(f"Error in scheduler loop: {str(e)}")
        await asyncio.sleep(CRON_INTERVAL)

if __name__ == "__main__":
    asyncio.run(run_scheduler())