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
