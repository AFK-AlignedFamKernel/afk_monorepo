# youtube_niche_analyzer.py
import sys
import json
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import os

# Ensure your YOUTUBE_API_KEY is set as an environment variable
# or replace with your actual key directly (not recommended for production)
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "YOUR_YOUTUBE_API_KEY") 
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

def youtube_service():
    return build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=YOUTUBE_API_KEY)

def get_youtube_niche_creators(niche_keyword, max_search_results=50):
    youtube = youtube_service()
    creator_data = {} # Stores aggregated data per channel

    try:
        # Step 1: Search for videos related to the niche
        search_request = Youtube().list(
            q=niche_keyword,
            part="snippet",
            type="video",
            order="relevance",
            maxResults=max_search_results
        )
        search_response = search_request.execute()

        video_ids = []
        video_channel_map = {} # Map video ID to channel ID and title
        for item in search_response.get('items', []):
            video_id = item['id']['videoId']
            channel_id = item['snippet']['channelId']
            channel_title = item['snippet']['channelTitle']

            video_ids.append(video_id)
            video_channel_map[video_id] = {'id': channel_id, 'title': channel_title}
        
        if not video_ids:
            return []

        # Step 2: Get detailed statistics for the found videos
        # The API limits ID strings to ~50 IDs at once, so batch if necessary
        # For simplicity, we assume max_search_results is not excessively large
        videos_request = youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        )
        videos_response = videos_request.execute()

        for item in videos_response.get('items', []):
            video_id = item['id']
            channel_info = video_channel_map.get(video_id)
            if not channel_info:
                continue

            channel_id = channel_info['id']
            channel_title = channel_info['title']

            views = int(item['statistics'].get('viewCount', 0))
            likes = int(item['statistics'].get('likeCount', 0))
            comments = int(item['statistics'].get('commentCount', 0))

            if channel_id not in creator_data:
                creator_data[channel_id] = {
                    "platform": "YouTube",
                    "channelId": channel_id,
                    "name": channel_title,
                    "contentCount": 0,
                    "totalViews": 0,
                    "totalLikes": 0,
                    "totalComments": 0
                }
            
            creator_data[channel_id]["contentCount"] += 1
            creator_data[channel_id]["totalViews"] += views
            creator_data[channel_id]["totalLikes"] += likes
            creator_data[channel_id]["totalComments"] += comments

        # Convert dictionary to list
        return list(creator_data.values())

    except HttpError as e:
        sys.stderr.write(f"YouTube API Error: {e.resp.status}\n{e.content.decode()}\n")
        return []
    except Exception as e:
        sys.stderr.write(f"An unexpected error occurred in YouTube script: {e}\n")
        return []

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python youtube_niche_analyzer.py <niche_keyword> [max_search_results]\n")
        sys.exit(1)

    niche_keyword = sys.argv[1]
    max_search_results = int(sys.argv[2]) if len(sys.argv) > 2 else 50

    results = get_youtube_niche_creators(niche_keyword, max_search_results)
    print(json.dumps(results))