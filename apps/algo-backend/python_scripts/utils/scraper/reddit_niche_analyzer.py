# reddit_niche_analyzer.py
import sys
import json
import praw
import os

# Ensure your Reddit API credentials are set as environment variables
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "YOUR_REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "YOUR_REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = "NicheMindshareAnalyzer/1.0 (by /u/YOUR_REDDIT_USERNAME)" # Replace with your username

def reddit_service():
    return praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT
    )

def get_reddit_niche_creators(niche_keyword, limit=50):
    reddit = reddit_service()
    creator_data = {}

    try:
        # Search for posts across all subreddits
        # Note: 'limit' is for the number of submissions retrieved per request, not total posts
        # For more comprehensive search, you might need pagination logic
        for submission in reddit.subreddit('all').search(niche_keyword, limit=limit):
            # Authors can be Redditor objects or [deleted] or None
            if submission.author is None: # Deleted account
                continue
            
            author_name = submission.author.name

            # PRAW provides score (upvotes) and num_comments
            score = submission.score
            comments = submission.num_comments

            if author_name not in creator_data:
                creator_data[author_name] = {
                    "platform": "Reddit",
                    "name": author_name,
                    "contentCount": 0,
                    "totalScore": 0,
                    "totalComments": 0
                }
            
            creator_data[author_name]["contentCount"] += 1
            creator_data[author_name]["totalScore"] += score
            creator_data[author_name]["totalComments"] += comments
        
        return list(creator_data.values())

    except Exception as e:
        sys.stderr.write(f"An error occurred in Reddit script: {e}\n")
        return []

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python reddit_niche_analyzer.py <niche_keyword> [limit]\n")
        sys.exit(1)

    niche_keyword = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 50

    results = get_reddit_niche_creators(niche_keyword, limit)
    print(json.dumps(results))