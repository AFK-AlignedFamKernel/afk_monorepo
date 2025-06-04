-- Enable Row Level Security
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';
-- Drop existing tables if they exist


-- Create enum for social media platforms
CREATE TYPE social_platform AS ENUM ('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'discord', 'telegram');

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
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
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create shop admins table
CREATE TABLE IF NOT EXISTS shop_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(shop_id, user_id)
);

-- Create shop socials table
CREATE TABLE IF NOT EXISTS shop_socials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    url TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(shop_id, platform)
);

-- Create shop products table
CREATE TABLE IF NOT EXISTS shop_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_socials ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

-- Create policies for shops
CREATE POLICY "Shops are viewable by everyone" ON shops
    FOR SELECT USING (true);

CREATE POLICY "Shops can be created by authenticated users" ON shops
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shops can be updated by owner and admins" ON shops
    FOR UPDATE USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM shop_admins 
            WHERE shop_id = shops.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Shops can be deleted by owner only" ON shops
    FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for shop admins
CREATE POLICY "Shop admins are viewable by everyone" ON shop_admins
    FOR SELECT USING (true);

CREATE POLICY "Shop admins can be managed by shop owner" ON shop_admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE id = shop_admins.shop_id AND owner_id = auth.uid()
        )
    );

-- Create policies for shop socials
CREATE POLICY "Shop socials are viewable by everyone" ON shop_socials
    FOR SELECT USING (true);

CREATE POLICY "Shop socials can be managed by owner and admins" ON shop_socials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE id = shop_socials.shop_id AND owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM shop_admins 
            WHERE shop_id = shop_socials.shop_id AND user_id = auth.uid()
        )
    );

-- Create policies for shop products
CREATE POLICY "Shop products are viewable by everyone" ON shop_products
    FOR SELECT USING (true);

CREATE POLICY "Shop products can be managed by owner and admins" ON shop_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE id = shop_products.shop_id AND owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM shop_admins 
            WHERE shop_id = shop_products.shop_id AND user_id = auth.uid()
        )
    );

-- Create social profiles table for aggregated social identity
CREATE TABLE social_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- Create social connections table for platform-specific data
CREATE TABLE social_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES social_profiles(id) ON DELETE CASCADE NOT NULL,
    platform platform NOT NULL,
    platform_user_id TEXT NOT NULL,
    platform_username TEXT NOT NULL,
    platform_access_token TEXT,
    platform_refresh_token TEXT,
    platform_token_expires_at TIMESTAMP WITH TIME ZONE,
    platform_data JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    contract_address TEXT,
    UNIQUE(profile_id, platform)
);

-- Enable Row Level Security
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for social profiles
CREATE POLICY "Social profiles are viewable by owner and public ones" ON social_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR is_public = true
    );

CREATE POLICY "Users can manage their own social profiles" ON social_profiles
    FOR ALL USING (
        auth.uid() = user_id
    );

-- Create policies for social connections
CREATE POLICY "Social connections are viewable by profile owner" ON social_connections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM social_profiles 
            WHERE id = social_connections.profile_id 
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

CREATE POLICY "Users can manage their own social connections" ON social_connections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM social_profiles 
            WHERE id = social_connections.profile_id 
            AND user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_social_profiles_user_id ON social_profiles(user_id);
CREATE INDEX idx_social_connections_profile_id ON social_connections(profile_id);
CREATE INDEX idx_social_connections_platform ON social_connections(platform);



-- Create indexes for better performance
CREATE INDEX idx_shops_owner_id ON shops(owner_id);
CREATE INDEX idx_shops_slug_name ON shops(slug_name);
CREATE INDEX idx_shop_admins_shop_id ON shop_admins(shop_id);
CREATE INDEX idx_shop_admins_user_id ON shop_admins(user_id);
CREATE INDEX idx_shop_socials_shop_id ON shop_socials(shop_id);
CREATE INDEX idx_shop_products_shop_id ON shop_products(shop_id);

