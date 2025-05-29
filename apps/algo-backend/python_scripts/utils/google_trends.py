from pytrends.request import TrendReq
import pandas as pd
import json
import sys
from typing import Dict, Any, List

def get_google_trends_data(keyword: str, timeframe: str = "today 12-m", geo: str = "US") -> Dict[str, Any]:
    """
    Get Google Trends data for a specific keyword.
    
    Parameters:
    - keyword: The search term to analyze
    - timeframe: Time range for the data (e.g., 'today 12-m', '2023-01-01 2023-12-31')
    - geo: Geographical region (e.g., 'US', 'FR', 'GB')
    """
    try:
        # Initialize pytrends
        pytrends = TrendReq(hl='en-US', tz=360)
        
        # Build payload
        pytrends.build_payload([keyword], timeframe=timeframe, geo=geo)
        
        # Get interest over time
        interest_over_time_df = pytrends.interest_over_time()
        
        if interest_over_time_df.empty:
            return {
                'status': 'error',
                'error': 'No data available for the specified parameters'
            }
        
        # Get related queries
        related_queries = pytrends.related_queries()
        
        # Get suggestions
        suggestions = pytrends.suggestions(keyword)
        
        # Process the data
        data = []
        for index, row in interest_over_time_df.iterrows():
            data_point = {
                'date': index,
                keyword: row[keyword],
                'isPartial': row.get('isPartial', 0)
            }
            data.append(data_point)
        
        return {
            'status': 'success',
            'processed_data': {
                'data': data,
                'related_queries': related_queries.get(keyword, {}),
                'suggestions': suggestions
            }
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def get_trending_searches(geo: str = "US", category: str = "all") -> Dict[str, Any]:
    """
    Get trending searches from Google Trends.
    
    Parameters:
    - geo: Geographical region (e.g., 'US', 'FR', 'GB')
    - category: Category of trending searches ('all', 'news', 'sports', etc.)
    """
    try:
        # Initialize pytrends
        pytrends = TrendReq(hl='en-US', tz=360)
        
        # Get trending searches
        trending_searches = pytrends.trending_searches(pn=geo)
        
        # Get real-time trending searches
        realtime_trending = pytrends.realtime_trending_searches(pn=geo)
        
        # Get top charts
        top_charts = pytrends.top_charts(date='now', hl='en-US', tz=360, geo=geo)
        
        return {
            'status': 'success',
            'processed_data': {
                'trending_searches': trending_searches.tolist(),
                'realtime_trending': realtime_trending.to_dict('records'),
                'top_charts': top_charts.to_dict('records')
            }
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

if __name__ == "__main__":
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    # Extract parameters from input
    keyword = input_data.get('keyword', '')
    timeframe = input_data.get('timeframe', 'today 12-m')
    geo = input_data.get('geo', 'US')
    
    # Get the data
    result = get_google_trends_data(keyword, timeframe, geo)
    
    # Print the result as JSON
    print(json.dumps(result)) 