
ALTER TABLE content_creators ADD COLUMN solana_address TEXT;
ALTER TABLE content_creators ADD COLUMN starknet_address_verified TEXT;




-- Create analytics table for content creators
CREATE TABLE IF NOT EXISTS creator_scraping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform social_platform NOT NULL,
    mindshare_score DECIMAL(3,2),
    insight_value_score DECIMAL(3,2),
    regularity_score DECIMAL(3,2),
    clarity_score DECIMAL(3,2),
    storytelling_score DECIMAL(3,2),
    hook_conclusion_score DECIMAL(3,2),
    reputation_score DECIMAL(3,2),
    copywriting_score DECIMAL(3,2),
    topics_skills JSONB DEFAULT '{}',
    user_votes JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analytics_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    llm_classification JSONB DEFAULT '{}',
    llm_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    llm_process_data JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '{}',
    stats_creator JSONB DEFAULT '{}',
    stats_content JSONB DEFAULT '{}',
    rank_afk INTEGER DEFAULT 0,
    rank_afk_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform)
);

-- Enable RLS on creator_scraping table
ALTER TABLE creator_scraping ENABLE ROW LEVEL SECURITY;

-- Create policies for creator_scraping
CREATE POLICY "Enable read access for all users" ON creator_scraping
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON creator_scraping
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');


-- Create content creators table
CREATE TABLE IF NOT EXISTS brand (
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
    solana_address TEXT,
    starknet_address_verified TEXT,
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
    topics TEXT[],
    unverified_socials JSONB DEFAULT '{}',
    verified_socials JSONB DEFAULT '{}',
    nostr_address TEXT,
    lud_address TEXT,
    tokens_address TEXT[],
    creator_token TEXT
);

-- Enable Row Level Security
ALTER TABLE brand ENABLE ROW LEVEL SECURITY;

-- Create policies for brand
CREATE POLICY "Brands are viewable by everyone" ON brand
    FOR SELECT USING (true);

CREATE POLICY "Brands can be created by authenticated users" ON brand
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Brands can be updated by owner" ON brand
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Brands can be deleted by owner" ON brand
    FOR DELETE USING (auth.uid() = owner_id);

-- Create indexes for better performance
CREATE INDEX idx_brand_owner_id ON brand(owner_id);
CREATE INDEX idx_brand_created_at ON brand(created_at);
CREATE INDEX idx_brand_slug_name ON brand(slug_name);



-- Create leaderboard table for tracking user rankings
CREATE TABLE IF NOT EXISTS leaderboard_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES content_creators(id) ON DELETE CASCADE,
    scraping_id UUID REFERENCES creator_scraping(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    total_score DECIMAL(5,2) DEFAULT 0,
    rank_position INTEGER DEFAULT 0,
    previous_rank INTEGER DEFAULT 0,
    rank_change INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creator_ranks JSONB DEFAULT '[]', -- Array of creator rankings
    scraping_ranks JSONB DEFAULT '[]', -- Array of scraping rankings
    UNIQUE(creator_id, platform)
);

-- Enable RLS on leaderboard_stats table
ALTER TABLE leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for leaderboard_stats
CREATE POLICY "Leaderboard stats are viewable by everyone" ON leaderboard_stats
    FOR SELECT USING (true);

CREATE POLICY "Leaderboard stats can be updated by system" ON leaderboard_stats
    FOR UPDATE USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_leaderboard_creator_id ON leaderboard_stats(creator_id);
CREATE INDEX idx_leaderboard_scraping_id ON leaderboard_stats(scraping_id);
CREATE INDEX idx_leaderboard_platform ON leaderboard_stats(platform);
CREATE INDEX idx_leaderboard_rank_position ON leaderboard_stats(rank_position);
