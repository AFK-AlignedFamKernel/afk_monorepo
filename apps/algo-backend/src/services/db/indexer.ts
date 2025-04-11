import prisma from 'indexer-prisma';

export const getProfilesToAnalyzeOnchainIndexer = async () => {
    const profiles = await prisma.profile_data.findMany({
        where: {
            nostr_id: {
                not: null
            }
        }
    });

    return profiles;
}

