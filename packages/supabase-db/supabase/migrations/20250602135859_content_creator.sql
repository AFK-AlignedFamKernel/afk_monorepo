
-- Create content creators table
CREATE TABLE IF NOT EXISTS content_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    slug_name TEXT NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    starknet_address TEXT,
    evm_address TEXT,
    btc_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    identities JSONB DEFAULT '{}',
    token_address TEXT,
    nft_address TEXT,
    banner_url TEXT,
    avatar_url TEXT,
    website_url TEXT,
    bio TEXT,
    location TEXT,
    social_links JSONB DEFAULT '{}',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    topics TEXT[]
);

-- Enable Row Level Security
ALTER TABLE content_creators ENABLE ROW LEVEL SECURITY;

-- Create policies for content creators
CREATE POLICY "Content creators are viewable by everyone" ON content_creators
    FOR SELECT USING (true);

CREATE POLICY "Content creators can be created by authenticated users" ON content_creators
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Content creators can be updated by owner" ON content_creators
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Content creators can be deleted by owner" ON content_creators
    FOR DELETE USING (auth.uid() = owner_id);

-- Create indexes for better performance
CREATE INDEX idx_content_creators_owner_id ON content_creators(owner_id);
CREATE INDEX idx_content_creators_created_at ON content_creators(created_at);
CREATE INDEX idx_content_creators_slug_name ON content_creators(slug_name);

