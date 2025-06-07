import ApifyService from "../apify/apifiy";

import { generateObject, generateText } from 'ai';
import { object, z } from 'zod';
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider';
import { mindshareScoreProfileRating } from "../analytics/scoring";
import { engagementScoreProfileRating } from "../analytics/scoring";



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

export class AiService {
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



}