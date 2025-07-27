CREATE TABLE IF NOT EXISTS pubkey_settings (
    pubkey TEXT PRIMARY KEY,
    settings JSONB NOT NULL
);
