import { Scraper, SearchMode, Tweet } from 'agent-twitter-client';
import { TwitterApi, TwitterApiReadWrite } from 'twitter-api-v2';

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface TwitterCredentials {
  username: string;
  password: string;
  email?: string;
  appKey?: string;
  appSecret?: string;
  accessToken?: string;
  accessSecret?: string;
}

interface PollOptions {
  label: string;
}

interface PollConfig {
  options: PollOptions[];
  durationMinutes: number;
}

interface TweetOptions {
  poll?: PollConfig;
  media?: string[];
  replyToId?: string;
}

interface TweetV2Options {
  expansions?: string[];
  pollFields?: string[];
  mediaFields?: string[];
  tweetFields?: string[];
  userFields?: string[];
  placeFields?: string[];
}

const appKey = process.env.TWITTER_API_KEY as string;
const appSecret = process.env.TWITTER_API_SECRET as string;
const accessToken = process.env.TWITTER_ACCESS_TOKEN as string;
const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET as string;

export class TwitterClient {
  private scraper: Scraper;
  private isInitialized: boolean = false;
  private twitterApi: TwitterApiReadWrite;

  constructor() {
    this.scraper = new Scraper();

  }

  async initialize(credentials: TwitterCredentials): Promise<void> {
    try {
      console.log("credentials", credentials);
      if (credentials.appKey && credentials.appSecret && credentials.accessToken && credentials.accessSecret) {
        console.log("logging in with app key");
        try {
          // Corrected instantiation:

          const userClient = new TwitterApi({
            appKey: credentials.appKey,
            appSecret: credentials.appSecret,
            accessToken: credentials.accessToken,
            accessSecret: credentials.accessSecret,
          });

          // Get a Read/Write client for user-context actions
          const rwClient = userClient.readWrite;
          this.twitterApi = rwClient;
        } catch (error) {
          console.error('Failed to login with app key:', error);
          throw new Error('Failed to login with app key');
        }
        // try {
        //   await this.scraper.login(
        //     credentials.username,
        //     credentials.password,
        //     credentials.email,
        //     credentials.appKey,
        //     credentials.appSecret,
        //     credentials.accessToken,
        //     credentials.accessSecret
        //   );
        // } catch (error) {
        //   console.error('Failed to login with scraper:', error);
        // }


      } else {
        // try {
        //   // await this.scraper.login(credentials.username, credentials.password, credentials.email);
        //   // console.error('Failed to login with email:', error);
        //   // const token  = await this.scraper.authenticatePeriscope(); 
        //   const cookies = await this.scraper.getCookies();
        //   // console.log(token);
        //   console.log("cookies", cookies);
        //   this.scraper.setCookies(cookies);

        //   await this.scraper.login(credentials.username, credentials.password, credentials.email);
        // } catch (error) {
        //   console.error('Failed to login with email:', error);
        //   const token = await this.scraper.authenticatePeriscope();
        //   const cookies = await this.scraper.getCookies();
        //   console.log(cookies);
        //   this.scraper.setCookies(cookies);
        //   await this.scraper.login(credentials.username, credentials.password, credentials.email);
        //   // throw new Error('Failed to login with email');
        // }
      }
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Twitter client: ${error.message}`);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.scraper.logout();
      this.isInitialized = false;
    } catch (error) {
      throw new Error(`Failed to logout: ${error.message}`);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      return await this.scraper.isLoggedIn();
    } catch (error) {
      throw new Error(`Failed to check login status: ${error.message}`);
    }
  }

  async sendTweet(content: string, options?: TweetOptions): Promise<{ tweet: Tweet | null | undefined, response: Response | undefined, tweetId: string | undefined, isSuccess: boolean | undefined }> {
    this.checkInitialized();

    let isSuccess = false;
    try {
      let tweetId: string | undefined;
      let res: Response | undefined;
      let tweet: Tweet | null | undefined;

      if (!isSuccess) {
        try {
          let mediaId: string | undefined;
          if (options?.media) {
            mediaId = await this.twitterApi.v1.uploadMedia(options.media[0]);
          }
          let tweetObject: any;
          if (mediaId) {
            const { data: tweet } = await this.twitterApi.v2.tweet({
              text: content,
              media: { media_ids: [mediaId] },
            });
            tweetObject = tweet;
          } else {
            const { data: tweet } = await this.twitterApi.v2.tweet(content);
            tweetObject = tweet;
          }
          return {
            tweet: tweetObject,
            response: res,
            tweetId: tweetId,
            isSuccess: true
          }
        } catch (error) {
          throw new Error(`Failed to send tweet: ${error.message}`);
        }
      }


      if(!isSuccess) {
        if (options?.poll) {
          tweet = await this.scraper.sendTweetV2(content, options.replyToId, {
            poll: {
              options: options.poll.options,
              duration_minutes: options.poll.durationMinutes,
            },
          });
          tweetId = tweet?.id;
          isSuccess = true;
        } else {
          res = await this.scraper.sendTweet(content);
          const resBody = await res?.json();
          tweetId = resBody?.data?.create_tweet?.tweet_results?.result?.rest_id;
          isSuccess = true;
        }
      }
      return {
        tweet: tweet,
        response: res,
        tweetId: tweetId,
        isSuccess: isSuccess
      }
    } catch (error) {
      throw new Error(`Failed to send tweet: ${error.message}`);
    }

  }

  async getTweets(username: string, count: number = 10): Promise<any[]> {
    this.checkInitialized();
    try {
      const tweets: any[] = [];
      for await (const tweet of this.scraper.getTweets(username, count)) {
        if (tweet) tweets.push(tweet);
      }
      return tweets;
    } catch (error) {
      throw new Error(`Failed to get tweets: ${error.message}`);
    }
  }

  async getTweetsAndReplies(username: string): Promise<any[]> {
    this.checkInitialized();
    try {
      const tweets: any[] = [];
      for await (const tweet of this.scraper.getTweetsAndReplies(username)) {
        if (tweet) tweets.push(tweet);
      }
      return tweets;
    } catch (error) {
      throw new Error(`Failed to get tweets and replies: ${error.message}`);
    }
  }

  async getLatestTweet(username: string): Promise<any> {
    this.checkInitialized();
    try {
      const tweet = await this.scraper.getLatestTweet(username);
      return tweet || null;
    } catch (error) {
      throw new Error(`Failed to get latest tweet: ${error.message}`);
    }
  }

  async getTweet(tweetId: string, options?: TweetV2Options): Promise<any> {
    this.checkInitialized();
    try {
      if (options) {
        const tweet = await this.scraper.getTweetV2(tweetId, options as any);
        return tweet || null;
      }
      const tweet = await this.scraper.getTweet(tweetId);
      return tweet || null;
    } catch (error) {
      throw new Error(`Failed to get tweet: ${error.message}`);
    }
  }

  async getTweetsV2(tweetIds: string[], options?: TweetV2Options): Promise<any[]> {
    this.checkInitialized();
    try {
      const tweets = await this.scraper.getTweetsV2(tweetIds, options as any);
      return tweets.filter(tweet => tweet !== null);
    } catch (error) {
      throw new Error(`Failed to get tweets: ${error.message}`);
    }
  }

  async searchTweets(query: string, count: number = 20, mode: SearchMode = SearchMode.Latest): Promise<any[]> {
    this.checkInitialized();
    try {
      const tweets: any[] = [];
      for await (const tweet of this.scraper.searchTweets(query, count, mode)) {
        if (tweet) tweets.push(tweet);
      }
      return tweets;
    } catch (error) {
      throw new Error(`Failed to search tweets: ${error.message}`);
    }
  }

  async getTrends(): Promise<any[]> {
    this.checkInitialized();
    try {
      return await this.scraper.getTrends();
    } catch (error) {
      throw new Error(`Failed to get trends: ${error.message}`);
    }
  }

  async searchProfiles(query: string, count: number = 10): Promise<any[]> {
    this.checkInitialized();
    try {
      const profiles: any[] = [];
      for await (const profile of this.scraper.searchProfiles(query, count)) {
        if (profile) profiles.push(profile);
      }
      return profiles;
    } catch (error) {
      throw new Error(`Failed to search profiles: ${error.message}`);
    }
  }

  async getProfile(username: string): Promise<any> {
    this.checkInitialized();
    try {
      const profile = await this.scraper.getProfile(username);
      return profile || null;
    } catch (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  }

  async getUserIdByScreenName(username: string): Promise<string> {
    this.checkInitialized();
    try {
      return await this.scraper.getUserIdByScreenName(username);
    } catch (error) {
      throw new Error(`Failed to get user ID: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<any> {
    this.checkInitialized();
    try {
      const user = await this.scraper.me();
      return user || null;
    } catch (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
  }

  async getCookies(): Promise<any> {
    this.checkInitialized();
    try {
      return await this.scraper.getCookies();
    } catch (error) {
      throw new Error(`Failed to get cookies: ${error.message}`);
    }
  }

  async setCookies(cookies: any): Promise<void> {
    try {
      await this.scraper.setCookies(cookies);
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to set cookies: ${error.message}`);
    }
  }

  async clearCookies(): Promise<void> {
    try {
      await this.scraper.clearCookies();
      this.isInitialized = false;
    } catch (error) {
      throw new Error(`Failed to clear cookies: ${error.message}`);
    }
  }

  private checkInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Twitter client not initialized. Call initialize() first.');
    }
  }
} 