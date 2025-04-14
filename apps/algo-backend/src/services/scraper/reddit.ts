import axios from "axios";
import * as cheerio from "cheerio";

export const scrapeRedditSubreddit = async (subreddit: string, limit = 10) => {
  const url = `https://www.reddit.com/r/${subreddit}/`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(data);
    const posts: { title: string; link: string }[] = [];

    $("div[data-testid='post-container']").each((_, el) => {
      const title = $(el).find("h3").first().text().trim();
      const link = "https://www.reddit.com" + $(el).find("a[data-click-id='body']").attr("href");
      if (title && link) {
        posts.push({ title, link });
      }
    });

    return posts.slice(0, limit);
  } catch (error) {
    console.error("Failed to scrape Reddit:", error);
    return [];
  }
};