-- Create enum types for mission
CREATE TYPE reward_type AS ENUM ('XP', 'Badge', 'Tip', 'Token', 'Visibility');
CREATE TYPE creator_type AS ENUM ('Brand', 'Admin', 'User');
CREATE TYPE platform AS ENUM (
  'twitter', 'discord', 'telegram', 'medium', 'github', 'nostr', 'tiktok', 'youtube', 'instagram', 'facebook', 'linkedin', 'farcaster', 'lens', 'bluesky'
);

-- Create missions table
CREATE TABLE missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] NOT NULL,
    reward_type reward_type NOT NULL,
    creator_type creator_type NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    topics TEXT[] NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    platforms platform[] NOT NULL,
    keywords TEXT[] NOT NULL,
    escrow_address TEXT NOT NULL,
    amount_rewards INT,
    token_address TEXT
);

-- Create mission submissions table
CREATE TABLE mission_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(mission_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for missions
CREATE POLICY "Missions are viewable by everyone" ON missions
    FOR SELECT USING (true);

CREATE POLICY "Missions can be managed by owner" ON missions
    FOR ALL USING (owner_id = auth.uid());

-- Create policies for mission submissions
CREATE POLICY "Submissions are viewable by everyone" ON mission_submissions
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own submissions" ON mission_submissions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own submissions" ON mission_submissions
    FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_missions_owner_id ON missions(owner_id);
CREATE INDEX idx_missions_created_at ON missions(created_at);
CREATE INDEX idx_missions_deadline ON missions(deadline);
CREATE INDEX idx_mission_submissions_mission_id ON mission_submissions(mission_id);
CREATE INDEX idx_mission_submissions_user_id ON mission_submissions(user_id);




-- Create enum for social media platforms
CREATE TYPE social_platform AS ENUM ('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'discord', 'telegram');

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


-- Create social identities table
CREATE TABLE IF NOT EXISTS social_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,  -- e.g., 'twitter', 'github', 'farcaster'
    handle TEXT NOT NULL,    -- e.g., '@gms', 'github.com/gms'
    proof_url TEXT,          -- e.g., tweet/gist/nostr note link
    verified BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, platform, handle)
);

CREATE TABLE IF NOT EXISTS identity_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    linked_to_user UUID REFERENCES auth.users(id),
    claim_status TEXT NOT NULL DEFAULT 'open', -- 'open', 'pending', 'claimed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform, handle)
);

-- Enable Row Level Security
ALTER TABLE social_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_claims ENABLE ROW LEVEL SECURITY;

-- Create policies for social_identities
CREATE POLICY "Social identities are viewable by owner and verified ones" ON social_identities
    FOR SELECT USING (
        auth.uid() = user_id OR verified = true
    );

CREATE POLICY "Users can manage their own social identities" ON social_identities
    FOR ALL USING (
        auth.uid() = user_id
    );

-- Create policies for identity_claims
CREATE POLICY "Identity claims are viewable by everyone" ON identity_claims
    FOR SELECT USING (true);

CREATE POLICY "Users can create identity claims" ON identity_claims
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own identity claims" ON identity_claims
    FOR UPDATE USING (
        linked_to_user = auth.uid()
    );

-- Create indexes for better performance
CREATE INDEX idx_social_identities_user_id ON social_identities(user_id);
CREATE INDEX idx_social_identities_platform ON social_identities(platform);
CREATE INDEX idx_identity_claims_platform ON identity_claims(platform);
CREATE INDEX idx_identity_claims_linked_to_user ON identity_claims(linked_to_user);



-- Create table for social verification codes
CREATE TABLE IF NOT EXISTS social_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE social_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for social_verification_codes
CREATE POLICY "Users can view their own verification codes" ON social_verification_codes
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can create verification codes" ON social_verification_codes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update their own verification codes" ON social_verification_codes
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Create indexes
CREATE INDEX idx_social_verification_codes_user_id ON social_verification_codes(user_id);
CREATE INDEX idx_social_verification_codes_platform ON social_verification_codes(platform);
CREATE INDEX idx_social_verification_codes_code ON social_verification_codes(verification_code);

