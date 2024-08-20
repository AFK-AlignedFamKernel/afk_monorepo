create table token_launch(
    memecoin_address text unique,
    id serial primary key,
    network text,
    block_hash text,
    block_number bigint,
    block_timestamp timestamp,
    transaction_hash text,
    quote_token text,
    exchange_name text,
    created_at timestamp default current_timestamp,
    total_supply text,
    current_supply text,
    liquidity_raised text,
    price text
);

create table token_deploy(
    memecoin_address text unique,
    id serial primary key, 
    network text,
    block_hash text,
    block_number bigint,
    block_timestamp timestamp,
    transaction_hash text,
    owner_address text,
    name text,
    symbol text,
    initial_supply text,
    total_supply text,
    created_at timestamp default current_timestamp
);


CREATE TABLE buy_token (
    id SERIAL PRIMARY KEY UNIQUE,  -- `serial` automatically creates a unique sequence with primary key
    transfer_id text unique,
    network TEXT,
    block_hash TEXT,
    block_number BIGINT,
    block_timestamp TIMESTAMP,
    transaction_hash TEXT,
    memecoin_address TEXT,
    owner_address TEXT,
    last_price TEXT,
    quote_amount TEXT,
    coin_received TEXT,
    initial_supply TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_supply TEXT,
    current_supply TEXT,
    liquidity_raised TEXT,
    price TEXT,
    amount TEXT
);

create table unrugmeme_transfers(
    network text,
    block_hash text,
    block_number bigint,
    block_timestamp timestamp,
    transaction_hash text,
    transfer_id text unique primary key,
    from_address text,
    to_address text,
    memecoin_address text,
    amount text,
    created_at timestamp default current_timestamp,
    _cursor bigint
);

create table unrugmeme_deploy(
    network text,
    block_hash text,
    block_number bigint,
    block_timestamp timestamp,
    transaction_hash text,
    memecoin_address text unique primary key,
    owner_address text,
    name text,
    symbol text,
    initial_supply text,
    created_at timestamp default current_timestamp,
    _cursor bigint
);

create table unrugmeme_launch(
    network text,
    block_hash text,
    block_number bigint,
    block_timestamp timestamp,
    transaction_hash text,
    memecoin_address text unique primary key,
    quote_token text,
    exchange_name text,
    created_at timestamp default current_timestamp,
    _cursor bigint
);
