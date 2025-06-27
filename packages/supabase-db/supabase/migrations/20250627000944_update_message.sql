DELETE FROM messages;
TRUNCATE TABLE messages;
DROP TABLE messages;


CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id TEXT,
    group_provider TEXT,
    brand_id UUID REFERENCES brand(id) ON DELETE CASCADE,
    brand TEXT,
    community_name TEXT,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    text TEXT,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signature TEXT,
    pubkey TEXT,
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
