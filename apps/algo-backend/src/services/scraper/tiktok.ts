import axios from 'axios';
import { load } from 'cheerio';

interface TikTokVideo {
  id: string;
  description: string;
  author: {
    username: string;
    nickname: string;
    followers: number;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  hashtags: string[];
  music: {
    title: string;
    author: string;
  };
  createdAt: string;
}

interface TikTokAnalytics {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  topHashtags: Array<{
    tag: string;
    count: number;
  }>;
  topCreators: Array<{
    username: string;
    followers: number;
    videos: number;
  }>;
  engagementRate: number;
}

export async function searchTikTok(keyword: string): Promise<TikTokVideo[]> {
  try {
    const response = await axios.get(
      `https://www.tiktok.com/search?q=${encodeURIComponent(keyword)}`,
      // {
      //   headers: {
      //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      //     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      //     'Accept-Language': 'en-US,en;q=0.9',
      //     'Referer': 'https://www.tiktok.com/',
      //   }
      // }
    );

    const $ = load(response.data);
    const videos: TikTokVideo[] = [];

    // TikTok's search results are loaded dynamically via JavaScript
    // We'll need to extract the initial state data from the page
    const initialState = $('script#SIGI_STATE').text();
    if (initialState) {
      try {
        const data = JSON.parse(initialState);
        const items = data?.ItemModule || {};

        Object.values(items).forEach((item: any) => {
          if (item.type === 'video') {
            videos.push({
              id: item.id,
              description: item.desc,
              author: {
                username: item.author.uniqueId,
                nickname: item.author.nickname,
                followers: item.author.stats.followerCount,
              },
              stats: {
                views: item.stats.playCount,
                likes: item.stats.diggCount,
                comments: item.stats.commentCount,
                shares: item.stats.shareCount,
              },
              hashtags: item.challenges?.map((challenge: any) => challenge.title) || [],
              music: {
                title: item.music.title,
                author: item.music.authorName,
              },
              createdAt: item.createTime,
            });
          }
        });
      } catch (error) {
        console.error('Error parsing TikTok data:', error);
      }
    }

    return videos.slice(0, 10); // Return top 10 videos
  } catch (error) {
    console.error('Error searching TikTok:', error);
    return [];
  }
}

export async function getTikTokAnalytics(keyword: string): Promise<TikTokAnalytics> {
  try {
    const videos = await searchTikTok(keyword);
    
    if (videos.length === 0) {
      return {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        topHashtags: [],
        topCreators: [],
        engagementRate: 0,
      };
    }

    // Calculate totals
    const totals = videos.reduce((acc, video) => ({
      views: acc.views + video.stats.views,
      likes: acc.likes + video.stats.likes,
      comments: acc.comments + video.stats.comments,
      shares: acc.shares + video.stats.shares,
    }), { views: 0, likes: 0, comments: 0, shares: 0 });

    // Get top hashtags
    const hashtagCounts = new Map<string, number>();
    videos.forEach(video => {
      video.hashtags.forEach(tag => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });
    });

    const topHashtags = Array.from(hashtagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get top creators
    const creatorStats = new Map<string, { followers: number; videos: number }>();
    videos.forEach(video => {
      const { username, followers } = video.author;
      const current = creatorStats.get(username) || { followers, videos: 0 };
      creatorStats.set(username, {
        followers,
        videos: current.videos + 1,
      });
    });

    const topCreators = Array.from(creatorStats.entries())
      .map(([username, stats]) => ({
        username,
        followers: stats.followers,
        videos: stats.videos,
      }))
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 5);

    // Calculate engagement rate
    const totalEngagements = totals.likes + totals.comments + totals.shares;
    const engagementRate = (totalEngagements / totals.views) * 100;

    return {
      totalVideos: videos.length,
      totalViews: totals.views,
      totalLikes: totals.likes,
      totalComments: totals.comments,
      totalShares: totals.shares,
      topHashtags,
      topCreators,
      engagementRate: Number(engagementRate.toFixed(2)),
    };
  } catch (error) {
    console.error('Error getting TikTok analytics:', error);
    return {
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      topHashtags: [],
      topCreators: [],
      engagementRate: 0,
    };
  }
} 