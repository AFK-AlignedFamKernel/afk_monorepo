
create table token_launch(
    id BIGSERIAL PRIMARY KEY,
    network text,
    block_hash text,
    block_number bigint,
    block_timestamp timestamp,
    transaction_hash text,
    memecoin_address text,
    quote_token text,
    exchange_name text,
    created_at timestamp default current_timestamp,
    _cursor bigint
);

create table token_deploy(
    id BIGSERIAL PRIMARY KEY,
    network text,
    block_hash text,
    block_number bigint,
    block_timestamp timestamp,
    transaction_hash text,
    memecoin_address text primary key,
    owner_address text,
    name text,
    symbol text,
    initial_supply text,
    total_supply text,
    created_at timestamp default current_timestamp,
    _cursor bigint
);


create table buy_token(
    id BIGSERIAL PRIMARY KEY,
    network text,
    block_hash text,
    block_number bigint,
    block_timestamp timestamp,
    transaction_hash text,
    memecoin_address text unique primary key,
    owner_address text,
    last_price text,
    price text,
    quote_amount text,
    coin_received text,
    initial_supply text,
    created_at timestamp default current_timestamp,
    _cursor bigint
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
