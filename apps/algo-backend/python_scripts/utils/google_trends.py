from pytrends.request import TrendReq
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import pandas as pd
import json
import sys
import logging
from .rate_limiter import with_retry, RateLimiter

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a rate limiter instance for Google Trends
google_trends_limiter = RateLimiter(max_requests=3, time_window=60)  # 3 requests per minute

@with_retry(max_retries=3, rate_limiter=google_trends_limiter)
async def get_google_trends_data(
    keyword: str,
    timeframe: str = "today 12-m",
    geo: str = "US"
) -> Dict[str, Any]:
    """
    Get Google Trends data for a keyword.
    
    Parameters:
    - keyword: The search term to get trends for
    - timeframe: Time period for the trend data (e.g., "today 12-m", "now 1-d")
    - geo: Geographical region (e.g., "US", "FR", "GB")
    """
    try:
        # Initialize pytrends
        pytrends = TrendReq(hl='en-US', tz=360)
        
        # Build payload
        pytrends.build_payload(
            kw_list=[keyword],
            cat=0,
            timeframe=timeframe,
            geo=geo
        )
        
        # Get interest over time
        interest_over_time_df = pytrends.interest_over_time()
        
        if interest_over_time_df.empty:
            return {
                'status': 'error',
                'error': 'No data available for the specified parameters'
            }
        
        # Process the data
        data = []
        for index, row in interest_over_time_df.iterrows():
            data.append({
                'date': index.isoformat(),
                'value': float(row[keyword]),
                'is_partial': row.get('isPartial', False)
            })
        
        # Get related queries
        related_queries = pytrends.related_queries()
        top_queries = related_queries.get(keyword, {}).get('top', pd.DataFrame())
        rising_queries = related_queries.get(keyword, {}).get('rising', pd.DataFrame())
        
        # Process related queries
        processed_queries = {
            'top': [],
            'rising': []
        }
        
        if not top_queries.empty:
            for _, row in top_queries.iterrows():
                processed_queries['top'].append({
                    'query': row['query'],
                    'value': float(row['value'])
                })
        
        if not rising_queries.empty:
            for _, row in rising_queries.iterrows():
                processed_queries['rising'].append({
                    'query': row['query'],
                    'value': float(row['value'])
                })
        
        return {
            'status': 'success',
            'processed_data': {
                'keyword': keyword,
                'timeframe': timeframe,
                'geo': geo,
                'data': data,
                'related_queries': processed_queries,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

@with_retry(max_retries=3, rate_limiter=google_trends_limiter)
async def get_trending_searches(geo: str = "US", category: str = "all") -> Dict[str, Any]:
    """
    Get trending searches from Google Trends.
    
    Parameters:
    - geo: Geographical region (e.g., "US", "FR", "GB")
    - category: Category of trending searches (e.g., "all", "sports", "entertainment")
    """
    try:
        # Initialize pytrends
        pytrends = TrendReq(hl='en-US', tz=360)
        
        # Process the data
        processed_data = {
            'regular_trends': [],
            'realtime_trends': [],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # List of generic terms to get suggestions for
        generic_terms = ["news", "trending", "viral", "popular", "hot", "latest"]
        
        # Get suggestions for each term
        for term in generic_terms:
            try:
                # Get suggestions
                suggestions = pytrends.suggestions(term)
                if suggestions:
                    for suggestion in suggestions:
                        processed_data['regular_trends'].append({
                            'query': suggestion.get('title', ''),
                            'value': 100,  # Default value for suggestions
                            'source': 'suggestions',
                            'type': suggestion.get('type', '')
                        })
            except Exception:
                continue
        
        # If we have no trends yet, try getting related topics
        if not processed_data['regular_trends']:
            # Build payload for multiple terms
            pytrends.build_payload(
                kw_list=generic_terms,
                timeframe="now 1-d",
                geo=geo
            )
            
            # Get related topics
            related_topics = pytrends.related_topics()
            
            # Process related topics for each term
            for term in generic_terms:
                try:
                    top_topics = related_topics.get(term, {}).get("top", pd.DataFrame())
                    if not top_topics.empty:
                        for _, row in top_topics.iterrows():
                            processed_data['regular_trends'].append({
                                'query': row.get('topic_title', ''),
                                'value': float(row.get('value', 0)),
                                'source': 'related_topics',
                                'type': 'topic'
                            })
                except Exception:
                    continue
        
        # If we still have no trends, try getting related queries
        if not processed_data['regular_trends']:
            # Get related queries
            related_queries = pytrends.related_queries()
            
            # Process related queries for each term
            for term in generic_terms:
                try:
                    top_queries = related_queries.get(term, {}).get("top", pd.DataFrame())
                    if not top_queries.empty:
                        for _, row in top_queries.iterrows():
                            processed_data['regular_trends'].append({
                                'query': row['query'],
                                'value': float(row['value']),
                                'source': 'related_queries',
                                'type': 'query'
                            })
                except Exception:
                    continue
        
        # Try to get real-time trends
        try:
            realtime_trends = pytrends.realtime_trending_searches(pn=geo)
            if not realtime_trends.empty:
                for _, row in realtime_trends.iterrows():
                    processed_data['realtime_trends'].append({
                        'title': row.get('title', ''),
                        'traffic': row.get('traffic', ''),
                        'articles': row.get('articles', []),
                        'image': row.get('image', {}).get('newsUrl', '')
                    })
        except Exception:
            # If real-time trends fail, continue with regular trends
            pass
        
        # Remove duplicates while preserving order
        seen = set()
        processed_data['regular_trends'] = [
            x for x in processed_data['regular_trends']
            if not (x['query'] in seen or seen.add(x['query']))
        ]
        
        # Sort by value if available
        processed_data['regular_trends'].sort(key=lambda x: x.get('value', 0), reverse=True)
        
        return {
            'status': 'success',
            'processed_data': processed_data
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': f"Failed to get trending searches: {str(e)}"
        }

@with_retry(max_retries=3, rate_limiter=google_trends_limiter)
async def get_trends_for_keyword(keyword: str, geo: str = "US", timeframe: str = "today 12-m") -> Dict[str, Any]:
    """
    Get trend data for a specific keyword.
    
    Parameters:
    - keyword: The search term to get trends for
    - geo: Geographical region (e.g., "US", "FR", "GB")
    - timeframe: Time period for the trend data (e.g., "today 12-m", "now 1-d")
    """
    try:
        logger.info(f"Getting trend data for keyword: {keyword}, geo: {geo}, timeframe: {timeframe}")
        
        # Initialize pytrends
        logger.debug("Initializing pytrends")
        pytrends = TrendReq(hl='en-US', tz=360)
        
        # Build payload
        logger.debug(f"Building payload for keyword: {keyword}")
        pytrends.build_payload(
            kw_list=[keyword],
            cat=0,
            timeframe=timeframe,
            geo=geo
        )
        
        # Get interest over time
        logger.debug("Fetching interest over time data")
        interest_over_time_df = pytrends.interest_over_time()
        logger.debug(f"Interest over time data shape: {interest_over_time_df.shape}")
        
        if interest_over_time_df.empty:
            logger.warning(f"No interest over time data available for keyword: {keyword}")
            return {
                'status': 'error',
                'error': f'No data available for keyword "{keyword}"'
            }
        
        # Process the data
        logger.debug("Processing interest over time data")
        data = []
        for index, row in interest_over_time_df.iterrows():
            try:
                data.append({
                    'date': index.isoformat(),
                    'value': float(row[keyword]),
                    'is_partial': row.get('isPartial', False)
                })
            except Exception as e:
                logger.error(f"Error processing row: {row}, error: {str(e)}")
                continue
        
        # Initialize empty results
        processed_queries = {
            'top': [],
            'rising': []
        }
        processed_topics = {
            'top': [],
            'rising': []
        }
        
        # Get related queries
        logger.debug("Fetching related queries")
        try:
            related_queries = pytrends.related_queries()
            logger.debug(f"Related queries keys: {list(related_queries.keys())}")
            
            if keyword in related_queries:
                top_queries = related_queries[keyword].get('top', pd.DataFrame())
                rising_queries = related_queries[keyword].get('rising', pd.DataFrame())
                logger.debug(f"Top queries shape: {top_queries.shape}, Rising queries shape: {rising_queries.shape}")
                
                if not top_queries.empty:
                    logger.debug("Processing top queries")
                    for _, row in top_queries.iterrows():
                        try:
                            processed_queries['top'].append({
                                'query': row['query'],
                                'value': float(row['value'])
                            })
                        except Exception as e:
                            logger.error(f"Error processing top query row: {row}, error: {str(e)}")
                            continue
                
                if not rising_queries.empty:
                    logger.debug("Processing rising queries")
                    for _, row in rising_queries.iterrows():
                        try:
                            processed_queries['rising'].append({
                                'query': row['query'],
                                'value': float(row['value'])
                            })
                        except Exception as e:
                            logger.error(f"Error processing rising query row: {row}, error: {str(e)}")
                            continue
        except Exception as e:
            logger.warning(f"Error fetching related queries: {str(e)}")
        
        # Get related topics
        logger.debug("Fetching related topics")
        try:
            related_topics = pytrends.related_topics()
            logger.debug(f"Related topics keys: {list(related_topics.keys())}")
            
            if keyword in related_topics:
                top_topics = related_topics[keyword].get('top', pd.DataFrame())
                rising_topics = related_topics[keyword].get('rising', pd.DataFrame())
                logger.debug(f"Top topics shape: {top_topics.shape}, Rising topics shape: {rising_topics.shape}")
                
                if not top_topics.empty:
                    logger.debug("Processing top topics")
                    for _, row in top_topics.iterrows():
                        try:
                            processed_topics['top'].append({
                                'topic': row.get('topic_title', ''),
                                'value': float(row.get('value', 0)),
                                'type': row.get('topic_type', '')
                            })
                        except Exception as e:
                            logger.error(f"Error processing top topic row: {row}, error: {str(e)}")
                            continue
                
                if not rising_topics.empty:
                    logger.debug("Processing rising topics")
                    for _, row in rising_topics.iterrows():
                        try:
                            processed_topics['rising'].append({
                                'topic': row.get('topic_title', ''),
                                'value': float(row.get('value', 0)),
                                'type': row.get('topic_type', '')
                            })
                        except Exception as e:
                            logger.error(f"Error processing rising topic row: {row}, error: {str(e)}")
                            continue
        except Exception as e:
            logger.warning(f"Error fetching related topics: {str(e)}")
        
        logger.info(f"Successfully processed trend data for keyword: {keyword}")
        return {
            'status': 'success',
            'processed_data': {
                'keyword': keyword,
                'timeframe': timeframe,
                'geo': geo,
                'data': data,
                'related_queries': processed_queries,
                'related_topics': processed_topics,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting trend data for keyword '{keyword}': {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': f"Failed to get trend data for keyword '{keyword}': {str(e)}"
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