ALTER TABLE brand ADD COLUMN IF NOT EXISTS content_scraped JSONB[];
ALTER TABLE brand ADD COLUMN IF NOT EXISTS content_linked JSONB[];
ALTER TABLE brand ADD COLUMN IF NOT EXISTS links TEXT[];



ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS content_scraped JSONB[];
ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS content_linked JSONB[];
ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS links TEXT[];
