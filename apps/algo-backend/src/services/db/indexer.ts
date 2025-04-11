import prisma from 'indexer-prisma';

export const getProfilesToAnalyze = async () => {
    const profiles = await prisma.profile_data.findMany({
        where: {
            nostr_pubkey: {
                not: null
            }
        }
    });

    return profiles;
}