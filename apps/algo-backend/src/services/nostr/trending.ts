import NDK, { NDKEvent, NDKRelay, NostrEvent, NDKKind } from '@nostr-dev-kit/ndk';

import { fetchReactions, fetchReplies, fetchReposts, fetchBookmarks, fetchEvents } from './utils';



export const WEIGHT_INTERACTIONS_VIRALITY = {
    "reaction": 1,
    "reply": 1,
    "bookmark": 1,
    "repost": 1,
}

export const WEIGHT_INTERACTIONS_TRENDING = {
    "reaction": 1,
    "reply": 1,
    "bookmark": 1,
    "repost": 1,

}
// Calculate the virality score for an event
export function calculateViralityScore(event: NDKEvent, timestamp: number, reactions: any[], replies: any[], bookmarks: any[], reposts: any[], viralityWeight: number): { viralityScore?: number, repostViralityScore?: number, bookmarkViralityScore?: number, replyViralityScore?: number, reactionViralityScore?: number } {
    const currentTime = Date.now();
    const timeDiff = currentTime - timestamp; // Time difference in milliseconds
    const timeFactor = Math.max(0, 1 - (timeDiff / (1000 * 60 * 60 * 24))); // A factor decaying over time

    const reactionViralityScore = reactions.length * timeFactor;
    const replyViralityScore = replies.length * timeFactor;
    const bookmarkViralityScore = bookmarks.length * timeFactor;
    const repostViralityScore = reposts.length * timeFactor;
    console.log('Reaction Score', reactionViralityScore);
    console.log('Reply Score', replyViralityScore);
    console.log('Bookmark Score', bookmarkViralityScore);
    console.log('Repost Score', repostViralityScore);
    const viralityScore = reactionViralityScore + replyViralityScore + bookmarkViralityScore + repostViralityScore;
    console.log('Virality Score', viralityScore);
    return { viralityScore, repostViralityScore, bookmarkViralityScore, replyViralityScore, reactionViralityScore };
}

// Calculate the trending score for an event
export function calculateEngagementsScore(note: NDKEvent, timestamp: number, reactions: any[], replies: any[], bookmarks: any[], reposts: any[]): { reactionEngagementRate?: number, replyEngagementRate?: number, bookmarkEngagementRate?: number, repostEngagementRate?: number, overviewEngagementRate?: number } {
    const currentTime = Date.now();
    const timeDiff = currentTime - timestamp;
    const reactionEngagementRate = reactions.length / timeDiff; // reactions per millisecond
    const replyEngagementRate = replies.length / timeDiff; // replies per millisecond
    const bookmarkEngagementRate = bookmarks.length / timeDiff; // bookmarks per millisecond
    const repostEngagementRate = reposts.length / timeDiff; // reposts per millisecond
    console.log('Reaction Engagement Rate', reactionEngagementRate);
    console.log('Reply Engagement Rate', replyEngagementRate);
    console.log('Bookmark Engagement Rate', bookmarkEngagementRate);
    console.log('Repost Engagement Rate', repostEngagementRate);

    const overviewEngagementRate = (bookmarkEngagementRate + repostEngagementRate + reactionEngagementRate + replyEngagementRate);
    return { reactionEngagementRate, replyEngagementRate, bookmarkEngagementRate, repostEngagementRate, overviewEngagementRate: overviewEngagementRate ?? 0 };
}

export function calculateTrendingScore(note: NDKEvent, timestamp: number, overviewEngagementRate: number, viralityScore: number, mindshareScore: number): { reactionEngagementRate?: number, replyEngagementRate?: number, bookmarkEngagementRate?: number, repostEngagementRate?: number, overviewScoring?: number, trendingScore?: number } {
    const currentTime = Date.now();
    const timeDiff = currentTime - timestamp;


    const trendingScore = overviewEngagementRate + viralityScore + mindshareScore;
    return { trendingScore };
}

// Rank the events based on virality and trending scores
export async function rankEvents(events: NDKEvent[]): Promise<any[]> {
    const eventsWithScores = await Promise.all(events.map(async (note) => {
        const reactions = await fetchReactions(note.id);
        const replies = await fetchReplies(note.id);
        const bookmarks = await fetchBookmarks(note.id);
        const reposts = await fetchReposts(note.id);
        const timestamp = note?.created_at ?? 0;
        const { viralityScore, repostViralityScore, bookmarkViralityScore, replyViralityScore, reactionViralityScore } = calculateViralityScore(note, timestamp, reactions, replies, bookmarks, reposts, 1);
        const { reactionEngagementRate, replyEngagementRate, bookmarkEngagementRate, repostEngagementRate, overviewEngagementRate } = calculateEngagementsScore(note, timestamp, reactions, replies, bookmarks, reposts);
        console.log('Overview Scoring', overviewEngagementRate);
        const trendingScore = (viralityScore ?? 0) + (overviewEngagementRate ?? 0);
        console.log('Virality Score', viralityScore);
        console.log('Trending Score', trendingScore);
        return {
            eventId: note.id,
            note,
            viralityScore,
            reactionEngagementRate,
            replyEngagementRate,
            bookmarkEngagementRate,
            repostEngagementRate,
            overviewEngagementRate,
            trendingScore,
        };
    }));

    // Sort by both virality and trending scores
    eventsWithScores.sort((a, b) => (b?.viralityScore ?? 0) + (b?.trendingScore ?? 0) - ((a?.viralityScore ?? 0) + (a?.trendingScore ?? 0)));

    return eventsWithScores;
}

// Main function that does everything
export async function getEventsRecentTrendingAndViralEvents(kinds: NDKKind[], limit: number = 100): Promise<any[]> {
    const events = await fetchEvents({ kinds, limit, authors: [] });
    const rankedEvents = await rankEvents(events);
    return rankedEvents;
}

export async function getTrendingAndViralByEvents(events: NDKEvent[]): Promise<any[]> {
    const rankedEvents = await rankEvents(events);
    return rankedEvents;
}

// // Usage
// (async () => {
//     const trendingAndViralEvents = await getTrendingAndViralEvents(1);  // Example kind: 1 for text notes
//     console.log(trendingAndViralEvents);
// })();
