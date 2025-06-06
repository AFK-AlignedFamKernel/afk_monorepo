import { Scraper, SearchMode, Tweet } from "@the-convocation/twitter-scraper";

import dotenv from 'dotenv';
dotenv.config();
// A proxy URL is an intermediary server that forwards requests to the target server (in this case, Twitter).
// It can be used to bypass rate limits, access geo-restricted content, or mask the original request source.
// In this scraper, the proxy URL is used to route Twitter API requests through an external proxy service.
const PROXY_URL = process.env.PROXY_URL ?? "https://afk-community.xyz/?";
export class TwitterScraper {
  private scraper: Scraper;

  constructor() {
    console.log("PROXY_URL", PROXY_URL);
    this.scraper = new Scraper({
      // transform: {
      //   request(input: RequestInfo | URL, init?: RequestInit) {
      //     // The arguments here are the same as the parameters to fetch(), and
      //     // are kept as-is for flexibility of both the library and applications.
      //     if (input instanceof URL) {
      //       const proxy = PROXY_URL +
      //         encodeURIComponent(input.toString());
      //       return [proxy, init];
      //     } else if (typeof input === "string") {
      //       const proxy = PROXY_URL + encodeURIComponent(input);
      //       return [proxy, init];
      //     } else {
      //       // Omitting handling for example
      //       throw new Error("Unexpected request input type");
      //     }
      //   },
      // },
    });


  }

  async init(credentials: { username: string, password: string, email?: string }) {
    try {

      const cookies = await this.scraper.getCookies();
      console.log("cookies", cookies);
      if (!cookies || cookies.length === 0) {

        console.log("login");
        const user = await this.scraper.login(credentials.username, credentials.password, credentials.email);
        console.log("user", user);
        return true;
      }

      this.scraper.setCookies(cookies);

      return true;
    } catch (error) {
      console.error("init error", error);
      return false;
    }

  }

  async getUser(username: string) {
    try {
      const user = await this.scraper.getProfile(username);
      return user;
    } catch (error) {
      console.error(error);
      return null;
    }

  }

  async getUserTweets(username: string,) {
    const tweets = await this.scraper.getTweets(username);
    return tweets;
  }

  async getTrends() {
    const trends = await this.scraper.getTrends();
    return trends;
  }

  async getTweets(query: string, maxTweets: number = 10, searchMode: SearchMode = SearchMode.Latest) {
    try {
      const tweets = await this.scraper.fetchSearchTweets(query, maxTweets, searchMode);
      return tweets;
    } catch (error) {
      console.error(error);
      return null;
    }

  }

  async searchTweets(query: string, maxTweets: number = 10, searchMode: SearchMode = SearchMode.Latest) {
    try {
      const tweets = await this.scraper.searchTweets(query, maxTweets, searchMode);
      const tweetsArray: Tweet[] = [];
      for await (let tweet of tweets) {
        tweetsArray.push(tweet);
      }
      return tweetsArray;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

}