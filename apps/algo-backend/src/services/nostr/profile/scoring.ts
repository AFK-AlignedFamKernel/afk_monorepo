import NDK, { NDKEvent, NDKRelay, NostrEvent, NDKKind } from '@nostr-dev-kit/ndk';

import { fetchReactions, fetchReplies, fetchReposts, fetchBookmarks, fetchEvents } from '../utils';



export const WEIGHT_INTERACTIONS_VIRALITY = {
    "reaction": 1,
    "reply": 2.5,
    "bookmark": 1.1,
    "repost": 1.5,
}

export const WEIGHT_INTERACTIONS_TRENDING = {
    "reaction": 1.5,
    "reply": 2.5,
    "bookmark": 1.1,
    "repost": 1.5,

}

export const calculateRegularityScore = async (profileId: string, since: number) => {
    const events = await fetchEvents({
        kind: [NDKKind.Text, NDKKind.Article, NDKKind.VerticalVideo, NDKKind.HorizontalVideo],
        authors: [profileId],
        limit: 300,
        since
    });
    const regularityScore = events.length / 300;
    return regularityScore;
}


type Post = {
    content: string;
    timestamp: number; // Unix timestamp
};

type Profile = {
    npub: string;
    posts: Post[];
};

type ProfileScore = {
    postingRegularity?: 'Daily' | 'Weekly' | 'Irregular';
    maxDayPosting?: number;
    mindshare?: number; // 0–1
    profileQuality?: number; // 0–1
    copywritingScore?: number; // 0–1
    mainTopics?: string[];
    topicSkillEstimate?: Record<string, number>; // topic -> 0–1
    inferredMindset?: string[];
    sortedWords?: [string, number][];
};

export const postingRegularityScore = async (events: NDKEvent[]) => {
    try {
        const timeDiffs = events.slice(1).map((post, i) => (post?.created_at ?? new Date().getTime() - 1000 * 60 * 60 ) - (events[i]?.created_at ?? new Date().getTime() - 1000 * 60 * 60 * 24));

        // 1. Posting Regularity
        const avgInterval = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        const days = avgInterval / (1000 * 60 * 60 * 24);
        const postingRegularity =
            days <= 1.5 ? 'Daily' : days <= 7 ? 'Weekly' : 'Irregular';
    
        return postingRegularity;
    } catch (error) {
        console.error('Error in postingViralityScore', error);
        return 'Irregular';
    }

}

export const maxPostingDayScore = async (events: NDKEvent[]) => {
    try {
        const now = Date.now();
        // 2. Mindshare (posting density in the last 30 days)
        const thirtyDaysAgo = now - 1000 * 60 * 60 * 24 * 30;
        const recentPosts = events.filter(p => (p?.created_at ?? new Date().getTime() - 1000 * 60 * 60 ) >= thirtyDaysAgo).length;
        const mindshare = Math.min(recentPosts / 30, 1); // Max 1 post/day as full score
        return mindshare;
    } catch (error) {
        console.error('Error in maxPostingDayScore', error);
        return 0;
    }

}

export const mindshareScore = async (events: NDKEvent[]) => {
    try {
        const now = Date.now();
        const thirtyDaysAgo = now - 1000 * 60 * 60 * 24 * 30;
        const recentPosts = events.filter(p => (p?.created_at ?? new Date().getTime() - 1000 * 60 * 60 ) >= thirtyDaysAgo).length;
        const mindshare = Math.min(recentPosts / 30, 1); // Max 1 post/day as full score
        return mindshare;
    } catch (error) {
        console.error('Error in mindshareScore', error);
        return 0;
    }

}

export const profileQualityScore = async (events: NDKEvent[]) => {
    try {
        // 3. Profile Quality (based on post count, length, and variety)
        const avgLength = events.reduce((sum, p) => sum + p.content.length, 0) / events.length;
        const diversity = new Set(events.map(p => p.content.slice(0, 50))).size;
        const profileQuality = Math.min((events.length + avgLength / 100 + diversity / 10) / 10, 1);
        return profileQuality;
    } catch (error) {
        console.error('Error in profileQualityScore', error);
        return 0;
    }

}

