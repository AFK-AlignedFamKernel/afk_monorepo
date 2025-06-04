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
            twitterAnalytics = await brandAnalytics.getTwitterAnalytics(twitterHandle);
        }

      

    }


}
