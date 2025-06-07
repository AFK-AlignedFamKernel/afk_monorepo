
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
