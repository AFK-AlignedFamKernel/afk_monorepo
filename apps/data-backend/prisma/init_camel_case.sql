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
    userAddress TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE,
    loginType   TEXT NOT NULL,
    verified    BOOLEAN DEFAULT FALSE,
    createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE social_accounts (
    id           TEXT PRIMARY KEY,
    userId       TEXT NOT NULL,
    platform     TEXT NOT NULL,
    accountId    TEXT NOT NULL,
    username     TEXT,
    picture      TEXT,
    accessToken  TEXT,
    refreshToken TEXT,
    expiresAt    TIMESTAMP,
    createdAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(userId, platform)
);
