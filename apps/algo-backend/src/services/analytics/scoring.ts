import NDK, { NDKEvent, NDKRelay, NostrEvent, NDKKind } from '@nostr-dev-kit/ndk';



export const WEIGHT_INTERACTIONS_MINDSHARE = {
    "reaction": 1,
    "reply": 2.5,
    "bookmark": 1.1,
    "repost": 1.5,
    "quote": 1.25,
    "view": 1,
}


export const WEIGHT_INTERACTIONS_ENGAGEMENT = {
    "reaction": 1,
    "reply": 2,
    "bookmark": 1.75,
    "repost": 1.25,
    "quote": 1.25,
    "view": 1,

}

export const WEIGHT_INTERACTIONS_VIRALITY = {
    "reaction": 1,
    "reply": 2.5,
    "bookmark": 1.1,
    "repost": 1.5,
    "quote": 1.25,
    "view": 1,

}

export const WEIGHT_INTERACTIONS_TRENDING = {
    "reaction": 1.5,
    "reply": 2.5,
    "bookmark": 1.1,
    "repost": 1.5,
    "view": 1,

}

export const calculateRegularityScore = async (totalTweets: number, totalDays: number, totalPosts: number) => {
    const regularityScore = totalTweets / totalDays;
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

export interface InputMindshareScoreProfileRating {
    repostCount?: number;
    likeCount?: number;
    viewCount?: number;
    quoteCount?: number;
    replyCount?: number;
    followersCount?: number;
    followingCount?: number;
    bookmarkCount?: number;
}


export interface InputEngagementScore {
    repostCount?: number;
    likeCount?: number;
    viewCount?: number;
    quoteCount?: number;
    replyCount?: number;
    followersCount?: number;
    followingCount?: number;
    bookmarkCount?: number;
}

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

export const mindshareScore = async ({ repostCount, likeCount, viewCount, quoteCount, replyCount }: { repostCount: number, likeCount: number, viewCount: number, quoteCount: number, replyCount: number }) => {
    try {
        const mindshare = (repostCount * WEIGHT_INTERACTIONS_MINDSHARE.repost + likeCount * WEIGHT_INTERACTIONS_MINDSHARE.reaction + viewCount * WEIGHT_INTERACTIONS_MINDSHARE.bookmark + quoteCount * WEIGHT_INTERACTIONS_MINDSHARE.reply + replyCount * WEIGHT_INTERACTIONS_MINDSHARE.repost) / 5;
        return mindshare;
    } catch (error) {
        console.error('Error in mindshareScore', error);
        return 0;
    }

}



export const mindshareScoreProfileRating = ({
    repostCount = 0,
    likeCount = 0,
    viewCount = 0,
    quoteCount = 0,
    replyCount = 0,
    bookmarkCount = 0,
    followersCount = 0,
    followingCount = 0,
}: InputMindshareScoreProfileRating): { mindshareScoreProfileRating: number, mindshareScoreFollowers: number, mindshareScoreFollowing: number, mindshare: number, totalScore: number } => {
    try {
        const mindshare = (repostCount * WEIGHT_INTERACTIONS_MINDSHARE.repost +
            likeCount * WEIGHT_INTERACTIONS_MINDSHARE.reaction +
            viewCount * WEIGHT_INTERACTIONS_MINDSHARE.view +
            quoteCount * WEIGHT_INTERACTIONS_MINDSHARE.quote +
            replyCount * WEIGHT_INTERACTIONS_MINDSHARE.reply +
            bookmarkCount * WEIGHT_INTERACTIONS_MINDSHARE.bookmark +
            followersCount * WEIGHT_INTERACTIONS_MINDSHARE.repost) / 7;
        const mindshareScore = mindshare * 100;

        const mindshareScoreFollowers = followersCount * 100;

        const mindshareScoreFollowing = followingCount * 100;

        const mindshareScoreProfileRating = Math.min(mindshareScore, 100);

        const totalScore = mindshareScore + mindshareScoreFollowers + mindshareScoreFollowing;

        return {
            mindshareScoreProfileRating,
            mindshareScoreFollowers,
            mindshareScoreFollowing,
            mindshare,
            totalScore
        };
    } catch (error) {
        console.error('Error in mindshareScore with profile rating', error);
        return {
            mindshareScoreProfileRating: 0,
            mindshareScoreFollowers: 0,
            mindshareScoreFollowing: 0,
            mindshare: 0,
            totalScore: 0
        };
    }

}

export const engagementScoreProfileRating = ({
    repostCount = 0,
    likeCount = 0,
    viewCount = 0,
    quoteCount = 0,
    replyCount = 0,
    followersCount = 0,
    followingCount = 0,
    bookmarkCount = 0 }: InputEngagementScore): { engagementScore: number, engagementRate: number, engagementScoreFollowing: number, engagement: number, totalScore: number } => {
    try {

        // Calculate base engagement metrics with weighted interactions
        const baseEngagementScore = (
            repostCount * WEIGHT_INTERACTIONS_ENGAGEMENT.repost +
            likeCount * WEIGHT_INTERACTIONS_ENGAGEMENT.reaction +
            viewCount * WEIGHT_INTERACTIONS_ENGAGEMENT.view +
            quoteCount * WEIGHT_INTERACTIONS_ENGAGEMENT.quote +
            replyCount * WEIGHT_INTERACTIONS_ENGAGEMENT.reply +
            bookmarkCount * WEIGHT_INTERACTIONS_ENGAGEMENT.bookmark
        ) / 6; // Normalize by number of interaction types

        // Calculate follower engagement ratio (followers who interact)
        const followerEngagementRatio = followersCount > 0 
            ? (repostCount + likeCount + quoteCount + replyCount) / followersCount 
            : 0;

        // Calculate profile engagement score with diminishing returns
        const engagementScore = Math.min(baseEngagementScore * (1 + followerEngagementRatio), 100);

        // Calculate follower quality score (penalize for following too many)
        const followerQualityScore = followersCount > 0 && followingCount > 0
            ? Math.min((followersCount / followingCount) * 50, 100)
            : 0;

        // Calculate engagement rate (interactions per follower)
        const engagementRate = followersCount > 0
            ? ((repostCount + likeCount + quoteCount + replyCount) / followersCount) * 100
            : 0;

        // Combine scores with weighted importance
        const totalScore = (
            engagementScore * 0.4 +           // Base engagement
            followerQualityScore * 0.3 +      // Follower quality
            engagementRate * 0.3              // Engagement rate
        );

        const engagement = Math.min(totalScore, 100);

        const engagementScoreFollowing = ((repostCount + likeCount + quoteCount + replyCount) / followersCount)

        return {

            engagementScore,
            engagementRate,
            engagementScoreFollowing:engagement,
            engagement,
            totalScore
        };
    } catch (error) {
        console.error('Error in engagementScore', error);
        return {
            engagementScore: 0,
            engagementRate: 0,
            engagementScoreFollowing: 0,
            engagement: 0,
            totalScore: 0
        };
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



export const postingRegularityScore = async (events: NDKEvent[]) => {
    try {
        const timeDiffs = events.slice(1).map((post, i) => (post?.created_at ?? new Date().getTime() - 1000 * 60 * 60) - (events[i]?.created_at ?? new Date().getTime() - 1000 * 60 * 60 * 24));

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
        const recentPosts = events.filter(p => (p?.created_at ?? new Date().getTime() - 1000 * 60 * 60) >= thirtyDaysAgo).length;
        const mindshare = Math.min(recentPosts / 30, 1); // Max 1 post/day as full score
        return mindshare;
    } catch (error) {
        console.error('Error in maxPostingDayScore', error);
        return 0;
    }

}

