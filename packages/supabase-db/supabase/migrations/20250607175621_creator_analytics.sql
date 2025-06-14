ALTER TABLE creator_analytics ADD COLUMN classification_data JSONB[];
ALTER TABLE creator_analytics ADD COLUMN classification_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE creator_analytics ADD COLUMN socials_llm_classification JSONB[];
ALTER TABLE creator_analytics ADD COLUMN socials_scores JSONB[];
ALTER TABLE creator_analytics ADD COLUMN reputation_scores JSONB[];
ALTER TABLE creator_analytics ADD COLUMN reputation JSONB DEFAULT '{}';



ALTER TABLE creator_analytics ALTER COLUMN mindshare_score TYPE DECIMAL;
ALTER TABLE creator_analytics ALTER COLUMN insight_value_score TYPE DECIMAL;
ALTER TABLE creator_analytics ALTER COLUMN regularity_score TYPE DECIMAL;
ALTER TABLE creator_analytics ALTER COLUMN clarity_score TYPE DECIMAL;
ALTER TABLE creator_analytics ALTER COLUMN storytelling_score TYPE DECIMAL;
ALTER TABLE creator_analytics ALTER COLUMN hook_conclusion_score TYPE DECIMAL;
ALTER TABLE creator_analytics ALTER COLUMN reputation_score TYPE DECIMAL;
ALTER TABLE creator_analytics ALTER COLUMN copywriting_score TYPE DECIMAL;
ALTER TABLE creator_analytics ADD COLUMN topics TEXT[];
ALTER TABLE creator_analytics ADD COLUMN content_used JSONB[];