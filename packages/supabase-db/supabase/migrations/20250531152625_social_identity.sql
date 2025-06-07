
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