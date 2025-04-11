import { handleProfilesScoring, handleTrendingAndViralEvents } from "./nostr/algo-general";
import { externalTrendings } from "./nostr/content/trending";

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
    const PUBKEY_EXAMPLE = "c1e9ab3a56a2ab6ca4bebf44ea64b2fda40ac6311e886ba86b4652169cb56b43"
    const limit = 1;
    const limitEventsProfileScroring = 200;
    handleTrendingAndViralEvents();
    // setInterval(handleTrendingAndViralEvents, 1000 * 60 * 60 * 24);

    const trending = await externalTrendings();
    console.log(trending);

    handleProfilesScoring(PUBKEY_EXAMPLE);
    setInterval(handleProfilesScoring, 1000 * 60 * 60 * 24 * 7);


}


