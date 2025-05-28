import axios from "axios";
import { load } from "cheerio";

interface TwitterAnalytics {
  totalTweets: number;
  totalRetweets: number;
  totalLikes: number;
  topHashtags: string[];
  topTweets: Array<{
    text: string;
    author: string;
    likes: number;
    retweets: number;
    date: string;
  }>;
}

export async function searchTwitter(keyword: string): Promise<TwitterAnalytics> {
  try {
    const response = await axios.get(
      `https://twitter.com/search?q=${encodeURIComponent(keyword)}&src=typed_query&f=live`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      }
    );

    const $ = load(response.data);
    const tweets: Array<{
      text: string;
      author: string;
      likes: number;
      retweets: number;
      date: string;
      hashtags: string[];
    }> = [];

    // Parse Twitter's search results
    $('article[data-testid="tweet"]').each((_, element) => {
      const text = $(element).find('div[data-testid="tweetText"]').text();
      const author = $(element).find('div[data-testid="User-Name"]').text();
      const likes = parseInt($(element).find('div[data-testid="like"]').text()) || 0;
      const retweets = parseInt($(element).find('div[data-testid="retweet"]').text()) || 0;
      const date = $(element).find('time').attr('datetime') || '';
      
      // Extract hashtags
      const hashtags = text.match(/#\w+/g) || [];

      tweets.push({
        text,
        author,
        likes,
        retweets,
        date,
        hashtags
      });
    });

    // Calculate analytics
    const totalTweets = tweets.length;
    const totalRetweets = tweets.reduce((sum, tweet) => sum + tweet.retweets, 0);
    const totalLikes = tweets.reduce((sum, tweet) => sum + tweet.likes, 0);

    // Get top hashtags
    const hashtagCounts = new Map<string, number>();
    tweets.forEach(tweet => {
      tweet.hashtags.forEach(tag => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });
    });

    const topHashtags = Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 10);

    return {
      totalTweets,
      totalRetweets,
      totalLikes,
      topHashtags,
      topTweets: tweets
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 10)
        .map(({ text, author, likes, retweets, date }) => ({
          text,
          author,
          likes,
          retweets,
          date
        }))
    };
  } catch (error) {
    console.error('Error searching Twitter:', error);
    return {
      totalTweets: 0,
      totalRetweets: 0,
      totalLikes: 0,
      topHashtags: [],
      topTweets: []
    };
  }
}
