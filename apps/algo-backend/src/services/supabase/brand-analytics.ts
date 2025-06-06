import { supabaseAdmin } from ".";
import ApifyService from "../apify/apifiy";
import { BrandAnalytics } from "../analytics/brand/brandAnalytics";
import { TwitterAnalytics } from "../analytics/brand/twitterAnalytics";

const brandAnalytics = new BrandAnalytics();
const twitterAnalysis = new TwitterAnalytics();

export const handleBrandAnalytics = async () => {

    const supabase = supabaseAdmin
    const { data:allBrands, error } = await supabase.from('brand').select('*');
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
            let result = await twitterAnalysis.getTwitterAnalytics(twitterHandle);
            console.log("result twitter analytics", result);
            if (!result || result?.usersScores?.length === 0) {
                console.log("get twitter analytics apify");
                result = await twitterAnalysis.getTwitterAnalyticsApify(twitterHandle);
            }
            console.log("len twitter scores", result?.usersScores?.length);
            console.log("len twitter users names ", result?.usersNamesScores?.length);
            console.log("result twitter usersScores ", result?.usersScores);
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

    }

}
