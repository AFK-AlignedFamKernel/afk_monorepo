import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { getTrendingAndViralByEvents } from "./content/scoring";
import { fetchEventMetadata, fetchEvents, fetchFollowers, fetchFollowings } from "./utils";
import { nip19 } from "nostr-tools";
import { handleClassifyScore, handleNostrEventsClassififierMultiple, handleZeroShotClassification } from "../langchain/content/classification";
import { TextClassificationOutput } from "@huggingface/transformers";
import { handleClassification } from "../langchain/content/llm";
import { handleClassificationProfile } from "../langchain/profile/llm";
import { analyzeProfile } from "./profile/scoring";

export const NPUBKEY_EXAMPLE = "npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs"

// const PUBKEY_EXAMPLE = nip19.decode(NPUBKEY_EXAMPLE).data;
const PUBKEY_EXAMPLE = "c1e9ab3a56a2ab6ca4bebf44ea64b2fda40ac6311e886ba86b4652169cb56b43"
const limit = 1;
const limitEventsProfileScroring = 200;


export const handleTrendingAndViralEvents = async () => {
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
// handleTrendingAndViralEvents();
// setInterval(handleTrendingAndViralEvents, 1000 * 60 * 60 * 24);

export const handleProfilesScoring = async () => {
    console.log('Getting trending events from user pay scoring');

    const followersEvents = await fetchFollowers(PUBKEY_EXAMPLE);
    console.log('Followers Events', followersEvents?.length);
    const followingsEvents = await fetchFollowings(PUBKEY_EXAMPLE);
    console.log('Followings Events', followingsEvents?.length);

    const eventProfile = await fetchEventMetadata(PUBKEY_EXAMPLE);
    console.log('Event Profile', eventProfile);

    const sinceTimestamp = new Date().getTime() - 1000 * 60 * 60 * 24 * 7

    const events = await fetchEvents({
        kinds: [
            NDKKind.Text,
            NDKKind.Article,
            // NDKKind.HorizontalVideo,
            // NDKKind.VerticalVideo
        ], limit: limitEventsProfileScroring, authors: [
            // process.env.NOSTR_AFK_BOT_PUBKEY!,
            PUBKEY_EXAMPLE
        ],
        // since: sinceTimestamp
    });
    console.log('Events notes and articles', events?.length);

    const eventsWithClassification: { note: NDKEvent, ml?: any | any[], llm?: any }[] = [];
    // // console.log('Events', events);
    // // console.log('Events length', events.length);
    const algoAnalyze = await analyzeProfile(PUBKEY_EXAMPLE, events, sinceTimestamp);
    console.log('Analyse', algoAnalyze);
    const llmClassification = await handleClassificationProfile(eventProfile?.content ?? "", events?.map(e => e?.content));
    console.log('LLM Classificatio  n', llmClassification);
    eventsWithClassification.push({
        note: events?.[0],
        ml: undefined,
        llm: llmClassification?.result
    });
    console.log('Events with classification', eventsWithClassification);

    const profileNoted = {
        profile: {
            ...eventProfile,

        },
        algo: algoAnalyze,
        llm: llmClassification?.result
    }

    console.log('profileNoted', profileNoted);

}
