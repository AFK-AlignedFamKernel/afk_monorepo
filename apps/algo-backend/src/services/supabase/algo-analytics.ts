import { supabaseAdmin } from ".";
import { ContentCreatorAnalytics } from "../analytics/content/contentCreatorAnalytics";
import ApifyService from "../apify/apifiy";

const apify = new ApifyService();
const contentCreatorAnalytics = new ContentCreatorAnalytics();

export const NPUBKEY_EXAMPLE = "npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs"
export const handleAnalytics = async () => {

    const supabase = supabaseAdmin
    const { data, error } = await supabase.from('content_creators').select('*');
    console.log("data", data);
    console.log("error", error);

    const allContentCreators = data;

    if (error) {
        console.log("error", error);
        return;
    }

    console.log("allContentCreators", allContentCreators);

    for (let creator of data) {
        console.log("creator", creator);
        const creatorsIdentities = Object.values(creator?.identities).map((identity: any) => {
            console.log("identity", identity);
            return identity;
        });

        const socialIdentities = Object.values(creator?.social_links).map((identity: any) => {
            console.log("identity", identity);
            return identity;
        });
        console.log("creatorsIdentities", creatorsIdentities);
        console.log("socialIdentities", socialIdentities);

        if (creatorsIdentities && creatorsIdentities.length > 0) {

            for (let x of creatorsIdentities) {
                console.log("x", x);
                if (x.identity_data.provider === 'twitter') {
                    console.log("identity on twitter", x);


                    let user_name = x.identity_data.user_name ?? x?.user_name;
                
                    console.log("user_name", user_name);
                    const twitterAnalytics = await contentCreatorAnalytics.getTwitterAnalytics(user_name);
                    console.log("twitterAnalytics processData", twitterAnalytics?.processData);
                    console.log("twitterAnalytics llm output", twitterAnalytics?.result);

                    const { data: dataCreator, error: errorCreator } = await supabase.from('creator_analytics').select('*').eq('creator_id', creator.id).eq('platform', 'twitter');
                    console.log("dataCreator exist", true);
                    console.log("errorCreator", errorCreator);
                    if (dataCreator && dataCreator.length > 0 && errorCreator === null) {
                        console.log("dataCreator", dataCreator);
                        console.log("errorCreator", errorCreator);
                        const { data, error } = await supabase.from('creator_analytics').update({
                            llm_classification: twitterAnalytics?.result ?? dataCreator[0].llm_classification,
                            llm_process_data: twitterAnalytics?.processData ?? dataCreator[0].llm_process_data,
                            recommendations: twitterAnalytics?.recommendations ?? dataCreator[0].recommendations,
                            stats_creator: twitterAnalytics?.stats_creator ?? dataCreator[0].stats_creator,
                            stats_content: twitterAnalytics?.stats_content ?? dataCreator[0].stats_content,
                        }).eq('id', dataCreator[0].id).eq('creator_id', creator.id).eq('platform', 'twitter').select().single();
                        console.log("data", data);
                        console.log("error", error);
                    } else {
                        console.log("dataCreator", dataCreator);
                        console.log("errorCreator", errorCreator);
                        const { data, error } = await supabase.from('creator_analytics').upsert({
                            creator_id: creator.id,
                            platform: 'twitter',
                            llm_classification: twitterAnalytics?.result,
                            llm_process_data: twitterAnalytics?.processData,
                            recommendations: twitterAnalytics?.recommendations,
                            stats_creator: twitterAnalytics?.stats_creator,
                            stats_content: twitterAnalytics?.stats_content,
                        }).select().single();
                    }
             
                }

                if (x.identity_data.provider === 'discord') {
                    console.log("identity on discord", x);
                }

                if (x.identity_data.provider === 'youtube') {
                    console.log("identity on youtube", x);
                }
            }
        }


        if (socialIdentities && socialIdentities.length > 0) {
            for (let x of socialIdentities) {
                // console.log("socialIdentities", x);
            }
        }
    }



}
