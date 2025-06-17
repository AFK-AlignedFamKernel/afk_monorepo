import { supabaseAdmin } from ".";
import { ContentCreatorAnalytics } from "../analytics/content/contentCreatorAnalytics";
import { TwitterScraper } from "../scraper/twitterScraper";

export class ContentCreatorAnalyticsService {
    private twitterScraper: TwitterScraper;
    private contentCreatorAnalytics: ContentCreatorAnalytics;
    constructor(twitterScraper: TwitterScraper) {
        this.twitterScraper = twitterScraper;
        this.contentCreatorAnalytics = new ContentCreatorAnalytics(twitterScraper);
    }

    /** Loop between all content creators created on AFK
     * Get all identities and social links for one content creator
     * Twitter analaytics: Get twitter analytics using lib or apify
     * Create or update creator_analytics for this user
     * #TODO: Optimize the code, add other social networks
     */
    async handleAllContentCreatorsAnalytics() {

        if (!this.twitterScraper.isInitialized) {
            await this.twitterScraper.init({
                username: process.env.TWITTER_USERNAME ?? "",
                password: process.env.TWITTER_PASSWORD ?? "",
                email: process.env.TWITTER_EMAIL ?? "",
            })
        }

        const supabase = supabaseAdmin
        console.log("get all content creators");
        const { data, error } = await supabase.from('content_creators').select('*');
        console.log("error", error);


        console.log("all content creators data", data);
        if (error) {
            console.log("error", error);
            return;
        }


        for (let creator of data) {
            console.log("creator", creator);
            const creatorsIdentities = Object.values(creator?.identities).map((identity: any) => {
                // console.log("identity", identity);
                return identity;
            });

            const socialIdentities = Object.values(creator?.social_links).map((identity: any) => {
                // console.log("identity", identity);
                return identity;
            });
            // console.log("creatorsIdentities", creatorsIdentities);
            // console.log("socialIdentities", socialIdentities);


            let socials_llm_classification: any[] = [];
            let socials_scores: any[] = [];
            let reputation_scores: any[] = [];
            let reputation: any = {};
            let topics: string[] = [];

            let twitterAnalytics: any;

            if (creatorsIdentities && creatorsIdentities.length > 0) {

                for (let x of creatorsIdentities) {
                    console.log("x", x);
                    if (x.identity_data.provider === 'twitter') {
                        console.log("identity on twitter", x);

                        let user_name = x.identity_data.user_name ?? x?.user_name;

                        if (user_name) {
                            console.log("user_name twitter found", user_name);
                            let resultTwitterAnalytics: any;
                            twitterAnalytics = await this.contentCreatorAnalytics.getTwitterAnalytics(user_name);
                            console.log("twitterAnalytics processData", twitterAnalytics?.processData);
                            console.log("twitterAnalytics llm output", twitterAnalytics?.result);

                            if (!twitterAnalytics?.result) {
                                console.log("get twitter analytics apify");
                                twitterAnalytics = await this.contentCreatorAnalytics.getTwitterAnalyticsApify(user_name);
                                console.log("twitterAnalytics processData", twitterAnalytics?.processData);
                                console.log("twitterAnalytics llm output", twitterAnalytics?.result);
                            }
                            socials_llm_classification.push({
                                platform: 'twitter',
                                classification: twitterAnalytics?.result,
                                updated_at: new Date()
                            });
                            topics.push(twitterAnalytics?.result?.topics);
                      
                        }

                    }

                    if (x.identity_data.provider === 'discord') {
                        console.log("identity on discord", x);
                    }

                    if (x.identity_data.provider === 'youtube') {
                        console.log("identity on youtube", x);
                    }
                }

                const { data: dataCreator, error: errorCreator } = await supabase.from('creator_analytics').select('*').eq('creator_id', creator.id).eq('platform', 'twitter');
                // console.log("dataCreator exist", true);
                // console.log("errorCreator", errorCreator);
                console.log('Update or create the model of creator_analytics')
                if (dataCreator && dataCreator.length > 0 && errorCreator === null) {
                    // console.log("dataCreator exist", dataCreator);
                    // console.log("errorCreator exist", errorCreator);
                    const { data, error } = await supabase.from('creator_analytics').update({
                        llm_classification: twitterAnalytics?.result ?? dataCreator[0].llm_classification,
                        llm_process_data: twitterAnalytics?.processData ?? dataCreator[0].llm_process_data,
                        recommendations: twitterAnalytics?.recommendations ?? dataCreator[0].recommendations,
                        stats_creator: twitterAnalytics?.stats_creator ?? dataCreator[0].stats_creator,
                        stats_content: twitterAnalytics?.stats_content ?? dataCreator[0].stats_content,
                        socials_llm_classification: socials_llm_classification ?? dataCreator[0].socials_llm_classification,
                    }).eq('id', dataCreator[0].id).eq('creator_id', creator.id).eq('platform', 'twitter').select().single();
                    console.log("updated creator_analytics", data);
                    console.log("error", error);
                } else {
                    // console.log("dataCreator", dataCreator);
                    // console.log("errorCreator", errorCreator);
                    const { data, error } = await supabase.from('creator_analytics').upsert({
                        creator_id: creator.id,
                        platform: 'twitter',
                        llm_classification: twitterAnalytics?.result,
                        llm_process_data: twitterAnalytics?.processData,
                        recommendations: twitterAnalytics?.recommendations,
                        stats_creator: twitterAnalytics?.stats_creator,
                        stats_content: twitterAnalytics?.stats_content,
                        socials_llm_classification: socials_llm_classification,
                    }).select().single();
                }
            }


            if (socialIdentities && socialIdentities.length > 0) {
                for (let x of socialIdentities) {
                    // console.log("socialIdentities", x);
                }
            }
        }



    }

}


