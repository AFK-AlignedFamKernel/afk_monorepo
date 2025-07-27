CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    author_id TEXT,
    kind INTEGER,
    content TEXT,
    raw_json JSONB, 
    created_at TIMESTAMP,
    score JSONB
);

CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    note_id TEXT REFERENCES notes(id),
    reactor_id TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zaps (
    id TEXT PRIMARY KEY,
    note_id TEXT REFERENCES notes(id),
    zapper_id TEXT,
    amount BIGINT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    note_id TEXT REFERENCES notes(id),
    commenter_id TEXT,
    content TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follows (
    pubkey TEXT,
    follow_id TEXT
);

CREATE TABLE IF NOT EXISTS pubkey_settings (
    pubkey TEXT PRIMARY KEY,
    settings JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS viral_notes (
    id TEXT PRIMARY KEY,
    author_id TEXT,
    kind INTEGER,
    content TEXT,
    raw_json JSONB, 
    created_at TIMESTAMP,
    score_virality JSONB,
    score_author JSONB
);


CREATE TABLE IF NOT EXISTS author (
    id TEXT PRIMARY KEY,
    viral_note_id TEXT REFERENCES viral_notes(id),
    author_id TEXT,
    created_at TIMESTAMP,
    score_author JSONB
);

CREATE INDEX IF NOT EXISTS idx_notes_author_id ON notes(author_id);
CREATE INDEX IF NOT EXISTS idx_notes_kind ON notes(kind);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

CREATE INDEX IF NOT EXISTS idx_reactions_note_id ON reactions(note_id);
CREATE INDEX IF NOT EXISTS idx_reactions_reactor_id ON reactions(reactor_id);
CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions(created_at);

CREATE INDEX IF NOT EXISTS idx_zaps_note_id ON zaps(note_id);
CREATE INDEX IF NOT EXISTS idx_zaps_zapper_id ON zaps(zapper_id);
CREATE INDEX IF NOT EXISTS idx_zaps_amount ON zaps(amount);
CREATE INDEX IF NOT EXISTS idx_zaps_created_at ON zaps(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_note_id ON comments(note_id);
CREATE INDEX IF NOT EXISTS idx_comments_commenter_id ON comments(commenter_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

CREATE INDEX IF NOT EXISTS idx_follows_pubkey ON follows(pubkey);
CREATE INDEX IF NOT EXISTS idx_follows_follow_id ON follows(follow_id);


-- Create table for scraped notes
CREATE TABLE IF NOT EXISTS scraped_notes (
    id TEXT PRIMARY KEY,
    author_id TEXT,
    kind INTEGER,
    content TEXT,
    raw_json JSONB,
    created_at TIMESTAMP,
    scraped_at TIMESTAMP DEFAULT NOW(),
    interaction_score INTEGER DEFAULT 0,
    viral_score FLOAT DEFAULT 0.0,
    trending_score FLOAT DEFAULT 0.0,
    is_viral BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE
);

-- Create table for viral notes tracking
CREATE TABLE IF NOT EXISTS viral_notes (
    id TEXT PRIMARY KEY,
    note_id TEXT REFERENCES scraped_notes(id),
    viral_score FLOAT NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create table for trending notes tracking
CREATE TABLE IF NOT EXISTS trending_notes (
    id TEXT PRIMARY KEY,
    note_id TEXT REFERENCES scraped_notes(id),
    trending_score FLOAT NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '3 days')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scraped_notes_created_at ON scraped_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_scraped_notes_scraped_at ON scraped_notes(scraped_at);
CREATE INDEX IF NOT EXISTS idx_scraped_notes_viral_score ON scraped_notes(viral_score);
CREATE INDEX IF NOT EXISTS idx_scraped_notes_trending_score ON scraped_notes(trending_score);
CREATE INDEX IF NOT EXISTS idx_scraped_notes_is_viral ON scraped_notes(is_viral);
CREATE INDEX IF NOT EXISTS idx_scraped_notes_is_trending ON scraped_notes(is_trending);

CREATE INDEX IF NOT EXISTS idx_viral_notes_detected_at ON viral_notes(detected_at);
CREATE INDEX IF NOT EXISTS idx_viral_notes_expires_at ON viral_notes(expires_at);
CREATE INDEX IF NOT EXISTS idx_viral_notes_viral_score ON viral_notes(viral_score);

CREATE INDEX IF NOT EXISTS idx_trending_notes_detected_at ON trending_notes(detected_at);
CREATE INDEX IF NOT EXISTS idx_trending_notes_expires_at ON trending_notes(expires_at);
CREATE INDEX IF NOT EXISTS idx_trending_notes_trending_score ON trending_notes(trending_score); 