import { createClient } from "@supabase/supabase-js";
import { getProfilesToAnalyzeOnchainIndexer } from "../db/indexer";
import { handleProfilesScoring, handleTrendingAndViralEvents } from "../nostr/algo-general";
import { externalTrendings } from "../nostr/content/trending";
import { supabaseAdmin } from ".";


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
                }

                if (x.identity_data.provider === 'discord') {
                    console.log("identity on discord", x);
                }

                if (x.identity_data.provider === 'youtube') {
                    console.log("identity on youtube", x);
                }
            }
        }


        if(socialIdentities && socialIdentities.length > 0) {
            for(let x of socialIdentities) {
                // console.log("socialIdentities", x);
            }
        }
    }



}
