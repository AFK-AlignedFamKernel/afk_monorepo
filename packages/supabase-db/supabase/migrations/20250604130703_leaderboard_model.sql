


DELETE FROM leaderboard_stats;

DROP TABLE IF EXISTS leaderboard_stats CASCADE;


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
