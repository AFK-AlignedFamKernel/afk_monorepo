import prismaDb from "prisma-db"

export const getNostrNoteScoring = async () => {
    try {
        const profiles = await prismaDb.noteNostr.findMany({
           
    });

        return profiles;
    } catch (error) {
        console.error("Error in getNostrNoteScoring", error);
        return [];
    }
}

export const getNostrNoteByPubkey = async (pubkey: string) => {
    try {
        const profiles = await prismaDb.noteNostr.findMany({
            where: {
                pubkey: {
                    equals: pubkey   
                }
            }
        });
    
        return profiles;  
    } catch (error) {
        console.error("Error in getNostrNoteByPubkey", error);
        return [];
    }

}
