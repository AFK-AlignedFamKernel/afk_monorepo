ALTER TABLE content_creators ADD COLUMN unverified_socials JSONB DEFAULT '{}';
ALTER TABLE content_creators ADD COLUMN verified_socials JSONB DEFAULT '{}';
ALTER TABLE content_creators ADD COLUMN nostr_address TEXT;
ALTER TABLE content_creators ADD COLUMN lud_address TEXT;
ALTER TABLE content_creators ADD COLUMN tokens_address TEXT[];
ALTER TABLE content_creators ADD COLUMN creator_token TEXT;