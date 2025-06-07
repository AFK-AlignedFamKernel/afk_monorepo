import { cos_sim } from '@huggingface/transformers';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

const getApifyClient = () => {
    return client;
}

const getApifyActor = (actorName: string) => {
    return client.actor(actorName);
}

const getApifyDataset = (datasetId: string) => {
    return client.dataset(datasetId);
}

const lastRunId = async (actorName: string) => {
    const { defaultDatasetId } = await client.actor(actorName).call();
    const { items } = await client.dataset(defaultDatasetId).listItems({
        limit: 1000
    });
    return items[0].runId;

}


const lastRunItems = async (actorName: string) => {

    // Select the last run of your Actor that finished
    const actorClient = client.actor(actorName);
    // with a SUCCEEDED status.
    const lastSucceededRunClient = actorClient.lastRun({ status: 'SUCCEEDED' });
    // Fetches items from the run's dataset.
    const { items } = await lastSucceededRunClient.dataset().listItems();
    return items;
}

const getApifyActorRun = async (actorName: string, runId: string) => {

    try {
        // Starts an Actor and waits for it to finish
        const { defaultDatasetId } = await client.actor(actorName).call();

        // Lists items from the Actor's dataset
        const { items } = await client.dataset(defaultDatasetId).listItems({
            limit: 1000
        });

        return items;
    } catch (error) {
        console.error('Error getting Apify actor run:', error);
        throw error;
    }

}



export { getApifyClient, getApifyActor, getApifyDataset, getApifyActorRun };