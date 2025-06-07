import { cos_sim } from '@huggingface/transformers';
import { ApifyClient } from 'apify-client';
import { XKaitoParams } from './interface';

class ApifyService {
    private client: ApifyClient;

    
    public actors: {
        [key: string]: string;
    } = {
        "twitter": "apidojo/tweet-scraper",
        "reddit-scraper": "afk-agent/reddit-scraper",
        "youtube-scraper": "afk-agent/youtube-scraper",
        "x-kaito":"kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest"
    }

    public params: {
        [key: string]: any;
    } = {
        "twitter-scraper": {
            "limit": 1000,
            "sort": "newest",
            "filter": "all",
            "since": "2024-01-01",
            "until": "2024-01-01"
        },
    }

    constructor() {
        this.client = new ApifyClient({ token: process.env.APIFY_API_KEY });
    }

    getClient(): ApifyClient {
        return this.client;
    }

    getActor(actorName: string) {
        return this.client.actor(actorName);
    }

    getDataset(datasetId: string) {
        return this.client.dataset(datasetId);
    }

    async getLastRunId(actorName: string) {
        try {
        const { defaultDatasetId } = await this.client.actor(actorName).call();
        const { items } = await this.client.dataset(defaultDatasetId).listItems({
            limit: 1000
            });
            return items[0].runId;
        } catch (error) {
            console.error('Error getting Apify actor run:', error);
            throw error;
        }
    }

    public async getLastRunItemsApifyActorWithDataset(actorName: string, inputs?: any) {
        const items = await this.getLastRunItems(actorName);
        console.log("items", items);
        return items;
      }

    async getLastRunItems(actorName: string) {
        const actorClient = this.client.actor(actorName);
        const lastSucceededRunClient = actorClient.lastRun({ status: 'SUCCEEDED' });
        const { items } = await lastSucceededRunClient.dataset().listItems();
        return items;
    }

    async getActorRun(actorName: string, inputs?:any) {
        try {
            const { defaultDatasetId } = await this.client.actor(actorName).call(inputs);
            const { items } = await this.client.dataset(defaultDatasetId).listItems({
                // limit: 100
            });
            return items;
        } catch (error) {
            console.error('Error getting Apify actor run:', error);
            throw error;
        }
    }

    async runApifyActorWithDataset(actorName: string, inputs?:any) {
        try {
            const { defaultDatasetId } = await this.client.actor(actorName).call(inputs);
            const { items } = await this.client.dataset(defaultDatasetId).listItems({
                // limit: 100
            });
            return items;
        } catch (error) {
            console.error('Error getting Apify actor run:', error);
            throw error;
        }
    }
}

export default ApifyService;