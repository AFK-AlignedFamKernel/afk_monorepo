import { getProfilesToAnalyzeOnchainIndexer } from "../db/indexer";
import { handleProfilesScoring, handleTrendingAndViralEvents } from "./algo-general";
import { externalTrendings } from "./content/trending";

export const NPUBKEY_EXAMPLE = "npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs"
export const handleScoringByUsersLinked = async () => {
    // const PUBKEY_EXAMPLE = nip19.decode(NPUBKEY_EXAMPLE).data;
    const PUBKEY_EXAMPLE = "c1e9ab3a56a2ab6ca4bebf44ea64b2fda40ac6311e886ba86b4652169cb56b43"
    const limit = 1;
    const limitEventsProfileScroring = 10;

    // Fetch profile to analyze
    const profiles = await getProfilesToAnalyzeOnchainIndexer();
    console.log("profiles", profiles);
    

    // // Get recent events from user to score and analyze
    // handleTrendingAndViralEvents({
    //     pubkey: PUBKEY_EXAMPLE,
    //     limit: limit,
    //     limitEventsProfileScroring: limitEventsProfileScroring
    // });

    // // Get recent events from user to score and analyze
    // handleTrendingAndViralEvents({
    //     pubkey: PUBKEY_EXAMPLE,
    //     limit: limit,
    //     limitEventsProfileScroring: limitEventsProfileScroring
    // });
    // setInterval(handleTrendingAndViralEvents, 1000 * 60 * 60 * 24);

    // const trending = await externalTrendings();
    // console.log(trending);

    handleProfilesScoring(PUBKEY_EXAMPLE);
    setInterval(handleProfilesScoring, 1000 * 60 * 60 * 24 * 7);


}


export const handleTrendingEvents = async () => {
    // setInterval(handleTrendingAndViralEvents, 1000 * 60 * 60 * 24);

    const trending = await externalTrendings();
    console.log("trending events from external", trending);

}




