CREATE TABLE registration (
    id               SERIAL PRIMARY KEY,
    contract_address TEXT NULL,
    nickname         TEXT NULL,
    created_at       TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    is_confirmed     BOOLEAN DEFAULT FALSE,
    phone_number     TEXT NULL,
    email            TEXT NULL,
    starknet_address TEXT NULL,
    evm_address      TEXT NULL
);

CREATE TABLE users (
    id          TEXT PRIMARY KEY,
    useraddress TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE,
    logintype   TEXT NOT NULL,
    verified    BOOLEAN DEFAULT FALSE,
    createdat   TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updatedat   TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE social_accounts (
    id           TEXT PRIMARY KEY,
    userid       TEXT NOT NULL,
    platform     TEXT NOT NULL,
    accountid    TEXT NOT NULL,
    username     TEXT,
    picture      TEXT,
    accesstoken  TEXT,
    refreshtoken TEXT,
    expiresat    TIMESTAMP(6),
    createdat    TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updatedat    TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(userid, platform)
);