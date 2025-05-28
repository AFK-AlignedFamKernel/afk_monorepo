import axios from "axios";
import { load } from "cheerio";

interface RedditPost {
  title: string;
  url: string;
  subreddit: string;
  upvotes: number;
  comments: number;
  author: string;
  created: string;
}

interface RedditAnalytics {
  totalPosts: number;
  totalComments: number;
  totalUpvotes: number;
  subreddits: Array<{ name: string; posts: number }>;
  topPosts: RedditPost[];
}

export async function searchReddit(keyword: string): Promise<RedditAnalytics> {
  try {
    const response = await axios.get(
      `https://www.reddit.com/search/?q=${encodeURIComponent(keyword)}&sort=relevance&t=all`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      }
    );

    const $ = load(response.data);
    const posts: RedditPost[] = [];
    const subredditCounts = new Map<string, number>();

    // Parse Reddit's search results
    $('div[data-testid="post-container"]').each((_, element) => {
      const title = $(element).find('h3').text();
      const url = $(element).find('a[data-click-id="body"]').attr('href') || '';
      const subreddit = $(element).find('a[data-click-id="subreddit"]').text();
      const upvotes = parseInt($(element).find('button[data-click-id="upvote"]').text()) || 0;
      const comments = parseInt($(element).find('a[data-click-id="comments"]').text()) || 0;
      const author = $(element).find('a[data-click-id="author"]').text();
      const created = $(element).find('a[data-click-id="timestamp"]').text();

      posts.push({
        title,
        url: url.startsWith('/') ? `https://reddit.com${url}` : url,
        subreddit,
        upvotes,
        comments,
        author,
        created
      });

      subredditCounts.set(subreddit, (subredditCounts.get(subreddit) || 0) + 1);
    });

    // Calculate analytics
    const totalPosts = posts.length;
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);
    const totalUpvotes = posts.reduce((sum, post) => sum + post.upvotes, 0);

    const subreddits = Array.from(subredditCounts.entries())
      .map(([name, posts]) => ({ name, posts }))
      .sort((a, b) => b.posts - a.posts);

    return {
      totalPosts,
      totalComments,
      totalUpvotes,
      subreddits,
      topPosts: posts.sort((a, b) => b.upvotes - a.upvotes).slice(0, 10)
    };
  } catch (error) {
    console.error('Error searching Reddit:', error);
    return {
      totalPosts: 0,
      totalComments: 0,
      totalUpvotes: 0,
      subreddits: [],
      topPosts: []
    };
  }
}
