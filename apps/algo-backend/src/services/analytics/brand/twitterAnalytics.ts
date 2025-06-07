import ApifyService from "../../apify/apifiy";

import { object, z } from 'zod';
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider';
import { mindshareScoreProfileRating } from "../scoring";
import { engagementScoreProfileRating } from "../scoring";
import { AiService } from "../../ai/ai";
import { TwitterScraper } from "../../scraper/twitterScraper";
import { Tweet } from "@the-convocation/twitter-scraper";

import dotenv from 'dotenv';
dotenv.config();

interface LlmInputsGeneration {
    model: string;
    systemPrompt: string;
    prompt: string;
}

interface LlmInputsGenerationObject {
    model: string;
    systemPrompt: string;
    prompt: string;
    schema: z.ZodSchema;
}

export class TwitterAnalytics {
    private aiService: AiService = new AiService();
    private twitterScraper: TwitterScraper = new TwitterScraper();

    private apifyService: ApifyService;
    public actorsApify: {
        [key: string]: string;
    } = {
            "twitter": "apidojo/tweet-scraper",
            "reddit-scraper": "afk-agent/reddit-scraper",
            "youtube-scraper": "afk-agent/youtube-scraper",
            "x-kaito": "kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest"
        }

    constructor(twitterScraper: TwitterScraper) {
        this.apifyService = new ApifyService();
        this.twitterScraper = twitterScraper;
    }

    async getTwitterAnalytics(brand_handle: string, topics?: string[]): Promise<{
        dataUser?: any,
        xKaito?: any,
        twitter?: any,
        result?: any[],
        usersScores?: any[],
        usersNamesScores?: any[],
        totalMindshareScore?: number,
        totalEngagementScore?: number,
    } | null | undefined> {
        try {
            console.log("brand_handle", brand_handle);
            let lastTwitter = null;

            if (!this.twitterScraper.isInitialized) {
                await this.twitterScraper.init({
                    username: process.env.TWITTER_USERNAME!,
                    password: process.env.TWITTER_PASSWORD!,
                    email: process.env.TWITTER_EMAIL!,
                });
            }

            const user = await this.twitterScraper.getUser(brand_handle);
            console.log("user", user);


            const query = `(${brand_handle} OR @${brand_handle}) since:${new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0]}`;

            const twitterLatestTweets = await this.twitterScraper.searchTweets(query, 100);


            if (!twitterLatestTweets) {
                return null;
            }


            console.log("twitterLatestTweets scraper", twitterLatestTweets);

            const usersNames = new Set();
            const userProfilePerName = new Map();
            const users = new Set();
            const userTweets = new Map<string | undefined, Tweet[]>(new Map());
            const userTweet = new Map<string, Tweet>();
            const userTweetsWithData = new Map();



            for (let tweet of twitterLatestTweets) {

                if (tweet?.username) {
                    usersNames.add(tweet.username);
                    users.add(tweet);

                    if (!userProfilePerName.has(tweet.username)) {
                        userProfilePerName.set(tweet.username, tweet);
                    }

                    if (!userTweets.has(tweet.username)) {
                        userTweets.set(tweet.username, []);
                    }
                    userTweets.get(tweet.username)?.push(tweet);
                    userTweetsWithData.set(tweet, tweet);
                    userTweet.set(tweet.username, tweet);
                }

            }

            const usersListNames = Array.from(usersNames);
            const usersList = Array.from(users);
            const userTweetsList = Array.from(userTweets.entries()).map(([user, tweets]) => ({
                user,
                tweets
            }));

            const userTweetsListWithData = Array.from(userTweets.entries()).map(([user, userTweets]) => ({
                user,
                userTweets
            }));

            console.log("Unique users names:", usersListNames.length);
            console.log("Unique users:", usersList.length);
            console.log("User tweets mapping:", userTweetsList.length);
            console.log("User tweets mapping with data:", userTweetsListWithData.length);

            let usersScores: any[] = []
            let usersNamesScores: any[] = []
            let totalTweets = 0;
            let overallMindshareScore = 0;
            let overallEngagementScore = 0;


            Array.from(userTweets.entries()).forEach(([userName, tweets]) => {

                // console.log("tweets per user", tweets);

                let user = userProfilePerName.get(userName);
                console.log("user calculated", user?.userName);

                totalTweets += tweets.length;

                let repostCount = 0;
                let likeCount = 0;
                let viewCount = 0;
                let quoteCount = 0;
                let replyCount = 0;
                let bookmarkCount = 0;

                for (let tweet of Array.isArray(tweets) ? tweets : []) {
                    repostCount += tweet?.retweets ?? 0;
                    likeCount += tweet?.likes ?? 0;
                    viewCount += tweet?.views ?? 0;
                    quoteCount += tweet?.quotedStatus?.likes ?? 0;
                    replyCount += tweet?.replies ?? 0;
                    bookmarkCount += tweet?.bookmarkCount ?? 0;
                }

                const mindshareScore = mindshareScoreProfileRating({
                    repostCount: repostCount,
                    likeCount: likeCount,
                    viewCount: viewCount,
                    quoteCount: quoteCount,
                    replyCount: replyCount,
                    followersCount: user?.followersCount,
                    followingCount: user?.followingCount,
                    bookmarkCount: bookmarkCount,
                })


                console.log("mindshareScore", mindshareScore);

                const engagementScore = engagementScoreProfileRating({
                    repostCount: repostCount,
                    likeCount: likeCount,
                    viewCount: viewCount,
                    quoteCount: quoteCount,
                    replyCount: replyCount,
                    bookmarkCount: bookmarkCount,
                    followersCount: user?.followersCount,
                    followingCount: user?.followingCount,
                })

                overallMindshareScore += mindshareScore?.totalScore
                overallEngagementScore += engagementScore?.totalScore
                let userRanking = {
                    ...user,
                    mindshareScore: mindshareScore,
                    engagementScore: engagementScore,
                    totalMindshareScore: mindshareScore?.totalScore,
                    totalEngagementScore: engagementScore?.totalScore
                }

                usersScores.push(userRanking);

                return {
                    user: {
                        ...user,
                        mindshareScore: mindshareScore,
                        engagementScore: engagementScore,
                        totalMindshareScore: mindshareScore?.totalScore,
                        totalEngagementScore: engagementScore?.totalScore
                    },
                    tweets: tweets,
                }
            })

            console.log("totalTweets", totalTweets);

            usersScores.sort((a, b) => (b.totalMindshareScore + b.totalEngagementScore) - (a.totalMindshareScore + a.totalEngagementScore));

            usersScores = usersScores.map((user, index) => {
                usersNamesScores.push(user?.username);
                return {
                    ...user,
                    rank: index + 1
                }
            });



            usersScores = usersScores.filter(user => user !== undefined);
            usersNamesScores = usersNamesScores.filter(name => name !== undefined);



            return {
                dataUser: {
                    xKaito: twitterLatestTweets,
                    twitter: lastTwitter,
                },
                xKaito: twitterLatestTweets,
                twitter: lastTwitter,
                result: usersScores,
                usersScores: usersScores,
                usersNamesScores: usersNamesScores,
                totalMindshareScore: overallMindshareScore,
                totalEngagementScore: overallEngagementScore
            };
        } catch (error) {
            console.error(error);
            return null;
        }

    }

