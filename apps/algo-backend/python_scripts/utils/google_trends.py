from pytrends.request import TrendReq
import pandas as pd
import json
import sys
from datetime import datetime

def get_google_trends_data(keyword, timeframe='today 12-m', geo='US'):
    """
    Fetches Google Trends data for a given keyword.

    Args:
        keyword (str or list): The search term(s) to query.
        timeframe (str): The time range for the data (e.g., 'today 12-m' for past 12 months, '2023-01-01 2023-12-31').
        geo (str): The geographical region (e.g., 'US' for United States, 'FR' for France, '' for worldwide).

    Returns:
        pandas.DataFrame: A DataFrame containing the trends data.
    """
    try:
        pytrends = TrendReq(hl='en-US', tz=360)  # hl: host language, tz: timezone offset

        # Build the payload for the request
        pytrends.build_payload(kw_list=[keyword] if isinstance(keyword, str) else keyword,
                             cat=0,
                             timeframe=timeframe,
                             geo=geo,
                             gprop='')

        # Get interest over time data
        interest_over_time_df = pytrends.interest_over_time()
        

        # Related Queries, returns a dictionary of dataframes
        related_queries_dict = pytrends.related_queries()
        print("related_queries_dict", related_queries_dict)

        if interest_over_time_df.empty:
            return {'status': 'error', 'error': 'No data found for the given parameters'}
            
                    # Get Google Keyword Suggestions
        suggestions_dict = pytrends.suggestions(keyword=keyword)
        print(suggestions_dict)

        # Get Google Realtime Search Trends
        realtime_searches = pytrends.realtime_trending_searches(pn=geo)
        print(realtime_searches.head())
        # Convert DataFrame to dict for JSON serialization
        result = {
            'status': 'success',
            'processed_data': {
                'data': interest_over_time_df.reset_index().to_dict(orient='records'),
                'columns': interest_over_time_df.columns.tolist(),
                'related_queries': related_queries_dict,
                'suggestions': suggestions_dict,
                'realtime_searches': realtime_searches.to_dict(orient='records')
            }
        }
        return result

    except Exception as e:
        return {'status': 'error', 'error': str(e)}

def get_trending_searches(geo='US', category='all'):
    """
    Get trending searches from Google Trends.

    Args:
        geo (str): The geographical region (e.g., 'US', 'FR', 'GB').
        category (str): The category of trending searches ('all', 'news', 'sports', etc.).

    Returns:
        dict: A dictionary containing trending searches data.
    """
    try:
        pytrends = TrendReq(hl='en-US', tz=360)
        
        # Get trending searches
        trending_searches = pytrends.trending_searches(pn=geo)
        
        print("trending_searches", trending_searches)
        
        # Convert trending searches to list format
        if isinstance(trending_searches, pd.DataFrame):
            trending_list = trending_searches.to_dict(orient='records')
        else:
            # If it's a list, convert to list of dicts with rank
            trending_list = [{'rank': i+1, 'term': term} for i, term in enumerate(trending_searches)]
        
        # Initialize result dictionary
        result = {
            'status': 'success',
            'processed_data': {
                'trending_searches': trending_list,
                'realtime_trends': [],
                'top_charts': []
            }
        }
        
        # Try to get real-time trending searches
        try:
            realtime_trends = pytrends.realtime_trending_searches(pn=geo)
            if isinstance(realtime_trends, pd.DataFrame):
                result['processed_data']['realtime_trends'] = realtime_trends.to_dict(orient='records')
        except Exception as e:
            print(f"Warning: Could not fetch real-time trends: {str(e)}")
        
        # Try to get top charts
        try:
            current_date = datetime.now().strftime('%Y%m')
            top_charts = pytrends.top_charts(date=current_date, hl='en-US', tz=300, geo=geo)
            if isinstance(top_charts, pd.DataFrame):
                result['processed_data']['top_charts'] = top_charts.to_dict(orient='records')
        except Exception as e:
            print(f"Warning: Could not fetch top charts: {str(e)}")
        
        # If we have no data at all, return an error
        if not any(result['processed_data'].values()):
            return {
                'status': 'error',
                'error': 'No trending data available for the specified region'
            }
        
        return result

    except Exception as e:
        print(f"Error in get_trending_searches: {str(e)}")
        return {'status': 'error', 'error': str(e)}

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