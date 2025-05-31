CREATE POLICY "Shops can be created by authenticated users" ON shops
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);