    async getTwitterAnalyticsApify(brand_handle: string, topics?: string[]): Promise<{
        dataUser?: any,
        xKaito?: any,
        twitter?: any,
        result?: any[],
        usersScores?: any[],
        usersNamesScores?: any[],
        totalMindshareScore?: number,
        totalEngagementScore?: number,
    } | null | undefined> {
        try {
            console.log("brand_handle", brand_handle);
            console.log("runApify",);
            let lastTwitter = null;
            // const lastTwitter = await this.apifyService.runApifyActorWithDataset(this.actorsApify["twitter"], {
            //     twitterHandles: [user]
            // });
            // console.log("lastTwitter apify", lastTwitter);
            // const lastXkaito = await this.apifyService.runApifyActorWithDataset(this.actorsApify["x-kaito"], {
            //     searchTerms: [brand_handle],
            //     since: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            //     "@": brand_handle,
            //     queryType: "Top",
            //     maxItems: 100,
            //     twitterContent: brand_handle,
            // });
            const lastXkaito = await this.apifyService.getLastRunItemsApifyActorWithDataset(this.actorsApify["x-kaito"], {
                searchTerms: [brand_handle],
                since: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
                "@": brand_handle,
                queryType: "Top",
                maxItems: 100,
                twitterContent: brand_handle,
            });
            console.log("lastXkaito apify", lastXkaito);

            const usersNames = new Set();
            const userProfilePerName = new Map();
            const users = new Set();
            const userTweets = new Map();
            const userTweet = new Map();
            const userTweetsWithData = new Map();


            if (lastXkaito && Array.isArray(lastXkaito)) {
                lastXkaito.forEach((tweet: any) => {
                    if (tweet.author && tweet.author.userName) {
                        usersNames.add(tweet.author.userName);
                        users.add(tweet.author);

                        if (!userProfilePerName.has(tweet.author.userName)) {
                            userProfilePerName.set(tweet.author.userName, tweet.author);
                        }

                        if (!userTweets.has(tweet.author.userName)) {
                            userTweets.set(tweet.author.userName, []);
                        }
                        userTweets.get(tweet.author.userName).push(tweet);
                        userTweetsWithData.set(tweet.author, tweet);
                        userTweet.set(tweet.author, tweet);

                    }
                });
            }

            const usersListNames = Array.from(usersNames);
            const usersList = Array.from(users);
            const userTweetsList = Array.from(userTweets.entries()).map(([user, tweets]) => ({
                user,
                tweets
            }));

            const userTweetsListWithData = Array.from(userTweets.entries()).map(([user, userTweets]) => ({
                user,
                userTweets
            }));

            console.log("Unique users names:", usersListNames.length);
            console.log("Unique users:", usersList.length);
            console.log("User tweets mapping:", userTweetsList.length);
            console.log("User tweets mapping with data:", userTweetsListWithData.length);

            let usersScores: any[] = []
            let usersNamesScores: any[] = []
            let totalTweets = 0;
            let overallMindshareScore = 0;
            let overallEngagementScore = 0;

            let userScoreMap = Array.from(userTweets.entries()).map(([userName, tweets]) => {

                console.log("tweets per user", tweets);

                let user = userProfilePerName.get(userName);
                console.log("user calculated", user?.userName);

                totalTweets += tweets.length;

                let repostCount = 0;
                let likeCount = 0;
                let viewCount = 0;
                let quoteCount = 0;
                let replyCount = 0;
                let bookmarkCount = 0;

                for (let tweet of Array.isArray(tweets) ? tweets : []) {
                    repostCount += tweet?.retweetCount;
                    likeCount += tweet?.likeCount;
                    viewCount += tweet?.viewCount;
                    quoteCount += tweet?.quoteCount;
                    replyCount += tweet?.replyCount;
                    bookmarkCount += tweet?.bookmarkCount;
                }

                const mindshareScore = mindshareScoreProfileRating({
                    repostCount: repostCount,
                    likeCount: likeCount,
                    viewCount: viewCount,
                    quoteCount: quoteCount,
                    replyCount: replyCount,
                    followersCount: user?.followersCount,
                    followingCount: user?.followingCount,
                    bookmarkCount: bookmarkCount,
                })


                console.log("mindshareScore", mindshareScore);

                const engagementScore = engagementScoreProfileRating({
                    repostCount: repostCount,
                    likeCount: likeCount,
                    viewCount: viewCount,
                    quoteCount: quoteCount,
                    replyCount: replyCount,
                    bookmarkCount: bookmarkCount,
                    followersCount: user?.followersCount,
                    followingCount: user?.followingCount,
                })

                overallMindshareScore += mindshareScore?.totalScore
                overallEngagementScore += engagementScore?.totalScore
                let userRanking = {
                    ...user,
                    mindshareScore: mindshareScore,
                    engagementScore: engagementScore,
                    totalMindshareScore: mindshareScore?.totalScore,
                    totalEngagementScore: engagementScore?.totalScore
                }

                usersScores.push(userRanking);

                return {
                    user: {
                        ...user,
                        mindshareScore: mindshareScore,
                        engagementScore: engagementScore,
                        totalMindshareScore: mindshareScore?.totalScore,
                        totalEngagementScore: engagementScore?.totalScore
                    },
                    tweets: tweets,
                }
            })

            console.log("totalTweets", totalTweets);

            usersScores.sort((a, b) => (b.totalMindshareScore + b.totalEngagementScore) - (a.totalMindshareScore + a.totalEngagementScore));

            usersScores = usersScores.map((user, index) => {
                usersNamesScores.push(user?.userName);
                return {
                    ...user,
                    rank: index + 1
                }
            });



            usersScores = usersScores.filter(user => user !== undefined);
            usersNamesScores = usersNamesScores.filter(name => name !== undefined);



            return {
                dataUser: {
                    xKaito: lastXkaito,
                    twitter: lastTwitter,
                },
                xKaito: lastXkaito,
                twitter: lastTwitter,
                result: usersScores,
                usersScores: usersScores,
                usersNamesScores: usersNamesScores,
                totalMindshareScore: overallMindshareScore,
                totalEngagementScore: overallEngagementScore
            };
        } catch (error) {
            console.error(error);
            return null;
        }

    }




}