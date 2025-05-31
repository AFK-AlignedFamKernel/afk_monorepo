# twitter_niche_analyzer.py
import sys
import json
import requests
import os

# Ensure your TWITTER_BEARER_TOKEN is set as an environment variable
TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "YOUR_TWITTER_BEARER_TOKEN")

def get_twitter_niche_creators(niche_keyword, max_search_results=50):
    headers = {"Authorization": f"Bearer {TWITTER_BEARER_TOKEN}"}
    params = {
        'query': niche_keyword,
        'tweet.fields': 'public_metrics,author_id', # Request public metrics and author ID
        'user.fields': 'username,name',             # Request username and name for author_id
        'expansions': 'author_id',                  # Expand author_id to include user object
        'max_results': max_search_results,
        'sort_order': 'relevancy' # Or 'recency'
    }

    # Use 'recent' endpoint for lower tiers (last 7 days). 'all' requires higher access.
    url = "https://api.twitter.com/2/tweets/search/recent" 
    
    creator_data = {}

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status() # Raise an exception for HTTP errors
        data = response.json()
        
        users = {user['id']: user for user in data.get('includes', {}).get('users', [])}

        for tweet in data.get('data', []):
            author_id = tweet.get('author_id')
            user_info = users.get(author_id)
            
            if not user_info:
                continue

            # X API v2 public_metrics: retweet_count, reply_count, like_count, quote_count
            retweets = tweet['public_metrics'].get('retweet_count', 0)
            likes = tweet['public_metrics'].get('like_count', 0)
            replies = tweet['public_metrics'].get('reply_count', 0)
            quotes = tweet['public_metrics'].get('quote_count', 0)
            
            # Use author_id as unique identifier for the creator
            if author_id not in creator_data:
                creator_data[author_id] = {
                    "platform": "X",
                    "id": author_id,
                    "name": user_info['name'],
                    "username": user_info['username'],
                    "contentCount": 0,
                    "totalRetweets": 0,
                    "totalLikes": 0,
                    "totalReplies": 0,
                    "totalQuotes": 0
                }
            
            creator_data[author_id]["contentCount"] += 1
            creator_data[author_id]["totalRetweets"] += retweets
            creator_data[author_id]["totalLikes"] += likes
            creator_data[author_id]["totalReplies"] += replies
            creator_data[author_id]["totalQuotes"] += quotes

        return list(creator_data.values())

    except requests.exceptions.RequestException as e:
        sys.stderr.write(f"Twitter API Error: {e}\n")
        if response.status_code == 429: # Rate limit exceeded
            sys.stderr.write("Twitter API rate limit exceeded. Please wait and try again.\n")
        return []
    except Exception as e:
        sys.stderr.write(f"An unexpected error occurred in Twitter script: {e}\n")
        return []

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python twitter_niche_analyzer.py <niche_keyword> [max_search_results]\n")
        sys.exit(1)

    niche_keyword = sys.argv[1]
    max_search_results = int(sys.argv[2]) if len(sys.argv) > 2 else 50

    results = get_twitter_niche_creators(niche_keyword, max_search_results)
    print(json.dumps(results))