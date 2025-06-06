import prisma from 'indexer-prisma';

export const getProfilesToAnalyzeOnchainIndexer = async () => {
    try {
        const profiles = await prisma.userProfile.findMany({
            where: {
                nostr_id: {
                // not: null
            }
        }
    });

        return profiles;
    } catch (error) {
        console.error("Error in getProfilesToAnalyzeOnchainIndexer", error);
        return [];
    }
}


