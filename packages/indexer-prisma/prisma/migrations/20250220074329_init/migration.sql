-- AlterTable
ALTER TABLE "token_deploy" ADD COLUMN     "description" TEXT,
ADD COLUMN     "ipfs_hash" TEXT,
ADD COLUMN     "ipfs_metadata_url" TEXT,
ADD COLUMN     "nostr_id" TEXT,
ADD COLUMN     "url" TEXT;