export const copyWritingScore = async (events: NDKEvent[]) => {
    try {
        const punctuationDensity = events.reduce((acc, p) =>
            acc + (p.content.match(/[.!?]/g)?.length || 0), 0) / events.length;
        const hasEmoji = events.filter(p => /[\u{1F600}-\u{1F64F}]/u.test(p.content)).length;
        const hookStarters = events.filter(p => /^how|^what|^why|^did you|^imagine/i.test(p.content)).length;
        const copywritingScore = Math.min((punctuationDensity + hasEmoji + hookStarters) / events.length, 1);

        return copywritingScore;
    } catch (error) {
        console.error('Error in copyWritingScore', error);
        return 0;
    }

}

export const keywordFrequencyAndMainTopicsScore = async (events: NDKEvent[]) => {

    try {
        // 5. Main Topics (keyword frequency)
        const wordCounts: Record<string, number> = {};
        events.forEach(p => {
            p.content.toLowerCase().split(/\W+/).forEach(word => {
                if (word.length > 3) wordCounts[word] = (wordCounts[word] || 0) + 1;
            });
        });
        const sortedWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
        const mainTopics = sortedWords.slice(0, 5).map(([word]) => word);

        const topicSkillEstimate: Record<string, number> = {};
        mainTopics.forEach(topic => {
            const topicPosts = events.filter(p => p.content.toLowerCase().includes(topic));
            const consistency =
                topicPosts.length / events.length + topicPosts.length / sortedWords[0][1];
            topicSkillEstimate[topic] = Math.min(consistency / 2, 1); // Normalize
        });
        return {
            mainTopics,
            sortedWords,
            topicSkillEstimate
        };
    } catch (error) {
        console.error('Error in keywordFrequencyAndMainTopicsScore', error);
        return {
            mainTopics: [],
            sortedWords: [],
            topicSkillEstimate: {}
        };
    }

}

export const inferredMindsetAndPersonalityScore = async (events: NDKEvent[]) => {
    try {
        const inferredMindset: string[] = [];

        const positivity = events.filter(p => /grateful|blessed|awesome|love|growth/i.test(p.content)).length;
        const motivation = events.filter(p => /build|create|launch|learn|level up/i.test(p.content)).length;
        if (positivity > events.length * 0.2) inferredMindset.push('positive');
        if (motivation > events.length * 0.2) inferredMindset.push('builder');
        return {
            inferredMindset
        };
    } catch (error) {
        console.error('Error in inferredMindsetAndPersonalityScore', error);
        return {
            inferredMindset: []
        };
    }
}

/** Analyze a profile and return a score for different metrics */
export const analyzeProfile = async (profileId: string, events?: NDKEvent[], sinceProps?: number): Promise<ProfileScore> => {

    let posts = events;

    if(!events) {
        const fetchPosts = await fetchEvents({
            kind: [NDKKind.Text, NDKKind.Article, NDKKind.VerticalVideo, NDKKind.HorizontalVideo],
            authors: [profileId],
            limit: 300,
            since: sinceProps
        });
        posts = fetchPosts;
    }

    if(!posts) {
        return {
            postingRegularity: 'Irregular',
            maxDayPosting: 0,
            mindshare: 0,
            profileQuality: 0,
            copywritingScore: 0,
            mainTopics: [],
            topicSkillEstimate: {},
            inferredMindset: [],
            sortedWords: []
        };
    }

    // 1. Posting Regularity
    const postingRegularity = await postingRegularityScore(posts);

    const maxDayPosting = await maxPostingDayScore(posts);
    // 2. Mindshare (posting density in the last 30 days)
    const mindshare = await mindshareScore(posts);
    // 3. Profile Quality (based on post count, length, and variety)
    const profileQuality = await profileQualityScore(posts);
    // 4. Copywriting Skill (punctuation use, structure, emoji, hooks)
    const copywritingScore = await copyWritingScore(posts);
    // 5. Main Topics (keyword frequency)
    // Used LLM or NLP only for this one
    const { mainTopics, sortedWords, topicSkillEstimate } = await keywordFrequencyAndMainTopicsScore(posts);

    // 7. Inferred Mindset & Personality (basic heuristics)
    const { inferredMindset } = await inferredMindsetAndPersonalityScore(posts);

    return {
        postingRegularity,
        maxDayPosting,
        mindshare,
        profileQuality,
        copywritingScore,
        inferredMindset,

        // mainTopics,
        // topicSkillEstimate,
        // sortedWords
    };
};
