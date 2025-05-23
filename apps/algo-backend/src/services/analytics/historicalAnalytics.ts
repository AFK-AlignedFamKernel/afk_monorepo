import { scrapeGoogleSearch, scrapeGoogleTrends } from '../scraper/trends/googleTrends';
import { searchTikTok, getTikTokAnalytics } from '../scraper/tiktok';
import { searchReddit } from '../scraper/reddit';
import { searchTwitter } from '../scraper/twitter';
import { getKeywordToolData } from '../scraper/keywordTool';

interface HistoricalData {
  date: string;
  searchVolume: number;
  mentions: {
    google: number;
    tiktok: number;
    reddit: number;
    twitter: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  keywordMetrics?: {
    cpc: number;
    competition: number;
    trend: number;
  };
}

interface GeographicalData {
  country: string;
  searchVolume: number;
  mentions: number;
  engagement: number;
}

interface KeywordInsights {
  searchVolume: number;
  cpc: number;
  competition: number;
  trend: number;
  relatedKeywords: Array<{
    keyword: string;
    searchVolume: number;
    cpc: number;
    competition: number;
  }>;
  questions: string[];
  longTailKeywords: string[];
}

interface HistoricalAnalytics {
  keyword: string;
  dailyData: HistoricalData[];
  monthlyData: HistoricalData[];
  geographicalData: GeographicalData[];
  totalSearchVolume: number;
  averageDailySearches: number;
  peakSearchVolume: {
    value: number;
    date: string;
  };
  trendingCountries: string[];
  keywordInsights: KeywordInsights;
}

export async function getHistoricalAnalytics(
  keyword: string,
  days: number = 30
): Promise<HistoricalAnalytics> {
  try {
    // Get historical data from Google Trends and KeywordTool
    const [googleTrends, keywordToolData] = await Promise.all([
      scrapeGoogleTrends(keyword),
      getKeywordToolData(keyword)
    ]);
    
    // Get current data from all platforms
    const [tiktokData, redditData, twitterData] = await Promise.all([
      getTikTokAnalytics(keyword),
      searchReddit(keyword),
      searchTwitter(keyword)
    ]);

    // Process daily data
    const dailyData: HistoricalData[] = googleTrends.trendValues.map(trend => ({
      date: trend.date,
      searchVolume: trend.value,
      mentions: {
        google: trend.value,
        tiktok: Math.floor(tiktokData.totalVideos / days), // Approximate daily average
        reddit: Math.floor(redditData.totalPosts / days),
        twitter: Math.floor(twitterData.totalTweets / days)
      },
      engagement: {
        likes: Math.floor((tiktokData.totalLikes + twitterData.totalLikes) / days),
        comments: Math.floor((tiktokData.totalComments + redditData.totalComments) / days),
        shares: Math.floor((tiktokData.totalShares + twitterData.totalRetweets) / days)
      },
      keywordMetrics: {
        cpc: keywordToolData.cpc,
        competition: keywordToolData.competition,
        trend: keywordToolData.trend
      }
    }));

    // Calculate monthly data by aggregating daily data
    const monthlyData: HistoricalData[] = [];
    const monthlyMap = new Map<string, HistoricalData>();

    dailyData.forEach(daily => {
      const month = daily.date.substring(0, 7); // YYYY-MM format
      const existing = monthlyMap.get(month) || {
        date: month,
        searchVolume: 0,
        mentions: { google: 0, tiktok: 0, reddit: 0, twitter: 0 },
        engagement: { likes: 0, comments: 0, shares: 0 },
        keywordMetrics: {
          cpc: keywordToolData.cpc,
          competition: keywordToolData.competition,
          trend: keywordToolData.trend
        }
      };

      existing.searchVolume += daily.searchVolume;
      existing.mentions.google += daily.mentions.google;
      existing.mentions.tiktok += daily.mentions.tiktok;
      existing.mentions.reddit += daily.mentions.reddit;
      existing.mentions.twitter += daily.mentions.twitter;
      existing.engagement.likes += daily.engagement.likes;
      existing.engagement.comments += daily.engagement.comments;
      existing.engagement.shares += daily.engagement.shares;

      monthlyMap.set(month, existing);
    });

    monthlyData.push(...monthlyMap.values());

    // Process geographical data
    const geographicalData: GeographicalData[] = googleTrends.geographicalData.map(geo => ({
      country: geo.country,
      searchVolume: geo.value,
      mentions: Math.floor(
        (tiktokData.totalVideos + redditData.totalPosts + twitterData.totalTweets) * 
        (geo.value / 100)
      ),
      engagement: Math.floor(
        (tiktokData.totalLikes + tiktokData.totalComments + tiktokData.totalShares +
         redditData.totalUpvotes + redditData.totalComments +
         twitterData.totalLikes + twitterData.totalRetweets) *
        (geo.value / 100)
      )
    }));

    // Calculate overall metrics
    const totalSearchVolume = dailyData.reduce((sum, day) => sum + day.searchVolume, 0);
    const averageDailySearches = totalSearchVolume / days;
    const peakSearchVolume = dailyData.reduce(
      (peak, day) => day.searchVolume > peak.value ? { value: day.searchVolume, date: day.date } : peak,
      { value: 0, date: '' }
    );

    // Get trending countries (top 5 by search volume)
    const trendingCountries = geographicalData
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 5)
      .map(geo => geo.country);

    return {
      keyword,
      dailyData,
      monthlyData,
      geographicalData,
      totalSearchVolume,
      averageDailySearches,
      peakSearchVolume,
      trendingCountries,
      keywordInsights: {
        searchVolume: keywordToolData.searchVolume,
        cpc: keywordToolData.cpc,
        competition: keywordToolData.competition,
        trend: keywordToolData.trend,
        relatedKeywords: keywordToolData.relatedKeywords,
        questions: keywordToolData.questions,
        longTailKeywords: keywordToolData.longTailKeywords
      }
    };
  } catch (error) {
    console.error('Error in historical analytics:', error);
    throw error;
  }
} 