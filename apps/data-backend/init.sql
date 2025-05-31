-- Enable Row Level Security
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';
-- Drop existing tables if they exist


-- Create enum for social media platforms
CREATE TYPE social_platform AS ENUM ('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'discord', 'telegram', 'farcaster', 'lens','nostr');

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    slug_name TEXT NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    starknet_address TEXT,
    evm_address TEXT,
    btc_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create shop admins table
CREATE TABLE IF NOT EXISTS shop_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(shop_id, user_id)
);

-- Create shop socials table
CREATE TABLE IF NOT EXISTS shop_socials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    url TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(shop_id, platform)
);

-- Create shop products table
CREATE TABLE IF NOT EXISTS shop_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_socials ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

-- Create policies for shops
CREATE POLICY "Shops are viewable by everyone" ON shops
    FOR SELECT USING (true);

CREATE POLICY "Shops can be created by authenticated users" ON shops
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shops can be updated by owner and admins" ON shops
    FOR UPDATE USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM shop_admins 
            WHERE shop_id = shops.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Shops can be deleted by owner only" ON shops
    FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for shop admins
CREATE POLICY "Shop admins are viewable by everyone" ON shop_admins
    FOR SELECT USING (true);

CREATE POLICY "Shop admins can be managed by shop owner" ON shop_admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE id = shop_admins.shop_id AND owner_id = auth.uid()
        )
    );

-- Create policies for shop socials
CREATE POLICY "Shop socials are viewable by everyone" ON shop_socials
    FOR SELECT USING (true);

CREATE POLICY "Shop socials can be managed by owner and admins" ON shop_socials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE id = shop_socials.shop_id AND owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM shop_admins 
            WHERE shop_id = shop_socials.shop_id AND user_id = auth.uid()
        )
    );

-- Create policies for shop products
CREATE POLICY "Shop products are viewable by everyone" ON shop_products
    FOR SELECT USING (true);

CREATE POLICY "Shop products can be managed by owner and admins" ON shop_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE id = shop_products.shop_id AND owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM shop_admins 
            WHERE shop_id = shop_products.shop_id AND user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_shops_owner_id ON shops(owner_id);
CREATE INDEX idx_shops_slug_name ON shops(slug_name);
CREATE INDEX idx_shop_admins_shop_id ON shop_admins(shop_id);
CREATE INDEX idx_shop_admins_user_id ON shop_admins(user_id);
CREATE INDEX idx_shop_socials_shop_id ON shop_socials(shop_id);
CREATE INDEX idx_shop_products_shop_id ON shop_products(shop_id);

