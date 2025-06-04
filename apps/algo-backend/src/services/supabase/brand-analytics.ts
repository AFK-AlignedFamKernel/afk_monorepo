import { supabaseAdmin } from ".";
import ApifyService from "../apify/apifiy";
import { BrandAnalytics } from "../analytics/brand/brandAnalytics";

const brandAnalytics = new BrandAnalytics();

export const handleBrandAnalytics = async () => {

    const supabase = supabaseAdmin
    const { data, error } = await supabase.from('brand').select('*');
    console.log("data", data);
    console.log("error", error);

    const allBrands = data;

    if (error) {
        console.log("error", error);
        return;
    }

    console.log("allBrands", allBrands);

    for (let brand of data) {
        console.log("brand", brand);

        const twitterHandle = brand.twitter_handle;
        let twitterAnalytics: any;
        if (twitterHandle) {
            const result = await brandAnalytics.getTwitterAnalytics(twitterHandle);
            console.log("result twitter ", result?.usersScores?.length);
            console.log("result twitter users names ", result?.usersNamesScores);
            twitterAnalytics = result;

            const { data: leaderboard, error: errorLeaderboard } = await supabase.from('leaderboard_stats').select('*').eq('brand_id', brand.id).eq('platform', 'twitter').single();
            console.log("leaderboard", leaderboard);
            console.log("errorLeaderboard", errorLeaderboard);

            if (leaderboard && errorLeaderboard === null) {

                const { data: dataBrandUpdate, error: errorBrandUpdate } = await supabase.from('leaderboard').update({
                    users_scores: twitterAnalytics?.usersScores,
                    total_users: twitterAnalytics?.usersScores.length,
                    users_names_scores: twitterAnalytics?.usersNamesScores,
                }).eq('id', leaderboard.id).eq('brand_id', brand.id).eq('platform', 'twitter').select().single();

            } else {
                const { data, error } = await supabase.from('leaderboard_stats').upsert({
                    brand_id: brand.id,
                    platform: 'twitter',
                    users_scores: twitterAnalytics?.usersScores,
                    total_users: twitterAnalytics?.usersScores.length,
                    users_names_scores: twitterAnalytics?.usersNamesScores,
                }).select().single();
            }

            break;

        }

    }

}
