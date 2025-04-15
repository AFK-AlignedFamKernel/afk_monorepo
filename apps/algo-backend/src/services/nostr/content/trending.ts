import axios from 'axios';


interface ExternalTrending {
    event_id: string;
    reactions: number;
    reposts: number;
    zap_amount: number;
    zap_count: number;
}
export const externalTrendings = async (): Promise<ExternalTrending[]> => {
    try {
        console.log("external trending")
        const events = await axios.get(`${process.env.EXTERNAL_NOSTR_API}/trending`);
        console.log(events.data);
        return events.data;
    } catch (error) {
        console.error(error);
        return [];
    }
}


export const externalSearch = async (query: string): Promise<any[]> => {
    try {
        console.log("external search")
        const events = await axios.get(`${process.env.EXTERNAL_NOSTR_API}/search?query=${query}`);
        console.log(events.data);
        return events.data;
    } catch (error) {
        console.error(error);
        return [];
    }
}


export const externalClassification = async (): Promise<any[]> => {
    try {
        console.log("external classification")
        const events = await axios.get(`${process.env.EXTERNAL_NOSTR_API}/classification`);
        console.log(events.data);
        return events.data;
    } catch (error) {
        console.error(error);
        return [];
    }
}

