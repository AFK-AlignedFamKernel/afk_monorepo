CREATE TYPE platform AS ENUM (
  'twitter', 'discord', 'telegram', 'medium', 'github', 'nostr', 'tiktok', 'youtube', 'instagram', 'facebook', 'linkedin', 'farcaster', 'lens', 'bluesky'
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
