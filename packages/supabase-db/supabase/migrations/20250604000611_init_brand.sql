ALTER TABLE brand ADD COLUMN youtube_handle TEXT;
ALTER TABLE brand ADD COLUMN telegram_handle TEXT;
ALTER TABLE brand ADD COLUMN discord_handle TEXT;
ALTER TABLE brand ADD COLUMN facebook_handle TEXT;
ALTER TABLE brand ADD COLUMN linkedin_handle TEXT;
ALTER TABLE brand ADD COLUMN instagram_handle TEXT;
ALTER TABLE brand ADD COLUMN tiktok_handle TEXT;
ALTER TABLE brand ADD COLUMN reddit_handle TEXT;
ALTER TABLE brand ADD COLUMN twitter_handle TEXT;

-- Insert default brand models for Starknet and Ethereum with social handles
INSERT INTO brand (
    name, 
    description, 
    slug_name, 
    owner_id, 
    starknet_address, 
    evm_address, 
    is_verified, 
    topics,
    twitter_handle,
    youtube_handle,
    telegram_handle,
    discord_handle,
    facebook_handle,
    linkedin_handle,
    instagram_handle,
    tiktok_handle,
    reddit_handle
)
VALUES 
    (
        'Starknet', 
        'Starknet is a Layer 2 scaling solution for Ethereum', 
        'starknet', 
        '00000000-0000-0000-0000-000000000000', 
        '0x1234567890123456789012345678901234567890', 
        '0x1234567890123456789012345678901234567890', 
        true, 
        ARRAY['blockchain', 'ethereum', 'scaling'],
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet',
        'starknet'
    ),
    (
        'Ethereum', 
        'Ethereum is a decentralized platform for building applications', 
        'ethereum', 
        '00000000-0000-0000-0000-000000000000', 
        '0x1234567890123456789012345678901234567890', 
        '0x1234567890123456789012345678901234567890', 
        true, 
        ARRAY['blockchain', 'defi', 'nft'],
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum',
        'ethereum'
    );

-- Initialize leaderboard for Twitter
INSERT INTO leaderboard_stats (creator_id, platform, total_score, rank_position)
SELECT 
    b.id,
    'twitter'::social_platform,
    0,
    0
FROM brand b
WHERE b.name IN ('Starknet', 'Ethereum');