-- Function to generate verification code
CREATE OR REPLACE FUNCTION generate_social_verification_code(
    p_user_id UUID,
    p_platform TEXT,
    p_handle TEXT
) RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
BEGIN
    -- Generate a random code (6 characters)
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Insert or update verification code
    INSERT INTO social_verification_codes (user_id, platform, handle, verification_code)
    VALUES (p_user_id, p_platform, p_handle, v_code)
    ON CONFLICT (user_id, platform) 
    DO UPDATE SET 
        verification_code = v_code,
        is_verified = false,
        created_at = NOW(),
        expires_at = NOW() + INTERVAL '24 hours';
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify social identity
CREATE OR REPLACE FUNCTION verify_social_identity(
    p_user_id UUID,
    p_platform TEXT,
    p_handle TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_verified BOOLEAN;
BEGIN
    -- Update verification status
    UPDATE social_verification_codes
    SET is_verified = true
    WHERE user_id = p_user_id 
    AND platform = p_platform 
    AND handle = p_handle
    AND is_verified = false
    RETURNING true INTO v_verified;
    
    -- If verified, update content_creators table
    IF v_verified THEN
        UPDATE content_creators
        SET social_links = jsonb_set(
            COALESCE(social_links, '{}'::jsonb),
            array[p_platform],
            jsonb_build_object('handle', p_handle, 'verified', true)
        )
        WHERE id = p_user_id;
    END IF;
    
    RETURN COALESCE(v_verified, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;





-- Create analytics table for content creators
CREATE TABLE IF NOT EXISTS creator_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES content_creators(id) ON DELETE CASCADE,
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
    UNIQUE(creator_id, platform)
);

-- Create analytics history table to track score changes over time
CREATE TABLE IF NOT EXISTS creator_analytics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analytics_id UUID REFERENCES creator_analytics(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    mindshare_score DECIMAL(3,2),
    insight_value_score DECIMAL(3,2),
    regularity_score DECIMAL(3,2),
    clarity_score DECIMAL(3,2),
    storytelling_score DECIMAL(3,2),
    hook_conclusion_score DECIMAL(3,2),
    reputation_score DECIMAL(3,2),
    copywriting_score DECIMAL(3,2),
    topics_skills JSONB,
    user_votes JSONB,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Enable RLS on creator_analytics table
ALTER TABLE creator_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for creator_analytics
CREATE POLICY "Enable read access for all users" ON creator_analytics
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON creator_analytics
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for content creators" ON creator_analytics
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM content_creators
            WHERE content_creators.id = creator_analytics.creator_id
            AND content_creators.owner_id = auth.uid()
        )
    );

-- Enable RLS on creator_analytics_history table
ALTER TABLE creator_analytics_history ENABLE ROW LEVEL SECURITY;

-- Create policies for creator_analytics_history
CREATE POLICY "Enable read access for all users" ON creator_analytics_history
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON creator_analytics_history
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for content creators" ON creator_analytics_history
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM content_creators
            WHERE content_creators.id = (
                SELECT creator_id FROM creator_analytics
                WHERE creator_analytics.id = creator_analytics_history.analytics_id
            )
            AND content_creators.owner_id = auth.uid()
        )
    );


