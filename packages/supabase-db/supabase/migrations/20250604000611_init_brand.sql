ALTER TABLE brand ADD COLUMN youtube_handle TEXT;
ALTER TABLE brand ADD COLUMN telegram_handle TEXT;
ALTER TABLE brand ADD COLUMN discord_handle TEXT;
ALTER TABLE brand ADD COLUMN facebook_handle TEXT;
ALTER TABLE brand ADD COLUMN linkedin_handle TEXT;
ALTER TABLE brand ADD COLUMN instagram_handle TEXT;
ALTER TABLE brand ADD COLUMN tiktok_handle TEXT;
ALTER TABLE brand ADD COLUMN reddit_handle TEXT;
ALTER TABLE brand ADD COLUMN twitter_handle TEXT;


ALTER TABLE leaderboard_stats ADD COLUMN user_votes JSONB DEFAULT '{}';
ALTER TABLE leaderboard_stats ADD COLUMN user_top_to_low TEXT[];
ALTER TABLE leaderboard_stats ADD COLUMN new_user TEXT[];



DELETE FROM leaderboard_stats;

DROP TABLE IF EXISTS leaderboard_stats CASCADE;

CREATE TABLE IF NOT EXISTS leaderboard_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brand(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    total_score DECIMAL(5,2) DEFAULT 0,
    rank_position INTEGER DEFAULT 0,
    previous_rank INTEGER DEFAULT 0,
    rank_change INTEGER DEFAULT 0,
    user_votes JSONB DEFAULT '{}',
    user_top_to_low TEXT[],
    new_user TEXT[],
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creator_ranks JSONB DEFAULT '[]',
    scraping_ranks JSONB DEFAULT '[]',
    UNIQUE(brand_id, platform)
);

-- Enable RLS on leaderboard_stats table
ALTER TABLE leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for leaderboard_stats
CREATE POLICY "Leaderboard stats are viewable by everyone" ON leaderboard_stats
    FOR SELECT USING (true);

CREATE POLICY "Leaderboard stats can be updated by system" ON leaderboard_stats
    FOR UPDATE USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_leaderboard_brand_id ON leaderboard_stats(brand_id);
CREATE INDEX idx_leaderboard_platform ON leaderboard_stats(platform);
CREATE INDEX idx_leaderboard_rank_position ON leaderboard_stats(rank_position);



-- Create leaderboard table for tracking user rankings
CREATE TABLE IF NOT EXISTS leaderboard_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brand(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    total_score DECIMAL(5,2) DEFAULT 0,
    rank_position INTEGER DEFAULT 0,
    previous_rank INTEGER DEFAULT 0,
    rank_change INTEGER DEFAULT 0,
    user_votes JSONB DEFAULT '{}',
    user_top_to_low TEXT[],
    new_user TEXT[],
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creator_ranks JSONB DEFAULT '[]', -- Array of creator rankings
    scraping_ranks JSONB DEFAULT '[]', -- Array of scraping rankings
    UNIQUE(creator_id, platform)
);



-- Insert default brand models for Starknet and Ethereum with social handles
INSERT INTO brand (
    name, 
    description, 
    slug_name, 
    owner_id, 
    starknet_address, 
    evm_address, 
    is_verified, 
    topics,
    twitter_handle,
    youtube_handle,
    telegram_handle,
    discord_handle,
    facebook_handle,
    linkedin_handle,
    instagram_handle,
    tiktok_handle,
    reddit_handle
)
VALUES 
    (
        'Starknet', 
        'Starknet is a Layer 2 scaling solution for Ethereum', 
        'starknet', 
        '1df7b58f-0390-417c-a0e0-a31af7b8620d', 
        '0x1234567890123456789012345678901234567890', 
        '0x1234567890123456789012345678901234567890', 
        true, 
        ARRAY['blockchain', 'ethereum', 'scaling'],
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet'
    ),
    (
        'Ethereum', 
        'Ethereum is a decentralized platform for building applications', 
        'ethereum', 
        '1df7b58f-0390-417c-a0e0-a31af7b8620d', 
        '0x1234567890123456789012345678901234567890', 
        '0x1234567890123456789012345678901234567890', 
        true, 
        ARRAY['blockchain', 'defi', 'nft'],
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum'
    );

-- Initialize leaderboard for Twitter
INSERT INTO leaderboard_stats (brand_id, platform, total_score, rank_position)
SELECT 
    b.id,
    'twitter'::social_platform,
    0,
    0
FROM brand b
WHERE b.name IN ('Starknet', 'Ethereum');
