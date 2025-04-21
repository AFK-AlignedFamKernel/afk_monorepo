-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.dao_creation;

-- Recreate the table with the correct structure
CREATE TABLE public.dao_creation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number BIGINT,
    hash TEXT,
    creator TEXT,
    token_address TEXT,
    contract_address TEXT,
    starknet_address TEXT
); 