


CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    slug_name TEXT NOT NULL UNIQUE,
    nostr_id TEXT,
    nostr_id_group TEXT,
    metadata JSONB DEFAULT '{}',
    logo_url TEXT,
    banner_url TEXT,
    website_url TEXT,
    twitter_handle TEXT,
    youtube_handle TEXT,
    tiktok_handle TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

    -- Enable Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Create policies for communities
CREATE POLICY "Communities are viewable by everyone" ON communities
    FOR SELECT USING (true);

CREATE POLICY "Communities can be updated by owner" ON communities
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Communities can be deleted by owner" ON communities
    FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id TEXT NOT NULL,
    group_provider TEXT NOT NULL,
    brand_id UUID REFERENCES brand(id) ON DELETE CASCADE,
    brand TEXT,
    community_name TEXT,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signature TEXT NOT NULL,
    pubkey TEXT NOT NULL,
    internal BOOLEAN NOT NULL DEFAULT false,
    likes INTEGER NOT NULL DEFAULT 0,
    tweeted BOOLEAN NOT NULL DEFAULT false,
    parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    reply_count INTEGER NOT NULL DEFAULT 0,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Messages are viewable by everyone" ON messages
    FOR SELECT USING (true);

CREATE POLICY "Messages can be updated by owner" ON messages
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Messages can be deleted by owner" ON messages
    FOR DELETE USING (auth.uid() = owner_id);


INSERT INTO communities (name, slug_name, owner_id) VALUES ('crypto', 'crypto', '281ea7a2-9cb5-448a-8529-34ea629a229d');
INSERT INTO communities (name, slug_name, owner_id) VALUES ('finance', 'finance', '281ea7a2-9cb5-448a-8529-34ea629a229d');
INSERT INTO communities (name, slug_name, owner_id) VALUES ('technology', 'technology', '281ea7a2-9cb5-448a-8529-34ea629a229d');
INSERT INTO communities (name, slug_name, owner_id) VALUES ('science', 'science', '281ea7a2-9cb5-448a-8529-34ea629a229d');

