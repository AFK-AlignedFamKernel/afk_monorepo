
-- Create table for social verification codes
CREATE TABLE IF NOT EXISTS social_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE social_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for social_verification_codes
CREATE POLICY "Users can view their own verification codes" ON social_verification_codes
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can create verification codes" ON social_verification_codes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update their own verification codes" ON social_verification_codes
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Create indexes
CREATE INDEX idx_social_verification_codes_user_id ON social_verification_codes(user_id);
CREATE INDEX idx_social_verification_codes_platform ON social_verification_codes(platform);
CREATE INDEX idx_social_verification_codes_code ON social_verification_codes(verification_code);

-- Function to generate verification code
CREATE OR REPLACE FUNCTION generate_social_verification_code(
    p_user_id UUID,
    p_platform TEXT,
    p_handle TEXT
) RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
BEGIN
    -- Generate a random code (6 characters)
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Insert or update verification code
    INSERT INTO social_verification_codes (user_id, platform, handle, verification_code)
    VALUES (p_user_id, p_platform, p_handle, v_code)
    ON CONFLICT (user_id, platform) 
    DO UPDATE SET 
        verification_code = v_code,
        is_verified = false,
        created_at = NOW(),
        expires_at = NOW() + INTERVAL '24 hours';
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify social identity
CREATE OR REPLACE FUNCTION verify_social_identity(
    p_user_id UUID,
    p_platform TEXT,
    p_handle TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_verified BOOLEAN;
BEGIN
    -- Update verification status
    UPDATE social_verification_codes
    SET is_verified = true
    WHERE user_id = p_user_id 
    AND platform = p_platform 
    AND handle = p_handle
    AND is_verified = false
    RETURNING true INTO v_verified;
    
    -- If verified, update content_creators table
    IF v_verified THEN
        UPDATE content_creators
        SET social_links = jsonb_set(
            COALESCE(social_links, '{}'::jsonb),
            array[p_platform],
            jsonb_build_object('handle', p_handle, 'verified', true)
        )
        WHERE id = p_user_id;
    END IF;
    
    RETURN COALESCE(v_verified, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
