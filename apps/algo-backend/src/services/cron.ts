import { NDKKind } from "@nostr-dev-kit/ndk";
import { getTrendingAndViralByEvents } from "./nostr/trending";
import { fetchEvents } from "./nostr/utils";

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

    const handleTrendingAndViralEvents = async () => {
        console.log('Getting trending events from user pay scoring');
        const events = await fetchEvents({ kinds: [NDKKind.Text, NDKKind.Article, NDKKind.HorizontalVideo, NDKKind.VerticalVideo], limit: 100, authors: [process.env.NOSTR_AFK_BOT_PUBKEY!] });
        console.log('Events', events);
        console.log('Events length', events.length);
        const trendingEvents = await getTrendingAndViralByEvents(events);
        console.log('Trending Events', trendingEvents);
    }

    const handleAllScoreByEvents = async () => {
        console.log('Getting all score by events');
        const events = await fetchEvents({ kinds: [NDKKind.Text, NDKKind.Article, NDKKind.HorizontalVideo, NDKKind.VerticalVideo], limit: 100, authors: [process.env.NOSTR_AFK_BOT_PUBKEY!] });
        console.log('Events', events);
        console.log('Events length', events.length);
        const trendingEvents = await getTrendingAndViralByEvents(events);
        console.log('Trending Events', trendingEvents);
    }
    handleTrendingAndViralEvents();
    setInterval(handleTrendingAndViralEvents, 1000 * 60 * 60 * 24);

}