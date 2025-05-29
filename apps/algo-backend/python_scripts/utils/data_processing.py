import pandas as pd
from typing import Dict, List, Any
from datetime import datetime, timedelta
import numpy as np

def calculate_trend_stats(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate statistics for trend data.
    
    Args:
        data: List of trend data points with 'date' and 'value' keys
        
    Returns:
        Dictionary containing various statistics
    """
    if not data:
        return {}
        
    df = pd.DataFrame(data)
    values = df['value'].values
    
    return {
        'mean': float(np.mean(values)),
        'median': float(np.median(values)),
        'std': float(np.std(values)),
        'min': float(np.min(values)),
        'max': float(np.max(values)),
        'current_value': float(values[-1]),
        'change_24h': float(values[-1] - values[-2]) if len(values) > 1 else 0,
        'change_7d': float(values[-1] - values[-8]) if len(values) > 7 else 0,
        'change_30d': float(values[-1] - values[-31]) if len(values) > 30 else 0,
        'volatility': float(np.std(values) / np.mean(values)) if np.mean(values) != 0 else 0
    }

def format_trend_data_for_ui(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Format trend data for UI display.
    
    Args:
        data: List of trend data points
        
    Returns:
        Dictionary with formatted data for UI
    """
    if not data:
        return {}
        
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    
    # Group by date and calculate daily stats
    daily_stats = df.groupby(df['date'].dt.date).agg({
        'value': ['mean', 'min', 'max']
    }).reset_index()
    
    # Format for UI
    return {
        'timeline': {
            'dates': daily_stats['date'].dt.strftime('%Y-%m-%d').tolist(),
            'values': daily_stats[('value', 'mean')].tolist(),
            'min_values': daily_stats[('value', 'min')].tolist(),
            'max_values': daily_stats[('value', 'max')].tolist()
        },
        'stats': calculate_trend_stats(data),
        'last_updated': datetime.now().isoformat()
    }

def get_trend_periods(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Get trend data for different time periods.
    
    Args:
        data: List of trend data points
        
    Returns:
        Dictionary with trend data for different periods
    """
    if not data:
        return {}
        
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    now = datetime.now()
    
    periods = {
        '24h': now - timedelta(days=1),
        '7d': now - timedelta(days=7),
        '30d': now - timedelta(days=30),
        '90d': now - timedelta(days=90)
    }
    
    result = {}
    for period, start_date in periods.items():
        period_data = df[df['date'] >= start_date]
        if not period_data.empty:
            result[period] = format_trend_data_for_ui(period_data.to_dict('records'))
    
    return result

def get_keyword_insights(data: List[Dict[str, Any]], related_queries: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate insights about a keyword based on trend data and related queries.
    
    Args:
        data: List of trend data points
        related_queries: Dictionary of related queries data
        
    Returns:
        Dictionary with keyword insights
    """
    if not data:
        return {}
        
    stats = calculate_trend_stats(data)
    
    # Analyze related queries
    top_rising = []
    top_related = []
    
    if related_queries:
        for keyword, queries in related_queries.items():
            if isinstance(queries, dict) and 'top' in queries and 'rising' in queries:
                if isinstance(queries['top'], pd.DataFrame):
                    top_related.extend(queries['top'].head(5).to_dict('records'))
                if isinstance(queries['rising'], pd.DataFrame):
                    top_rising.extend(queries['rising'].head(5).to_dict('records'))
    
    return {
        'trend_stats': stats,
        'related_queries': {
            'top': top_related,
            'rising': top_rising
        },
        'trend_direction': 'up' if stats.get('change_7d', 0) > 0 else 'down',
        'trend_strength': abs(stats.get('change_7d', 0)) / stats.get('mean', 1) if stats.get('mean', 0) != 0 else 0
    } 