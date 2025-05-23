import { scrapeGoogleSearch, scrapeGoogleTrends, getOverallTrends } from '../scraper/trends/googleTrends';
import { searchTikTok, getTikTokAnalytics } from '../scraper/tiktok';
import { searchReddit } from '../scraper/reddit';
import { searchTwitter } from '../scraper/twitter';

export interface TrendAnalytics {
  keyword: string;
  google: {
    searchVolume: number;
    trendValues: any[];
    relatedQueries: string[];
    topPages: any[];
  };
  tiktok: {
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    topHashtags: Array<{ tag: string; count: number }>;
    engagementRate: number;
  };
  reddit: {
    totalPosts: number;
    totalComments: number;
    totalUpvotes: number;
    subreddits: Array<{ name: string; posts: number }>;
  };
  twitter: {
    totalTweets: number;
    totalRetweets: number;
    totalLikes: number;
    topHashtags: string[];
  };
  overallMetrics: {
    totalMentions: number;
    totalEngagement: number;
    platformDistribution: {
      google: number;
      tiktok: number;
      reddit: number;
      twitter: number;
    };
  };
}

export async function getUnifiedTrendAnalytics(keyword: string): Promise<TrendAnalytics> {
  try {
    // Fetch data from all platforms in parallel
    const [
      googleData,
      tiktokData,
      redditData,
      twitterData
    ] = await Promise.all([
      Promise.all([
        scrapeGoogleSearch(keyword),
        scrapeGoogleTrends(keyword)
      ]),
      getTikTokAnalytics(keyword),
      searchReddit(keyword),
      searchTwitter(keyword)
    ]);

    const [googleSearch, googleTrends] = googleData;

    // Calculate overall metrics
    const totalMentions = 
      tiktokData.totalVideos +
      redditData.totalPosts +
      twitterData.totalTweets;

    const totalEngagement = 
      tiktokData.totalLikes + tiktokData.totalComments + tiktokData.totalShares +
      redditData.totalUpvotes + redditData.totalComments +
      twitterData.totalLikes + twitterData.totalRetweets;

    // Calculate platform distribution percentages
    const platformDistribution = {
      google: (googleSearch.length / totalMentions) * 100,
      tiktok: (tiktokData.totalVideos / totalMentions) * 100,
      reddit: (redditData.totalPosts / totalMentions) * 100,
      twitter: (twitterData.totalTweets / totalMentions) * 100
    };

    return {
      keyword,
      google: {
        searchVolume: googleSearch.length,
        trendValues: googleTrends.trendValues,
        relatedQueries: googleTrends.relatedQueries,
        topPages: googleSearch
      },
      tiktok: {
        totalVideos: tiktokData.totalVideos,
        totalViews: tiktokData.totalViews,
        totalLikes: tiktokData.totalLikes,
        totalComments: tiktokData.totalComments,
        totalShares: tiktokData.totalShares,
        topHashtags: tiktokData.topHashtags,
        engagementRate: tiktokData.engagementRate
      },
      reddit: {
        totalPosts: redditData.totalPosts,
        totalComments: redditData.totalComments,
        totalUpvotes: redditData.totalUpvotes,
        subreddits: redditData.subreddits
      },
      twitter: {
        totalTweets: twitterData.totalTweets,
        totalRetweets: twitterData.totalRetweets,
        totalLikes: twitterData.totalLikes,
        topHashtags: twitterData.topHashtags
      },
      overallMetrics: {
        totalMentions,
        totalEngagement,
        platformDistribution
      }
    };
  } catch (error) {
    console.error('Error in unified trend analytics:', error);
    throw error;
  }
} 