import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { getTrendingAndViralByEvents } from "./nostr/scoring";
import { fetchEvents, fetchFollowers, fetchFollowings } from "./nostr/utils";
import { nip19 } from "nostr-tools";
import { handleClassifyScore, handleNostrEventsClassififierMultiple, handleZeroShotClassification } from "./nostr/classification";
import { TextClassificationOutput } from "@huggingface/transformers";
import { handleClassification } from "./nostr/llm";

export const NPUBKEY_EXAMPLE = "npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs"
export const initAllCronJobs = async () => {
    console.log('Initializing all cron jobs');
    const cronJobs = [
        {
            name: 'getTrendingAndViralEvents',
            interval: '*/10 * * * *'
        }
    ]

    // cronJobs.forEach(async (job) => {

    // });

    // const PUBKEY_EXAMPLE = nip19.decode(NPUBKEY_EXAMPLE).data;
    const PUBKEY_EXAMPLE="c1e9ab3a56a2ab6ca4bebf44ea64b2fda40ac6311e886ba86b4652169cb56b43"
    const limit = 1;
    const handleTrendingAndViralEvents = async () => {
        console.log('Getting trending events from user pay scoring');

        const followersEvents = await fetchFollowers(PUBKEY_EXAMPLE);
        console.log('Followers Events', followersEvents?.length);
        const followingsEvents = await fetchFollowings(PUBKEY_EXAMPLE);
        console.log('Followings Events', followingsEvents?.length);


        const events = await fetchEvents({
            kinds: [
                // NDKKind.Text,
                NDKKind.Article,
                // NDKKind.HorizontalVideo,
                // NDKKind.VerticalVideo
            ], limit: limit, authors: [
                // process.env.NOSTR_AFK_BOT_PUBKEY!,
                PUBKEY_EXAMPLE
            ]
        });

        const eventsWithClassification: { note: NDKEvent, ml?: any | any[], llm?: any }[] = [];

        for (const event of events) {
            console.log("Event content", event?.content);
            const classification = await handleZeroShotClassification(event?.content);
            console.log('Classification', classification);
            const llmClassification = await handleClassification(event?.content);
            console.log('LLM Classification', llmClassification);
            eventsWithClassification.push({
                note: event,
                ml: classification,
                llm: llmClassification?.result
            });
        }

        console.log('Events with classification', eventsWithClassification);
        // console.log('Events', events);
        // console.log('Events length', events.length);
        const trendingEvents = await getTrendingAndViralByEvents(events);
        // console.log('Trending Events', trendingEvents);
    }


    handleTrendingAndViralEvents();
    setInterval(handleTrendingAndViralEvents, 1000 * 60 * 60 * 24);

}