

-- Create table for content creators
CREATE TABLE IF NOT EXISTS content_scraped (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT,
    link TEXT,
    medias TEXT[],
    media TEXT,
    id_platform TEXT,
    platform TEXT,
    username_platform TEXT,
    -- embeddedings vector(1024),
    is_creator_afk BOOLEAN NOT NULL DEFAULT false,
    is_brand_afk BOOLEAN NOT NULL DEFAULT false,
    creator_id UUID REFERENCES content_creators(id) NULL,
    brand_id UUID REFERENCES brand(id) NULL,
    mentions_id TEXT[],
    metadata JSONB DEFAULT '{}',
    platform_id TEXT,
    content_type TEXT,
    content_url TEXT,
    content_id TEXT,
    content_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
    is_active BOOLEAN NOT NULL DEFAULT true,
    identities JSONB DEFAULT '{}'
);

CREATE POLICY "Content scraped are viewable by everyone" ON content_scraped
    FOR SELECT USING (true);

CREATE POLICY "Content scraped can be created by authenticated users" ON content_scraped
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CREATE POLICY "Content scraped can be updated by owner" ON content_scraped
--     FOR UPDATE USING (auth.uid() = owner_id);

-- CREATE POLICY "Content scraped can be deleted by owner" ON content_scraped  

ALTER TABLE creator_analytics ADD COLUMN IF NOT EXISTS content_scraped JSONB[];