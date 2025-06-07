ALTER TABLE creator_analytics ADD COLUMN llm_classification JSONB DEFAULT '{}';
ALTER TABLE creator_analytics ADD COLUMN llm_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE creator_analytics ADD COLUMN llm_process_data JSONB DEFAULT '{}';
ALTER TABLE creator_analytics ADD COLUMN recommendations JSONB DEFAULT '{}';
ALTER TABLE creator_analytics ADD COLUMN stats_creator JSONB DEFAULT '{}';
ALTER TABLE creator_analytics ADD COLUMN stats_content JSONB DEFAULT '{}';
ALTER TABLE creator_analytics ADD COLUMN rank_afk INTEGER DEFAULT 0;
ALTER TABLE creator_analytics ADD COLUMN rank_afk_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE creator_analytics ADD COLUMN analytics_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
