import { supabaseAdmin } from ".";
import { TwitterAnalytics } from "../analytics/brand/twitterAnalytics";
import { TwitterScraper } from "../scraper/twitterScraper";

import dotenv from "dotenv";
dotenv.config();


export class BrandAnalyticsService {
    private twitterScraper: TwitterScraper;
    private twitterAnalysis: TwitterAnalytics;
    private twitterUsername: string;
    constructor(twitterScraper: TwitterScraper) {
        this.twitterScraper = twitterScraper;
        this.twitterAnalysis = new TwitterAnalytics(twitterScraper);
    }

    /** Loop between all brands created on AFK
     * Get all brands
     * Twitter rank: Get twitter analytics using lib or apify
     * Update leaderboard_stats
     * #TODO: Optimize the code, add other social networks. Optimize algo of Ranking/Reputation
    */
    async getAllBrandsAnalytics(): Promise<{
        dataUser?: any,
        xKaito?: any,
        twitter?: any,
        result?: any[],
    } | null | undefined> {

        try {
            const supabase = supabaseAdmin
            const { data: allBrands, error } = await supabase.from('brand').select('*');
            console.log("allBrands", allBrands);
            console.log("error", error);

            if (error) {
                console.log("error", error);
                return;
            }

            for (let brand of allBrands) {
                console.log("brand", brand);

                const twitterHandle = brand.twitter_handle;
                let resultTwitterAnalytics: any;
                if (twitterHandle) {
                    let result = await this.twitterAnalysis.getTwitterAnalytics(twitterHandle);
                    // console.log("result twitter analytics", result);
                    if (!result || result?.usersScores?.length === 0) {
                        console.log("get twitter analytics apify");
                        result = await this.twitterAnalysis.getTwitterAnalyticsApify(twitterHandle);
                    }
                    console.log("len twitter scores", result?.usersScores?.length);
                    console.log("len twitter users names ", result?.usersNamesScores?.length);
                    // console.log("result twitter usersScores ", result?.usersScores);
                    console.log("result twitter users names ", result?.usersNamesScores);
                    resultTwitterAnalytics = result;
                    const { data: leaderboard, error: errorLeaderboard } = await supabase.from('leaderboard_stats').select('*').eq('brand_id', brand.id).eq('platform', 'twitter').single();
                    console.log("leaderboard", leaderboard);
                    console.log("errorLeaderboard", errorLeaderboard);

                    if (leaderboard && errorLeaderboard === null) {

                        console.log("update leaderboard");

                        const { data: dataLeaderboardUpdate, error: errorLeaderboardUpdate } = await supabase.from('leaderboard_stats').update({
                            users_scores: resultTwitterAnalytics?.usersScores ?? [],
                            total_users: resultTwitterAnalytics?.usersScores.length,
                            users_names: resultTwitterAnalytics?.usersNamesScores ?? [],
                            total_mindshare_score: resultTwitterAnalytics?.totalMindshareScore ?? 0,
                            total_engagement_score: resultTwitterAnalytics?.totalEngagementScore ?? 0,
                            total_quality_score: resultTwitterAnalytics?.totalQualityScore ?? 0,

                        }).eq('id', leaderboard.id).eq('brand_id', brand.id).eq('platform', 'twitter').select().single();

                        console.log("dataLeaderboardUpdate", dataLeaderboardUpdate);
                        console.log("errorLeaderboardUpdate", errorLeaderboardUpdate);
                    } else {
                        console.log("upsert leaderboard");

                        const { data, error } = await supabase.from('leaderboard_stats').upsert({
                            brand_id: brand.id,
                            platform: 'twitter',
                            total_mindshare_score: resultTwitterAnalytics?.totalMindshareScore ?? 0,
                            total_engagement_score: resultTwitterAnalytics?.totalEngagementScore ?? 0,
                            total_quality_score: resultTwitterAnalytics?.totalQualityScore ?? 0,
                            users_scores: resultTwitterAnalytics?.usersScores ?? [],
                            total_users: resultTwitterAnalytics?.usersScores.length,
                            users_names: resultTwitterAnalytics?.usersNamesScores ?? [],
                        }).select().single();
                    }

                }
                // break;

            }
        } catch (error) {
            console.log("error", error);
            return null;
        }


    }
}

export const handleBrandAnalytics = async () => {



}
