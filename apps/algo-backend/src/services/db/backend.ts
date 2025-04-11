import prismaDb from "prisma-db"

export const getNostrNoteScoring = async () => {
    const profiles = await prismaDb.noteNostr.findMany({
       
    });

    return profiles;
}

export const getNostrNoteByPubkey = async (pubkey: string) => {
    const profiles = await prismaDb.noteNostr.findMany({
        where: {
            pubkey: {
                equals: pubkey   
            }
        }
    });

    return profiles;
}
