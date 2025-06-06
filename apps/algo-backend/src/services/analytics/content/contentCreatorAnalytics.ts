import ApifyService from "../../apify/apifiy";

import { generateObject, generateText } from 'ai';
import { object, z } from 'zod';
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider';
import { TwitterScraper } from "../../scraper/twitterScraper";
import { AiService } from "../../ai/ai";



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

export class ContentCreatorAnalytics {
    private openRouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
    });;

    private twitterScraper: TwitterScraper;
    private aiService: AiService = new AiService();

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
        this.twitterScraper = twitterScraper;
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

    async getTwitterAnalytics(user: string): Promise<{
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
            console.log("user", user);
            let lastTwitter: any = null;

            if(!this.twitterScraper.isInitialized) {
                console.log("init twitter scraper");
                await this.twitterScraper.init({
                    username: process.env.TWITTER_USERNAME ?? "",
                    password: process.env.TWITTER_PASSWORD ?? "",
                    email: process.env.TWITTER_EMAIL ?? "",
                })
            }
            // const lastTwitter = await this.apifyService.runApifyActorWithDataset(this.actorsApify["twitter"], {
            //     twitterHandles: [user]
            // });
            // console.log("lastTwitter apify", lastTwitter);


            let lastXkaito = null;
            const tweetFromUser = await this.twitterScraper.getUserTweets(user);
            console.log("tweetFromUser", tweetFromUser);

            let tweetDataProcess:any[] = [];
       
            for await (let tweet of tweetFromUser) {

                if(!tweet.isRetweet){
                    tweetDataProcess.push({
                        text: tweet.text,
                        likes: tweet.likes,
                        retweets: tweet.retweets,
                        replies: tweet.replies,
                        bookmarks: tweet.bookmarkCount,
                        views: tweet.views,
                        createdAt: tweet.timestamp,
                    });         
                }

            }

            if (!tweetFromUser || tweetDataProcess.length === 0) {
                console.log("get twitter analytics apify");
                const lastXkaito = await this.apifyService.runApifyActorWithDataset(this.actorsApify["x-kaito"], {
                    from: user,
                    maxItems: 30,
                });
                console.log("lastXkaito apify", lastXkaito);

                lastTwitter = lastXkaito;
            }


            let dataProcess = "";
            let prompt = `Generate a summary of the last 10 tweets of the user ${user}.
                `

            // if (lastTwitter) {
            //     prompt += `
            //     - ${JSON.stringify(lastTwitter)}
            //     `
            // }

            if (lastXkaito) {
                dataProcess += `
                - ${JSON.stringify(lastXkaito)}
                `
            }

            if(tweetDataProcess.length > 0){
                dataProcess += `
                - ${JSON.stringify(tweetDataProcess)}
                `
            }
            const resultProcessDataObject = await this.generateObject({
                model: "anthropic/claude-3.7-sonnet",
                systemPrompt: `You are an AI analyzing a Twitter/X profile. Based on the bio, tweet content, engagement, and patterns, classify the profile according to:
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
                    `,
                prompt: `You are an AI analyzing a Twitter/X profile. Based on the bio, tweet content, engagement, and patterns, classify the profile according to:
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
                    Data process are here: ${dataProcess}
                    `,
                schema: z.object({
                    summary: z.string().describe("Summary of the user's recent tweets and overall content"),
                    mainTopics: z.array(z.string()).describe("Array of main topics the user frequently discusses (max 3)"),
                    mainSubjects: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions (max 3)"),
                    mainSubjectsPessimistic: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions negatively (max 3)"),
                    mainSubjectsNeutral: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions neutrally (max 3)"),
                    mainSubjectsOptimistic: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions positively (max 3)"),
                    expertiseLevel: z.number().min(0).max(3).describe("User's level of expertise in their main topics"),
                    reputationScore: z.number().min(0).max(100).describe("Numerical score (0-100) representing user's reputation based on consistency and community trust"),
                    sentimentProfile: z.string().describe("Overall sentiment of user's content"),
                    polarizationLevel: z.number().min(0).max(3).describe("Level of content polarization"),
                    trustScore: z.number().min(0).max(100).describe("Numerical score (0-100) representing user's trust based on consistency and community trust"),
                    truthfulnessEstimate: z.string().describe("Assessment of content truthfulness"),
                    copywritingStyle: z.string().describe("Style of writing and communication"),
                    mindShare: z.number().min(0).max(100).describe("Measure of user's influence and reach (0-100)"),
                    tone: z.enum(["formal", "informal", 'friendly', 'casual']).describe("The tone of the text"),
                    introductionBodyConclusionScore: z.number().min(0).max(100).describe("The score of the text in the introduction, body, and conclusion criteria"),
                    copyWritingScore: z.number().min(0).max(100).describe("The score of the text in the copy writing criteria and skills"),
                    storyTellingAndHooksScore: z.number().min(0).max(100).describe("The score of the text in the story telling and hooks criteria"),
                    sentiment: z
                        .enum(["happy", "neutral", "sad", "critical", "passionate", "optimistic", "pessimistic"])
                        .describe("The sentiment of the text"),

                    editingScore: z.number().min(0).max(100).describe("The score of the text in the editing criteria: like grammar, spelling, punctuation, etc."),
                    educationalScore: z.number().min(0).max(100).describe("The score of the text in the educational criteria: like pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    buildingScore: z.number().min(0).max(100).describe("The score of the text in the building criteria, like founder, working on an company, etc."),
                    contentScore: z.number().min(0).max(100).describe("The score of the text in the content criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    consistencyScore: z.number().min(0).max(100).describe("The score of the text in the consistency criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    relevanceScore: z.number().min(0).max(100).describe("The score of the text in the relevance criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    clarityScore: z.number().min(0).max(100).describe("The score of the text in the clarity criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    creativityScore: z.number().min(0).max(100).describe("The score of the text in the creativity criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    overallScore: z
                        .number()
                        .min(0)
                        .max(100)
                        .int()
                        .describe("The score of the text in the copy writing criteria: hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
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
                processData: dataProcess,
            };
        } catch (error) {
            console.error(error);
            return null;
        }

    }

    async getTwitterAnalyticsApify(user: string): Promise<{
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
            console.log("user", user);
            console.log("runApify",);
            let lastTwitter = null;
            // const lastTwitter = await this.apifyService.runApifyActorWithDataset(this.actorsApify["twitter"], {
            //     twitterHandles: [user]
            // });
            // console.log("lastTwitter apify", lastTwitter);
            const lastXkaito = await this.apifyService.runApifyActorWithDataset(this.actorsApify["x-kaito"], {
                from: user,
                maxItems: 30,
            });
            console.log("lastXkaito apify", lastXkaito);

            let prompt = `Generate a summary of the last 10 tweets of the user ${user}.
                `

            // if (lastTwitter) {
            //     prompt += `
            //     - ${JSON.stringify(lastTwitter)}
            //     `
            // }

            if (lastXkaito) {
                prompt += `
                - ${JSON.stringify(lastXkaito)}
                `
            }

            if (!lastXkaito) {
                return null;
            }
            const resultProcessData = await this.generateTextLlm({
                model: "anthropic/claude-3.7-sonnet",
                systemPrompt: `You are a helpful assistant that can generate a summary of the last 10 tweets of a user.`,
                prompt: prompt
            });
            console.log("resultProcessData", resultProcessData);

            const resultProcessDataObject = await this.generateObject({
                model: "anthropic/claude-3.7-sonnet",
                systemPrompt: `You are an AI analyzing a Twitter/X profile. Based on the bio, tweet content, engagement, and patterns, classify the profile according to:
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
                    `,
                prompt: `You are an AI analyzing a Twitter/X profile. Based on the bio, tweet content, engagement, and patterns, classify the profile according to:
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
                    Data process are here: ${resultProcessData?.text}
                    `,
                schema: z.object({
                    summary: z.string().describe("Summary of the user's recent tweets and overall content"),
                    mainTopics: z.array(z.string()).describe("Array of main topics the user frequently discusses (max 3)"),
                    mainSubjects: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions (max 3)"),
                    mainSubjectsPessimistic: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions negatively (max 3)"),
                    mainSubjectsNeutral: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions neutrally (max 3)"),
                    mainSubjectsOptimistic: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions positively (max 3)"),
                    expertiseLevel: z.number().min(0).max(3).describe("User's level of expertise in their main topics"),
                    reputationScore: z.number().min(0).max(100).describe("Numerical score (0-100) representing user's reputation based on consistency and community trust"),
                    sentimentProfile: z.string().describe("Overall sentiment of user's content"),
                    polarizationLevel: z.number().min(0).max(3).describe("Level of content polarization"),
                    trustScore: z.number().min(0).max(100).describe("Numerical score (0-100) representing user's trust based on consistency and community trust"),
                    truthfulnessEstimate: z.string().describe("Assessment of content truthfulness"),
                    copywritingStyle: z.string().describe("Style of writing and communication"),
                    mindShare: z.number().min(0).max(100).describe("Measure of user's influence and reach (0-100)"),
                    tone: z.enum(["formal", "informal", 'friendly', 'casual']).describe("The tone of the text"),
                    introductionBodyConclusionScore: z.number().min(0).max(100).describe("The score of the text in the introduction, body, and conclusion criteria"),
                    copyWritingScore: z.number().min(0).max(100).describe("The score of the text in the copy writing criteria and skills"),
                    storyTellingAndHooksScore: z.number().min(0).max(100).describe("The score of the text in the story telling and hooks criteria"),
                    sentiment: z
                        .enum(["happy", "neutral", "sad", "critical", "passionate", "optimistic", "pessimistic"])
                        .describe("The sentiment of the text"),

                    editingScore: z.number().min(0).max(100).describe("The score of the text in the editing criteria: like grammar, spelling, punctuation, etc."),
                    educationalScore: z.number().min(0).max(100).describe("The score of the text in the educational criteria: like pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    buildingScore: z.number().min(0).max(100).describe("The score of the text in the building criteria, like founder, working on an company, etc."),
                    contentScore: z.number().min(0).max(100).describe("The score of the text in the content criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    consistencyScore: z.number().min(0).max(100).describe("The score of the text in the consistency criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    relevanceScore: z.number().min(0).max(100).describe("The score of the text in the relevance criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    clarityScore: z.number().min(0).max(100).describe("The score of the text in the clarity criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    creativityScore: z.number().min(0).max(100).describe("The score of the text in the creativity criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
                    overallScore: z
                        .number()
                        .min(0)
                        .max(100)
                        .int()
                        .describe("The score of the text in the copy writing criteria: hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
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
                processData: resultProcessData,
            };
        } catch (error) {
            console.error(error);
            return null;
        }

    }




}