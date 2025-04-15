import axios from "axios";
import * as cheerio from "cheerio";

export const scrapeNitterProfile = async (username: string, instance = "https://nitter.net") => {
  const url = `${instance}/${username}`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(data);
    const tweets: { content: string; time: string }[] = [];

    $("div.timeline-item").each((_, el) => {
      const content = $(el).find(".tweet-content").text().trim();
      const time = $(el).find("span.tweet-date > a").attr("title") || "";
      if (content) tweets.push({ content, time });
    });

    return tweets;
  } catch (error) {
    console.error("Failed to scrape Nitter:", error);
    return [];
  }
};