-- Create function to update analytics scores
CREATE OR REPLACE FUNCTION update_creator_analytics(
    p_creator_id UUID,
    p_platform social_platform,
    p_scores JSONB
) RETURNS VOID AS $$
BEGIN
    -- Insert or update analytics
    INSERT INTO creator_analytics (
        creator_id,
        platform,
        mindshare_score,
        insight_value_score,
        regularity_score,
        clarity_score,
        storytelling_score,
        hook_conclusion_score,
        reputation_score,
        copywriting_score,
        topics_skills,
        last_updated
    )
    VALUES (
        p_creator_id,
        p_platform,
        (p_scores->>'mindshare_score')::DECIMAL,
        (p_scores->>'insight_value_score')::DECIMAL,
        (p_scores->>'regularity_score')::DECIMAL,
        (p_scores->>'clarity_score')::DECIMAL,
        (p_scores->>'storytelling_score')::DECIMAL,
        (p_scores->>'hook_conclusion_score')::DECIMAL,
        (p_scores->>'reputation_score')::DECIMAL,
        (p_scores->>'copywriting_score')::DECIMAL,
        p_scores->'topics_skills',
        NOW()
    )
    ON CONFLICT (creator_id, platform) DO UPDATE
    SET
        mindshare_score = EXCLUDED.mindshare_score,
        insight_value_score = EXCLUDED.insight_value_score,
        regularity_score = EXCLUDED.regularity_score,
        clarity_score = EXCLUDED.clarity_score,
        storytelling_score = EXCLUDED.storytelling_score,
        hook_conclusion_score = EXCLUDED.hook_conclusion_score,
        reputation_score = EXCLUDED.reputation_score,
        copywriting_score = EXCLUDED.copywriting_score,
        topics_skills = EXCLUDED.topics_skills,
        last_updated = NOW();

    -- Record history
    INSERT INTO creator_analytics_history (
        analytics_id,
        platform,
        mindshare_score,
        insight_value_score,
        regularity_score,
        clarity_score,
        storytelling_score,
        hook_conclusion_score,
        reputation_score,
        copywriting_score,
        topics_skills,
        user_votes
    )
    SELECT 
        id,
        platform,
        mindshare_score,
        insight_value_score,
        regularity_score,
        clarity_score,
        storytelling_score,
        hook_conclusion_score,
        reputation_score,
        copywriting_score,
        topics_skills,
        user_votes
    FROM creator_analytics
    WHERE creator_id = p_creator_id AND platform = p_platform;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record user votes
CREATE OR REPLACE FUNCTION record_user_vote(
    p_creator_id UUID,
    p_platform social_platform,
    p_user_id UUID,
    p_topic TEXT,
    p_score INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE creator_analytics
    SET user_votes = jsonb_set(
        COALESCE(user_votes, '{}'::jsonb),
        array[p_topic],
        jsonb_build_object(
            'votes', COALESCE((user_votes->p_topic->>'votes')::INTEGER, 0) + 1,
            'total_score', COALESCE((user_votes->p_topic->>'total_score')::INTEGER, 0) + p_score,
            'last_vote_at', NOW()
        )
    )
    WHERE creator_id = p_creator_id AND platform = p_platform;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;





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
    twitter_handle TEXT,
    youtube_handle TEXT,
    tiktok_handle TEXT,
    reddit_handle TEXT,
    telegram_handle TEXT,
    discord_handle TEXT,
    facebook_handle TEXT,
    linkedin_handle TEXT,
    instagram_handle TEXT,
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
    brand_id UUID REFERENCES brand(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    total_score DECIMAL(5,2) DEFAULT 0,
    rank_position INTEGER DEFAULT 0,
    previous_rank INTEGER DEFAULT 0,
    rank_change INTEGER DEFAULT 0,
    user_votes JSONB DEFAULT '{}',
    user_top TEXT[],
    user_rank JSONB DEFAULT '{}',
    data_user_stats JSONB DEFAULT '{}',
    new_user TEXT[],
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    users TEXT[],
    users_scores JSONB[],
    users_names TEXT[],
    total_users INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creator_ranks JSONB DEFAULT '[]', -- Array of creator rankings
    scraping_ranks JSONB DEFAULT '[]', -- Array of scraping rankings
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
CREATE INDEX idx_leaderboard_platform ON leaderboard_stats(platform);
CREATE INDEX idx_leaderboard_rank_position ON leaderboard_stats(rank_position);
