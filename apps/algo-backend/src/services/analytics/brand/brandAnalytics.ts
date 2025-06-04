import ApifyService from "../../apify/apifiy";

import { generateObject, generateText } from 'ai';
import { object, z } from 'zod';
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider';



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

export class BrandAnalytics {
    private openRouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
    });;


    private apifyService: ApifyService;
    public actorsApify: {
        [key: string]: string;
    } = {
            "twitter": "apidojo/tweet-scraper",
            "reddit-scraper": "afk-agent/reddit-scraper",
            "youtube-scraper": "afk-agent/youtube-scraper",
            "x-kaito": "kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest"
        }

    constructor() {
        this.apifyService = new ApifyService();
    }

    async generateObject(inputs: LlmInputsGenerationObject): Promise<{
        object: any,
        usage: any,
    } | null | undefined> {
        try {
            const { object, usage } = await generateObject({
                model: openrouter(inputs.model),
                system: inputs.systemPrompt,
                schema: inputs.schema,
                prompt: inputs.prompt,
            });
            return {
                object: object,
                usage: usage,
            };
        } catch (error) {
            console.error(error);
            return null;
        }

    }

    async generateTextLlm(inputs: LlmInputsGeneration): Promise<{ text: string, sources: any, usage: any } | null | undefined> {
        try {
            const { text, sources, usage } = await generateText({
                model: openrouter(inputs.model),
                system: inputs.systemPrompt,
                prompt: inputs.prompt,
            });
            return {
                text: text,
                sources: sources,
                usage: usage,
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getTwitterAnalytics(brand_handle: string, topics?: string[]): Promise<{
        dataUser?: any,
        xKaito?: any,
        twitter?: any,
        result?: any,
        processData?: any,
        recommendations?: any,
        stats_creator?: any,
        stats_content?: any,
    } | null | undefined> {
        try {
            console.log("brand_handle", brand_handle);
            console.log("runApify",);
            let lastTwitter = null;
            // const lastTwitter = await this.apifyService.runApifyActorWithDataset(this.actorsApify["twitter"], {
            //     twitterHandles: [user]
            // });
            // console.log("lastTwitter apify", lastTwitter);
            const lastXkaito = await this.apifyService.runApifyActorWithDataset(this.actorsApify["x-kaito"], {
                searchTerms: [brand_handle],
                since: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
                "@": brand_handle,
                queryType:"Top",
                maxItems:100,
                twitterContent:brand_handle,
            });
            console.log("lastXkaito apify", lastXkaito);

            const users = new Set();
            const userTweets = new Map();

            if (lastXkaito && Array.isArray(lastXkaito)) {
                lastXkaito.forEach((tweet: any) => {
                    if (tweet.author && tweet.author.userName) {
                        users.add(tweet.author.userName);
                        
                        if (!userTweets.has(tweet.author.userName)) {
                            userTweets.set(tweet.author.userName, []);
                        }
                        userTweets.get(tweet.author.userName).push(tweet);
                    }
                });
            }

            const usersList = Array.from(users);
            const userTweetsList = Array.from(userTweets.entries()).map(([user, tweets]) => ({
                user,
                tweets
            }));

            console.log("Unique users:", usersList);
            console.log("User tweets mapping:", userTweetsList);

            let prompt = `Rank the best users by score for the brand_handle ${brand_handle} and the topics ${topics}.
                `

            if(userTweetsList.length > 0) {
                prompt += `
                - ${JSON.stringify(userTweetsList)}
                `
            }


            const resultProcessDataObject = await this.generateObject({
                model: "anthropic/claude-3.7-sonnet",
                systemPrompt: `You are an AI analyzing a Twitter/X profile. Based on the bio, tweet content, engagement, and patterns, classify the profile according to:
                Rank the best users by score for the brand_handle ${brand_handle} and the topics ${topics}.

                    - Main Topics (max 3) [e.g., Crypto, Politics, Productivity]
                    - Expertise Level [Beginner, Intermediate, Expert]
                    - Reputation Score [0-100] (based on consistency, quality, and community trust)
                    - Sentiment Profile [Positive, Neutral, Negative, Mixed]
                    - Polarization Level [Low, Medium, High]
                    - Truthfulness Estimate [Likely True, Somewhat Misleading, Often Exaggerated]
                    - Copywriting Style [Professional, Casual, Technical, Humorous, etc.]
                    - Engagement Rate [0-100] (based on the number of likes, retweets, and comments)
                    - Content Quality [High, Medium, Low]
                    - Consistency [High, Medium, Low]
                    - Relevance [High, Medium, Low]
                    - Clarity [High, Medium, Low]
                    - Creativity [High, Medium, Low]
                    - Engagement Rate [0-100] (based on the number of likes, retweets, and comments)

                    Rank the best users by score for the brand_handle ${brand_handle} and the topics ${topics}.
                    `,
                prompt: `You are an AI analyzing a Twitter/X profile. Based on the bio, tweet content, engagement, and patterns, classify the profile according to:
                    Rank the best users by score for the brand_handle ${brand_handle} and the topics ${topics}.
                    
                - Main Topics (max 3) [e.g., Crypto, Politics, Productivity]
                    - Expertise Level [Beginner, Intermediate, Expert]
                    - Reputation Score [0-100] (based on consistency, quality, and community trust)
                    - Sentiment Profile [Positive, Neutral, Negative, Mixed]
                    - Polarization Level [Low, Medium, High]
                    - Truthfulness Estimate [Likely True, Somewhat Misleading, Often Exaggerated]
                    - Copywriting Style [Professional, Casual, Technical, Humorous, etc.]
                    - Engagement Rate [0-100] (based on the number of likes, retweets, and comments)
                    - Content Quality [High, Medium, Low]
                    - Consistency [High, Medium, Low]
                    - Relevance [High, Medium, Low]
                    - Clarity [High, Medium, Low]
                    - Creativity [High, Medium, Low]
                    - Engagement Rate [0-100] (based on the number of likes, retweets, and comments)
                    - Tone [Formal, Informal, Friendly, Casual]
                    - Introduction, Body, and Conclusion Score [0-100]
                    - Copy Writing Score [0-100]
                    - Story Telling and Hooks Score [0-100]
                    - Sentiment [Happy, Neutral, Sad, Critical, Passionate, Optimistic, Pessimistic]
                    - Overall Score [0-100]

                    Return a structured JSON object.
                    Data process are here: ${prompt}
                    

                    `,
                schema: z.object({
                    users: z.array(z.string()).describe("Array of users by descending order of score. Get handle twitter from the prompt and the score is the overall score of the user"),
                    score: z.array(z.number()).describe("Array of scores of the users"),
                    tweetRanking: z.array(z.string()).describe("Array of tweets by descending order of score, get the tweet from the prompt input"),
                    scoreTweets: z.array(z.number()).describe("Array of scores of the tweets"),
                   
                    // rankUsers: z.array(z.object({
                    //     user: z.string().describe("User name"),
                    //     score: z.number().describe("Score of the user"),
                    // })).describe("Array of users by descending order of score. Get handle twitter from the prompt and the score is the overall score of the user"),
                    // tweetRanking: z.array(z.object({
                    //     tweet: z.string().describe("Tweet"),
                    //     score: z.number().describe("Score of the tweet"),
                    // })).describe("Array of tweets by descending order of score, get the tweet from the prompt input"),
                }),
            });
            console.log("resultProcessDataObject", resultProcessDataObject);

            return {
                dataUser: {
                    xKaito: lastXkaito,
                    twitter: lastTwitter,
                },
                xKaito: lastXkaito,
                twitter: lastTwitter,
                result: resultProcessDataObject?.object,
                processData: prompt,
            };
        } catch (error) {
            console.error(error);
            return null;
        }

    }




}