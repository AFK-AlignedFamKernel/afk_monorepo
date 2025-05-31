import time
from functools import wraps
from typing import Callable, Any, Dict
import random

class RateLimiter:
    def __init__(self, max_requests: int = 5, time_window: int = 60):
        """
        Initialize rate limiter.
        
        Parameters:
        - max_requests: Maximum number of requests allowed in the time window
        - time_window: Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
    
    def can_make_request(self) -> bool:
        """Check if a new request can be made within rate limits"""
        now = time.time()
        # Remove old requests outside the time window
        self.requests = [req_time for req_time in self.requests if now - req_time < self.time_window]
        return len(self.requests) < self.max_requests
    
    def add_request(self):
        """Add a new request timestamp"""
        self.requests.append(time.time())
    
    def wait_time(self) -> float:
        """Calculate time to wait before next request"""
        if not self.requests:
            return 0
        now = time.time()
        oldest_request = min(self.requests)
        return max(0, self.time_window - (now - oldest_request))

def with_retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    rate_limiter: RateLimiter = None
):
    """
    Decorator for adding retry logic with exponential backoff and rate limiting.
    
    Parameters:
    - max_retries: Maximum number of retry attempts
    - base_delay: Initial delay between retries in seconds
    - max_delay: Maximum delay between retries in seconds
    - rate_limiter: Optional RateLimiter instance for rate limiting
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Dict[str, Any]:
            retries = 0
            while retries <= max_retries:
                try:
                    # Check rate limits if rate limiter is provided
                    if rate_limiter:
                        if not rate_limiter.can_make_request():
                            wait_time = rate_limiter.wait_time()
                            time.sleep(wait_time)
                        rate_limiter.add_request()
                    
                    # Execute the function
                    result = await func(*args, **kwargs)
                    
                    # Check for rate limit error in the result
                    if isinstance(result, dict) and result.get('status') == 'error':
                        error = result.get('error', '')
                        if '429' in error or 'rate limit' in error.lower():
                            raise Exception('Rate limit exceeded')
                    
                    return result
                    
                except Exception as e:
                    retries += 1
                    if retries > max_retries:
                        return {
                            'status': 'error',
                            'error': f'Max retries exceeded: {str(e)}'
                        }
                    
                    # Calculate delay with exponential backoff and jitter
                    delay = min(base_delay * (2 ** (retries - 1)), max_delay)
                    jitter = random.uniform(0, 0.1 * delay)
                    time.sleep(delay + jitter)
            
            return {
                'status': 'error',
                'error': 'Max retries exceeded'
            }
        
        return wrapper
    
    return decorator 