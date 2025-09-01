import { defineIndexer } from '@apibara/indexer';
import { useLogger } from '@apibara/indexer/plugins';
import { drizzleStorage, useDrizzleStorage } from '@apibara/plugin-drizzle';
import { Abi, decodeEvent, StarknetStream } from '@apibara/starknet';
import { ByteArray, byteArray, constants, encode, hash, shortString } from 'starknet';
import { ApibaraRuntimeConfig } from 'apibara/types';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from 'indexer-v2-db/schema';
import { ABI as launchpadABI } from './abi/launchpad.abi';
import { formatUnits } from 'viem';
import { randomUUID } from 'crypto';
import { eq, and, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from 'indexer-v2-db';

// Extract schema tables
const {
    tokenDeploy,
    tokenLaunch,
    tokenMetadata,
    tokenTransactions,
    sharesTokenUser
} = schema;

// Event selectors
const CREATE_TOKEN = hash.getSelectorFromName('CreateToken') as `0x${string}`;
const CREATE_LAUNCH = hash.getSelectorFromName('CreateLaunch') as `0x${string}`;
const BUY_TOKEN = hash.getSelectorFromName('BuyToken') as `0x${string}`;
const SELL_TOKEN = hash.getSelectorFromName('SellToken') as `0x${string}`;
const TOKEN_CLAIMED = hash.getSelectorFromName('TokenClaimed') as `0x${string}`;
const LIQUIDITY_CREATED = hash.getSelectorFromName('LiquidityCreated') as `0x${string}`;
const LIQUIDITY_CAN_BE_ADDED = hash.getSelectorFromName('LiquidityCanBeAdded') as `0x${string}`;
const CREATOR_FEE_DISTRIBUTED = hash.getSelectorFromName('CreatorFeeDistributed') as `0x${string}`;
const METADATA_COIN_ADDED = hash.getSelectorFromName('MetadataCoinAdded') as `0x${string}`;

const KNOWN_EVENT_KEYS = [
    CREATE_TOKEN,
    CREATE_LAUNCH,
    BUY_TOKEN,
    SELL_TOKEN,
    TOKEN_CLAIMED,
    LIQUIDITY_CREATED,
    LIQUIDITY_CAN_BE_ADDED,
    CREATOR_FEE_DISTRIBUTED,
    METADATA_COIN_ADDED,
];

const formatTokenAmount = (amount: string, decimals: number = 18): string => {
    try {
        return formatUnits(BigInt(amount), decimals).toString();
    } catch (error) {
        console.error('Error formatting token amount:', error);
        return '0';
    }
};

// Utility functions for metadata extraction
const isValidChar = (char: string): boolean => {
    return /^[a-zA-Z0-9\s\-_.!@#$%^&*()/:]+$/.test(char);
};

const cleanString = (str: string): string => {
    return str
        .split('')
        .filter((char) => isValidChar(char))
        .join('')
        .trim();
};

const isNumeric = (str: string): boolean => {
    return /^\d+$/.test(str);
};

const tryGetMetadata = async (bodyMetadata: any | undefined, ipfsUrl: string, fallbackHash: string) => {
    try {
        if (ipfsUrl) {
            const response = await fetch(`${ipfsUrl}`);
            const data = await response.json();
            console.log("Fetched metadata:", data);
            bodyMetadata = data;
        }

        if (!bodyMetadata && fallbackHash) {
            try {
                const response = await fetch(`${fallbackHash}`);
                const data = await response.json();
                console.log("Fetched fallback metadata:", data);
                bodyMetadata = data;
            } catch (error) {
                console.log("Error fetching fallback metadata:", error);

                // Retry logic with timeout
                let retryCount = 0;
                const maxRetries = 3;
                const timeout = 1000;

                while (retryCount < maxRetries && !bodyMetadata) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), timeout);

                        const response = await fetch(`${ipfsUrl}`, {
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);

                        const data = await response.json();
                        bodyMetadata = data;
                        break;
                    } catch (error) {
                        retryCount++;
                        if (retryCount === maxRetries) {
                            console.log(`Failed to fetch metadata after ${maxRetries} retries:`, error);
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
        }
        return bodyMetadata;
    } catch (error) {
        console.log("Error fetching metadata:", error);
        return null;
    }
};

// State verification functions
const verifyTokenState = async (tokenAddress: string, expectedSupply?: string, expectedLiquidity?: string) => {
    try {
        const launchRecord = await db.execute(sql`
      SELECT current_supply, liquidity_raised, total_token_holded, price, market_cap
      FROM token_launch 
      WHERE memecoin_address = ${tokenAddress}
      LIMIT 1
    `);

        if (launchRecord.rows.length > 0) {
            const record = launchRecord.rows[0];
            console.log(`Token state verification for ${tokenAddress}:`, {
                current_supply: record.current_supply,
                liquidity_raised: record.liquidity_raised,
                total_token_holded: record.total_token_holded,
                price: record.price,
                market_cap: record.market_cap,
                expected_supply: expectedSupply,
                expected_liquidity: expectedLiquidity
            });

            return {
                isValid: true,
                currentSupply: record.current_supply,
                liquidityRaised: record.liquidity_raised,
                totalTokenHolded: record.total_token_holded,
                price: record.price,
                marketCap: record.market_cap
            };
        }

        return { isValid: false };
    } catch (error) {
        console.error('Error verifying token state:', error);
        return { isValid: false };
    }
};

const verifyUserShares = async (ownerAddress: string, tokenAddress: string, expectedAmount?: string) => {
    try {
        const shareRecord = await db.execute(sql`
      SELECT amount_owned, amount_buy, amount_sell, amount_claimed, total_paid, total_received, is_claimable
      FROM shares_token_user 
      WHERE owner = ${ownerAddress} AND token_address = ${tokenAddress}
      LIMIT 1
    `);

        if (shareRecord.rows.length > 0) {
            const record = shareRecord.rows[0];
            console.log(`User shares verification for ${ownerAddress}:`, {
                amount_owned: record.amount_owned,
                amount_buy: record.amount_buy,
                amount_sell: record.amount_sell,
                amount_claimed: record.amount_claimed,
                total_paid: record.total_paid,
                total_received: record.total_received,
                is_claimable: record.is_claimable,
                expected_amount: expectedAmount
            });

            return {
                isValid: true,
                amountOwned: record.amount_owned,
                amountBuy: record.amount_buy,
                amountSell: record.amount_sell,
                amountClaimed: record.amount_claimed,
                totalPaid: record.total_paid,
                totalReceived: record.total_received,
                isClaimable: record.is_claimable
            };
        }

        return { isValid: false };
    } catch (error) {
        console.error('Error verifying user shares:', error);
        return { isValid: false };
    }
};

// Utility function for database operations with timeout and retry
const executeWithTimeout = async (operation: Promise<any>, timeoutMs: number = 5000, retries: number = 2): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
            );

            return await Promise.race([operation, timeoutPromise]);
        } catch (error) {
            console.error(`Database operation attempt ${attempt + 1} failed:`, error);

            if (attempt === retries) {
                throw error;
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
    }
};

// Bonding curve price calculation utility
const calculateBondingCurvePrice = (currentSupply: number, liquidityRaised: number, totalSupply: number, thresholdLiquidity: number): number => {
    try {
        if (totalSupply <= 0 || thresholdLiquidity <= 0) {
            return 0;
        }

        // Simple linear bonding curve: price increases as supply decreases
        const supplyRatio = (totalSupply - currentSupply) / totalSupply;
        const liquidityRatio = liquidityRaised / thresholdLiquidity;

        // Price is proportional to how much of the supply has been sold and liquidity raised
        const price = liquidityRatio * supplyRatio;

        return Math.max(0, price);
    } catch (error) {
        console.error('Error calculating bonding curve price:', error);
        return 0;
    }
};

// Market cap calculation utility
const calculateMarketCap = (totalSupply: number, currentPrice: number): string => {
    try {
        const marketCap = totalSupply * currentPrice;
        return marketCap.toString();
    } catch (error) {
        console.error('Error calculating market cap:', error);
        return '0';
    }
};

// Event data validation utility
const validateEventData = (event: any, requiredFields: string[]): boolean => {
    try {
        if (!event || !event.args) {
            console.error('Event or event.args is null/undefined');
            return false;
        }

        for (const field of requiredFields) {
            if (!event.args[field] && event.args[field] !== 0) {
                console.error(`Required field ${field} is missing from event args`);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error validating event data:', error);
        return false;
    }
};

// Safe number conversion utility
const safeToNumber = (value: any, defaultValue: number = 0): number => {
    try {
        if (value === null || value === undefined) return defaultValue;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    } catch (error) {
        console.error('Error converting to number:', error);
        return defaultValue;
    }
};

export default function (config: ApibaraRuntimeConfig & {
    startingBlock: number,
    startingCursor: { orderKey: string }
}) {
    const {
        startingBlock,
    } = config;

    return defineIndexer(StarknetStream)({
        streamUrl: config.streamUrl as string,
        startingCursor: {
            orderKey: BigInt(config?.startingCursor?.orderKey ?? 533390),
        },
        filter: {
            events: [
                {
                    address: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548" as `0x${string}`,
                    keys: [CREATE_TOKEN],
                },
                {
                    address: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548" as `0x${string}`,
                    keys: [CREATE_LAUNCH],
                },
                {
                    address: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548" as `0x${string}`,
                    keys: [BUY_TOKEN],
                },
                {
                    address: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548" as `0x${string}`,
                    keys: [SELL_TOKEN],
                },
                {
                    address: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548" as `0x${string}`,
                    keys: [TOKEN_CLAIMED],
                },
                {
                    address: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548" as `0x${string}`,
                    keys: [LIQUIDITY_CREATED],
                },
                {
                    address: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548" as `0x${string}`,
                    keys: [LIQUIDITY_CAN_BE_ADDED],
                },
                {
                    address: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548" as `0x${string}`,
                    keys: [CREATOR_FEE_DISTRIBUTED],
                },
                {
                    address: "0xe95cbe6b42011fdc8a0863f89f02d6cad25bc1b5efd967da64ee998012f548" as `0x${string}`,
                    keys: [METADATA_COIN_ADDED],
                },
            ],
        },
        plugins: [drizzleStorage({
            db
        })],
        async transform({ endCursor, block, context, finality, }) {
            const logger = useLogger();
            const { events, header, } = block;

            logger.info(
                "Transforming block | orderKey: ",
                endCursor?.orderKey,
                " | finality: ",
                finality,
            );

            console.log("timestamp", header.timestamp);
            console.log("events length", events?.length);

            for (const event of events) {
                if (event.transactionHash) {
                    logger.log(`Found event ${event.keys[0]}`);

                    try {
                        if (event.keys[0] == encode.sanitizeHex(CREATE_TOKEN)) {
                            console.log("event createToken");
                            const decodedEvent = decodeEvent({
                                abi: launchpadABI as Abi,
                                event,
                                eventName: 'afk_launchpad::types::launchpad_types::CreateToken',
                            });
                            await handleCreateTokenEvent(decodedEvent, event.address, header, event);
                        }

                        if (event?.keys[0] == encode.sanitizeHex(CREATE_LAUNCH)) {
                            console.log("event CreateLaunch");
                            const decodedEvent = decodeEvent({
                                abi: launchpadABI as Abi,
                                event,
                                eventName: 'afk_launchpad::types::launchpad_types::CreateLaunch',
                            });
                            await handleCreateLaunch(decodedEvent, header, event);
                        }

                        if (event?.keys[0] == encode.sanitizeHex(METADATA_COIN_ADDED)) {
                            console.log("event Metadata");
                            try {
                                let decodedEvent = null;
                                try {
                                    decodedEvent = decodeEvent({
                                        abi: launchpadABI as Abi,
                                        event,
                                        eventName: 'afk_launchpad::types::launchpad_types::MetadataCoinAdded',
                                    });
                                } catch (decodeError) {
                                    console.log("Failed to decode metadata event, using raw data:", decodeError);
                                    decodedEvent = null;
                                }
                                await handleMetadataEvent(decodedEvent, header, event);
                            } catch (error) {
                                console.error("Error processing metadata event:", error);
                            }
                        }

                        if (event?.keys[0] == encode.sanitizeHex(BUY_TOKEN)) {
                            console.log("event BuyToken");
                            const decodedEvent = decodeEvent({
                                abi: launchpadABI as Abi,
                                event,
                                eventName: 'afk_launchpad::types::launchpad_types::BuyToken',
                            });
                            await handleBuyTokenEvent(decodedEvent, header, event);
                        }

                        if (event?.keys[0] == encode.sanitizeHex(SELL_TOKEN)) {
                            console.log("event Sell");
                            const decodedEvent = decodeEvent({
                                abi: launchpadABI as Abi,
                                event,
                                eventName: 'afk_launchpad::types::launchpad_types::SellToken',
                            });
                            await handleSellTokenEvent(decodedEvent, header, event);
                        }

                        if (event?.keys[0] == encode.sanitizeHex(TOKEN_CLAIMED)) {
                            console.log("event TokenClaimed");
                            const decodedEvent = decodeEvent({
                                abi: launchpadABI as Abi,
                                event,
                                eventName: 'afk_launchpad::types::launchpad_types::TokenClaimed',
                            });
                            await handleTokenClaimedEvent(decodedEvent, header, event);
                        }

                        if (event?.keys[0] == encode.sanitizeHex(LIQUIDITY_CREATED)) {
                            console.log("event LiquidityCreated");
                            const decodedEvent = decodeEvent({
                                abi: launchpadABI as Abi,
                                event,
                                eventName: 'afk_launchpad::types::launchpad_types::LiquidityCreated',
                            });
                            await handleLiquidityCreatedEvent(decodedEvent, header, event);
                        }

                        if (event?.keys[0] == encode.sanitizeHex(LIQUIDITY_CAN_BE_ADDED)) {
                            console.log("event LiquidityCanBeAdded");
                            const decodedEvent = decodeEvent({
                                abi: launchpadABI as Abi,
                                event,
                                eventName: 'afk_launchpad::types::launchpad_types::LiquidityCanBeAdded',
                            });
                            await handleLiquidityCanBeAddedEvent(decodedEvent, header, event);
                        }

                        if (event?.keys[0] == encode.sanitizeHex(CREATOR_FEE_DISTRIBUTED)) {
                            console.log("event CreatorFeeDistributed");
                            const decodedEvent = decodeEvent({
                                abi: launchpadABI as Abi,
                                event,
                                eventName: 'afk_launchpad::types::launchpad_types::CreatorFeeDistributed',
                            });
                            await handleCreatorFeeDistributedEvent(decodedEvent, header, event);
                        }
                    } catch (error: any) {
                        logger.error(`Error processing event: ${error.message}`);
                    }
                }
            }
        }
    });
    async function handleCreateTokenEvent(event: any, contractAddress: string, header: any, rawEvent: any) {
        try {
            console.log('=== CreateToken Event ===');
            console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

            const {
                timestamp: blockTimestamp,
            } = header;

            const transactionHash = encode.sanitizeHex(
                `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
            );

            const tokenAddress = event?.args?.token_address;
            const ownerAddress = event?.args?.caller;

            function safeToString(val: any): string {
                if (val === undefined || val === null) return '0';
                try {
                    if (typeof val === 'string') return val;
                    if (typeof val === 'bigint') return val.toString();
                    if (typeof val === 'number') return val.toString();
                    if (typeof val.toString === 'function') return val.toString();
                } catch (e) {
                    return '0';
                }
                return '0';
            }

            const initialSupply = formatTokenAmount(safeToString(event?.args?.initial_supply));
            const totalSupply = formatTokenAmount(safeToString(event?.args?.total_supply));

            let symbol = '';
            let name = '';
            try {
                if (typeof event?.args?.symbol === 'string' && event?.args?.symbol.startsWith('0x')) {
                    const symbolHex = event.args.symbol.slice(2);
                    const symbolBytes = [];
                    for (let i = 0; i < symbolHex.length; i += 2) {
                        symbolBytes.push(BigInt('0x' + symbolHex.slice(i, i + 2)));
                    }
                    symbol = byteArray.stringFromByteArray({
                        data: symbolBytes,
                        pending_word: 0n,
                        pending_word_len: symbolBytes.length
                    });
                }
            } catch (e) {
                symbol = '';
                console.error('Error decoding symbol from byte array:', e);
            }

            try {
                if (typeof event?.args?.name === 'string' && event?.args?.name.startsWith('0x')) {
                    const nameHex = event.args.name.slice(2);
                    const nameBytes = [];
                    for (let i = 0; i < nameHex.length; i += 2) {
                        nameBytes.push(BigInt('0x' + nameHex.slice(i, i + 2)));
                    }
                    name = byteArray.stringFromByteArray({
                        data: nameBytes,
                        pending_word: 0n,
                        pending_word_len: nameBytes.length
                    });
                }
            } catch (e) {
                name = '';
                console.error('Error decoding name from byte array:', e);
            }

            if (!tokenAddress || !ownerAddress) {
                console.error('Invalid addresses:', { tokenAddress, ownerAddress });
                return;
            }

            try {
                await db.insert(tokenDeploy).values({
                    transaction_hash: transactionHash,
                    network: 'starknet-sepolia',
                    block_timestamp: blockTimestamp,
                    memecoin_address: tokenAddress,
                    owner_address: ownerAddress,
                    name: name,
                    symbol: symbol,
                    initial_supply: initialSupply,
                    total_supply: totalSupply,
                    created_at: new Date(),
                    is_launched: false,
                });
                console.log('Token Deploy Record Created successfully');
            } catch (dbError: any) {
                if (dbError.code === '23505') {
                    console.log('Token already exists (unique constraint violation):', {
                        tokenAddress,
                        transactionHash
                    });
                } else {
                    console.error('Database error in handleCreateTokenEvent:', dbError);
                }
            }
        } catch (error) {
            console.error("Error in handleCreateTokenEvent:", error);
        }
    }

    async function handleCreateLaunch(event: any, header: any, rawEvent: any) {
        try {
            console.log('=== CreateLaunch Event ===');

            const {
                timestamp: blockTimestamp,
            } = header;

            const transactionHash = encode.sanitizeHex(
                `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
            );

            const existingLaunch = await db.query.tokenLaunch.findFirst({
                where: or(
                    eq(tokenLaunch.transaction_hash, transactionHash),
                    eq(tokenLaunch.memecoin_address, event?.args?.memecoin_address)
                )
            });

            if (existingLaunch) {
                console.log('Launch already exists, skipping creation');
                return;
            }

            const tokenDeployInfo = await db.query.tokenDeploy.findFirst({
                where: eq(tokenDeploy.memecoin_address, event?.args?.memecoin_address)
            });

            if (!tokenDeployInfo) {
                console.log('Token deploy not found for launch:', {
                    memecoin_address: event?.args?.memecoin_address
                });
                return;
            }

            const launchData = {
                transaction_hash: transactionHash,
                network: 'starknet-sepolia',
                block_timestamp: blockTimestamp,
                memecoin_address: event?.args?.memecoin_address,
                owner_address: event?.args?.owner,
                name: tokenDeployInfo.name || null,
                symbol: tokenDeployInfo.symbol || null,
                quote_token: event?.args?.quote_token,
                total_supply: formatTokenAmount(event?.args?.total_supply?.toString() || '0'),
                threshold_liquidity: formatTokenAmount(event?.args?.threshold_liquidity?.toString() || '0'),
                current_supply: formatTokenAmount(event?.args?.current_supply?.toString() || '0'),
                liquidity_raised: formatTokenAmount(event?.args?.liquidity_raised?.toString() || '0'),
                is_liquidity_added: event?.args?.is_liquidity_added || false,
                total_token_holded: formatTokenAmount(event?.args?.total_token_holded?.toString() || '0'),
                price: formatTokenAmount(event?.args?.price?.toString() || '0'),
                bonding_type: event?.args?.bonding_type,
                initial_pool_supply_dex: formatTokenAmount(event?.args?.initial_pool_supply_dex?.toString() || '0'),
                market_cap: formatTokenAmount(event?.args?.market_cap?.toString() || '0'),
                token_deploy_tx_hash: event?.args?.token_deploy_tx_hash,
                created_at: new Date(),
            };

            await db.insert(tokenLaunch).values(launchData);
            console.log('Token Launch Record Created');

            await db.update(tokenDeploy)
                .set({ is_launched: true })
                .where(eq(tokenDeploy.transaction_hash, event?.args?.token_deploy_tx_hash));

            console.log('Token Deploy Updated to Launched');
        } catch (error) {
            console.error("Error in handleCreateLaunch:", error);
        }
    }

    async function handleMetadataEvent(event: any, header: any, rawEvent: any) {
        try {
            console.log('=== Metadata Event ===');

            const {
                timestamp: blockTimestamp,
            } = header;

            const transactionHash = encode.sanitizeHex(
                `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
            );

            let tokenAddress = null;
            if (event?.args?.token_address) {
                tokenAddress = event.args.token_address;
            } else if (rawEvent.keys && rawEvent.keys.length > 1) {
                tokenAddress = encode.sanitizeHex(`0x${BigInt(rawEvent.keys[1]).toString(16)}`);
            }

            if (!tokenAddress) {
                console.log('No token address found in metadata event, skipping');
                return;
            }

            const existingMetadataResult = await db.execute(sql`
        SELECT memecoin_address FROM token_metadata 
        WHERE transaction_hash = ${transactionHash} OR memecoin_address = ${tokenAddress}
        LIMIT 1
      `);

            if (existingMetadataResult.rows.length > 0) {
                console.log('Metadata already exists, skipping creation');
                return;
            }

            let i = 1;
            let url = '';
            let ipfsHash = '';
            let ipfsUrl = '';

            try {
                while (i < rawEvent.data.length) {
                    const part = rawEvent.data[i];
                    const decodedPart = shortString.decodeShortString(
                        BigInt(part).toString(),
                    );

                    if (isNumeric(decodedPart)) {
                        i++;
                        break;
                    }

                    url += decodedPart;
                    i++;
                }
                url = cleanString(url);
            } catch (error) {
                console.log("Error extracting URL:", error);
            }

            try {
                while (i < rawEvent.data.length) {
                    const part = rawEvent.data[i];
                    const decodedPart = shortString.decodeShortString(
                        BigInt(part).toString(),
                    );

                    if (isNumeric(decodedPart)) {
                        i++;
                        break;
                    }

                    ipfsHash += decodedPart;
                    i++;
                }
                ipfsHash = cleanString(ipfsHash);
            } catch (error) {
                console.log("Error extracting IPFS hash:", error);
            }

            try {
                while (i < rawEvent.data.length) {
                    const part = rawEvent.data[i];
                    const decodedPart = shortString.decodeShortString(
                        BigInt(part).toString(),
                    );

                    if (isNumeric(decodedPart)) {
                        i++;
                        break;
                    }

                    ipfsUrl += decodedPart;
                    i++;
                }
                ipfsUrl = cleanString(ipfsUrl);
            } catch (error) {
                console.log("Error extracting IPFS URL:", error);
            }

            let bodyMetadata: any | undefined;

            if (ipfsUrl) {
                bodyMetadata = await tryGetMetadata(bodyMetadata, ipfsUrl, ipfsHash);
            }

            if (!bodyMetadata && ipfsHash) {
                bodyMetadata = await tryGetMetadata(bodyMetadata, ipfsHash, ipfsUrl);
            }

            if (!bodyMetadata && url) {
                bodyMetadata = await tryGetMetadata(bodyMetadata, url, url);
            }

            const insertMetadataPromise = db.execute(sql`
        INSERT INTO token_metadata (
          transaction_hash,
          network,
          block_timestamp,
          memecoin_address,
          url,
          nostr_id,
          nostr_event_id,
          twitter,
          telegram,
          github,
          website,
          created_at
        ) VALUES (
          ${transactionHash},
          ${'starknet-sepolia'},
          ${blockTimestamp},
          ${tokenAddress},
          ${url || null},
          ${bodyMetadata?.nostr_id || null},
          ${bodyMetadata?.nostr_event_id || null},
          ${bodyMetadata?.twitter || null},
          ${bodyMetadata?.telegram || null},
          ${bodyMetadata?.github || null},
          ${bodyMetadata?.website || null},
          ${new Date()}
        )
      `);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Insert timeout')), 5000)
            );

            try {
                await Promise.race([insertMetadataPromise, timeoutPromise]);
                console.log('Token Metadata Record Created successfully');
            } catch (error) {
                console.error('Error inserting metadata:', error);
                throw error;
            }

            try {
                await db.execute(sql`
          UPDATE token_deploy 
          SET 
            url = ${url || null},
            nostr_id = ${bodyMetadata?.nostr_id || null},
            nostr_event_id = ${bodyMetadata?.nostr_event_id || null},
            twitter = ${bodyMetadata?.twitter || null},
            telegram = ${bodyMetadata?.telegram || null},
            github = ${bodyMetadata?.github || null},
            website = ${bodyMetadata?.website || null},
            image_url = ${bodyMetadata?.image_url || null},
            description = ${bodyMetadata?.description || null}
          WHERE memecoin_address = ${tokenAddress}
        `);
                console.log('Token Deploy Record Updated with Metadata');
            } catch (updateError) {
                console.error('Failed to update token deploy:', updateError);
            }

            try {
                await db.execute(sql`
          UPDATE token_launch 
          SET 
            url = ${url || null},
            nostr_id = ${bodyMetadata?.nostr_id || null},
            nostr_event_id = ${bodyMetadata?.nostr_event_id || null},
            twitter = ${bodyMetadata?.twitter || null},
            telegram = ${bodyMetadata?.telegram || null},
            github = ${bodyMetadata?.github || null},
            website = ${bodyMetadata?.website || null},
            image_url = ${bodyMetadata?.image_url || null},
            description = ${bodyMetadata?.description || null}
          WHERE memecoin_address = ${tokenAddress}
        `);
                console.log('Token Launch Record Updated with Metadata');
            } catch (updateError) {
                console.error('Failed to update token launch:', updateError);
            }

            console.log('Metadata event processed successfully');
        } catch (error) {
            console.error("Error in handleMetadataEvent:", error);
        }
    }
    async function handleBuyTokenEvent(event: any, header: any, rawEvent: any) {
        try {
            console.log('=== BuyToken Event ===');

            const {
                timestamp: blockTimestamp,
            } = header;

            const transactionHash = encode.sanitizeHex(
                `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
            );

            const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

            const existingTransaction = await db.execute(sql`
        SELECT transfer_id FROM token_transactions 
        WHERE transfer_id = ${transferId}
        LIMIT 1
      `);

            if (existingTransaction?.rows.length > 0) {
                console.log('BuyToken transaction already exists, skipping:', transferId);
                return;
            }

            // Validate required event data
            if (!validateEventData(event, ['caller', 'token_address', 'amount'])) {
                console.error('Invalid BuyToken event data, skipping');
                return;
            }

            const ownerAddress = event?.args?.caller;
            const tokenAddress = event?.args?.token_address;
            const amount = formatTokenAmount(event?.args?.amount?.toString() || '0');
            const protocolFee = formatTokenAmount(event?.args?.protocol_fee?.toString() || '0');
            const creatorFee = formatTokenAmount(event?.args?.creator_fee?.toString() || '0');
            const quoteAmount = formatTokenAmount(event?.args?.quote_amount?.toString() || '0');
            const coinAmount = formatTokenAmount(event?.args?.coin_received?.toString() || amount);

            const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
            const timestamp = new Date(Math.max(0, eventTimestampMs));

            const launchRecord = await db.execute(sql`
        SELECT 
          current_supply,
          liquidity_raised,
          total_token_holded,
          initial_pool_supply_dex,
          total_supply,
          threshold_liquidity,
          creator_fee_raised,
          price
        FROM token_launch 
        WHERE memecoin_address = ${tokenAddress}
        LIMIT 1
      `);

            if (!launchRecord || launchRecord.rows.length === 0) {
                console.log('Launch record not found for token:', tokenAddress);
                return;
            }

            const currentLaunch = launchRecord.rows[0];

            const stateVerification = await verifyTokenState(tokenAddress);
            console.log('Pre-buy state verification:', stateVerification);

            const currentSupply = Number(currentLaunch.current_supply || '0');
            const currentLiquidityRaised = Number(currentLaunch.liquidity_raised || '0');
            const currentTotalTokenHolded = Number(currentLaunch.total_token_holded || '0');
            const currentCreatorFeeRaised = Number(currentLaunch.creator_fee_raised || '0');
            const thresholdLiquidity = Number(currentLaunch.threshold_liquidity || '0');

            const effectiveQuoteAmount = Number(quoteAmount);
            let newSupply = currentSupply - Number(amount);
            let newLiquidityRaised = currentLiquidityRaised + effectiveQuoteAmount;
            const newTotalTokenHolded = currentTotalTokenHolded + Number(coinAmount);
            const newCreatorFeeRaised = currentCreatorFeeRaised + Number(creatorFee);

            if (newSupply < 0) {
                console.warn(`Buy amount ${amount} would exceed remaining supply ${currentSupply}. Setting supply to 0.`);
                newSupply = 0;
            }

            if (newLiquidityRaised > thresholdLiquidity) {
                newLiquidityRaised = thresholdLiquidity;
            }

            // Calculate price using bonding curve
            const totalSupply = Number(currentLaunch.total_supply || '0');
            const newPrice = calculateBondingCurvePrice(newSupply, newLiquidityRaised, totalSupply, thresholdLiquidity);
            const marketCap = calculateMarketCap(totalSupply, newPrice);

            const updatePromise = db.execute(sql`
        UPDATE token_launch 
        SET 
          current_supply = ${newSupply.toString()},
          liquidity_raised = ${newLiquidityRaised.toString()},
          total_token_holded = ${newTotalTokenHolded.toString()},
          price = ${newPrice.toString()},
          market_cap = ${marketCap},
          creator_fee_raised = ${newCreatorFeeRaised.toString()}
        WHERE memecoin_address = ${tokenAddress}
      `);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Update timeout')), 5000)
            );

            try {
                await Promise.race([updatePromise, timeoutPromise]);
                console.log('Token launch updated successfully');
            } catch (error) {
                console.error('Error updating token launch:', error);
                throw error;
            }

            const shareholderId = `${ownerAddress}_${tokenAddress}`;
            const existingShareholder = await db.execute(sql`
        SELECT amount_owned, amount_buy, total_paid 
        FROM shares_token_user 
        WHERE id = ${shareholderId}
        LIMIT 1
      `);

            let newAmountOwned = Number(coinAmount);
            let newAmountBuy = Number(coinAmount);
            let newTotalPaid = Number(quoteAmount);

            if (existingShareholder.rows.length > 0) {
                const existing = existingShareholder.rows[0];
                newAmountOwned = Number(existing.amount_owned || '0') + Number(coinAmount);
                newAmountBuy = Number(existing.amount_buy || '0') + Number(coinAmount);
                newTotalPaid = Number(existing.total_paid || '0') + Number(quoteAmount);
            }

            if (newAmountOwned > newTotalTokenHolded) {
                console.warn(`Amount owned (${newAmountOwned}) exceeds total token held (${newTotalTokenHolded}). Adjusting.`);
                newAmountOwned = newTotalTokenHolded;
            }

            await db.execute(sql`
        INSERT INTO shares_token_user (
          id, owner, token_address, amount_owned, amount_buy, total_paid, is_claimable
        ) VALUES (
          ${shareholderId}, ${ownerAddress}, ${tokenAddress}, 
          ${newAmountOwned.toString()}, ${newAmountBuy.toString()}, 
          ${newTotalPaid.toString()}, ${true}
        )
        ON CONFLICT (id) DO UPDATE SET
          amount_owned = ${newAmountOwned.toString()},
          amount_buy = ${newAmountBuy.toString()},
          total_paid = ${newTotalPaid.toString()},
          is_claimable = ${true}
      `);

            await db.execute(sql`
        INSERT INTO token_transactions (
          transfer_id, network, block_timestamp, transaction_hash,
          memecoin_address, owner_address, amount, quote_amount,
          price, protocol_fee, time_stamp, transaction_type, creator_fee_amount
        ) VALUES (
          ${transferId}, ${'starknet-sepolia'}, ${blockTimestamp},
          ${transactionHash}, ${tokenAddress}, ${ownerAddress},
          ${Number(coinAmount)}, ${quoteAmount}, ${newPrice.toString()},
          ${protocolFee}, ${timestamp}, ${'buy'}, ${creatorFee}
        )
      `);

            setTimeout(async () => {
                const postStateVerification = await verifyTokenState(tokenAddress, newSupply.toString(), newLiquidityRaised.toString());
                const userSharesVerification = await verifyUserShares(ownerAddress, tokenAddress, newAmountOwned.toString());
                console.log('Post-buy state verification:', { postStateVerification, userSharesVerification });
            }, 1000);

            console.log('BuyToken event processed successfully');
        } catch (error) {
            console.error("Error in handleBuyTokenEvent:", error);
            throw error;
        }
    }

    async function handleSellTokenEvent(event: any, header: any, rawEvent: any) {
        try {
            console.log('=== SellToken Event ===');

            const {
                timestamp: blockTimestamp,
            } = header;

            const transactionHash = encode.sanitizeHex(
                `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
            );

            const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

            const existingTransaction = await db.execute(sql`
        SELECT transfer_id FROM token_transactions 
        WHERE transfer_id = ${transferId}
        LIMIT 1
      `);

            if (existingTransaction?.rows.length > 0) {
                console.log('SellToken transaction already exists, skipping:', transferId);
                return;
            }

            // Validate required event data
            if (!validateEventData(event, ['caller', 'amount'])) {
                console.error('Invalid SellToken event data, skipping');
                return;
            }

            const ownerAddress = event?.args?.caller;
            const tokenAddress = event?.args?.token_address || event?.args?.key_user;
            const amount = formatTokenAmount(event?.args?.amount?.toString() || '0');
            const protocolFee = formatTokenAmount(event?.args?.protocol_fee?.toString() || '0');
            const creatorFee = formatTokenAmount(event?.args?.creator_fee?.toString() || '0');
            const quoteAmount = formatTokenAmount(event?.args?.quote_amount?.toString() || event?.args?.coin_amount?.toString() || '0');
            const coinAmount = formatTokenAmount(event?.args?.coin_amount?.toString() || amount);

            const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
            const timestamp = new Date(Math.max(0, eventTimestampMs));

            const launchRecord = await db.execute(sql`
        SELECT 
          current_supply,
          liquidity_raised,
          total_token_holded,
          initial_pool_supply_dex,
          total_supply,
          threshold_liquidity,
          creator_fee_raised,
          price
        FROM token_launch 
        WHERE memecoin_address = ${tokenAddress}
        LIMIT 1
      `);

            if (!launchRecord || launchRecord.rows.length === 0) {
                console.log('Launch record not found for token:', tokenAddress);
                return;
            }

            const currentLaunch = launchRecord.rows[0];

            const stateVerification = await verifyTokenState(tokenAddress);
            console.log('Pre-sell state verification:', stateVerification);

            const currentSupply = Number(currentLaunch.current_supply || '0');
            const currentLiquidityRaised = Number(currentLaunch.liquidity_raised || '0');
            const currentTotalTokenHolded = Number(currentLaunch.total_token_holded || '0');
            const currentCreatorFeeRaised = Number(currentLaunch.creator_fee_raised || '0');

            const effectiveQuoteAmount = Number(quoteAmount);
            let newSupply = currentSupply + Number(coinAmount);
            let newLiquidityRaised = currentLiquidityRaised - effectiveQuoteAmount;
            let newTotalTokenHolded = currentTotalTokenHolded - Number(coinAmount);
            const newCreatorFeeRaised = currentCreatorFeeRaised + Number(creatorFee);

            if (newLiquidityRaised < 0) {
                console.warn(`Sell would result in negative liquidity. Setting to 0.`);
                newLiquidityRaised = 0;
            }

            if (newTotalTokenHolded < 0) {
                console.warn(`Sell would result in negative total token held. Setting to 0.`);
                newTotalTokenHolded = 0;
            }

            // Calculate price using bonding curve
            const totalSupply = Number(currentLaunch.total_supply || '0');
            const newPrice = calculateBondingCurvePrice(newSupply, newLiquidityRaised, totalSupply, thresholdLiquidity);
            const marketCap = calculateMarketCap(totalSupply, newPrice);

            const updatePromise = db.execute(sql`
        UPDATE token_launch 
        SET 
          current_supply = ${newSupply.toString()},
          liquidity_raised = ${newLiquidityRaised.toString()},
          total_token_holded = ${newTotalTokenHolded.toString()},
          price = ${newPrice.toString()},
          market_cap = ${marketCap},
          creator_fee_raised = ${newCreatorFeeRaised.toString()}
        WHERE memecoin_address = ${tokenAddress}
      `);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Update timeout')), 5000)
            );

            try {
                await Promise.race([updatePromise, timeoutPromise]);
                console.log('Token launch updated successfully');
            } catch (error) {
                console.error('Error updating token launch:', error);
                throw error;
            }

            const shareholderId = `${ownerAddress}_${tokenAddress}`;
            const existingShareholder = await db.execute(sql`
        SELECT amount_owned, amount_sell, total_received 
        FROM shares_token_user 
        WHERE id = ${shareholderId}
        LIMIT 1
      `);

            if (existingShareholder.rows.length > 0) {
                const existing = existingShareholder.rows[0];
                const newAmountOwned = Math.max(0, Number(existing.amount_owned || '0') - Number(coinAmount));
                const newAmountSell = Number(existing.amount_sell || '0') + Number(coinAmount);
                const newTotalReceived = Number(existing.total_received || '0') + Number(quoteAmount);

                await db.execute(sql`
          UPDATE shares_token_user 
          SET 
            amount_owned = ${newAmountOwned.toString()},
            amount_sell = ${newAmountSell.toString()},
            total_received = ${newTotalReceived.toString()}
          WHERE id = ${shareholderId}
        `);
            } else {
                console.warn(`No existing shareholder record found for sell transaction: ${shareholderId}`);
            }

            await db.execute(sql`
        INSERT INTO token_transactions (
          transfer_id, network, block_timestamp, transaction_hash,
          memecoin_address, owner_address, amount, quote_amount,
          price, protocol_fee, time_stamp, transaction_type, creator_fee_amount
        ) VALUES (
          ${transferId}, ${'starknet-sepolia'}, ${blockTimestamp},
          ${transactionHash}, ${tokenAddress}, ${ownerAddress},
          ${Number(coinAmount)}, ${quoteAmount}, ${newPrice.toString()},
          ${protocolFee}, ${timestamp}, ${'sell'}, ${creatorFee}
        )
      `);

            setTimeout(async () => {
                const postStateVerification = await verifyTokenState(tokenAddress, newSupply.toString(), newLiquidityRaised.toString());
                const userSharesVerification = await verifyUserShares(ownerAddress, tokenAddress);
                console.log('Post-sell state verification:', { postStateVerification, userSharesVerification });
            }, 1000);

            console.log('SellToken event processed successfully');
        } catch (error) {
            console.error("Error in handleSellTokenEvent:", error);
        }
    }
    async function handleTokenClaimedEvent(event: any, header: any, rawEvent: any) {
        try {
            console.log('=== TokenClaimed Event ===');

            const {
                timestamp: blockTimestamp,
            } = header;

            const transactionHash = encode.sanitizeHex(
                `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
            );

            const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

            const existingTransaction = await db.execute(sql`
        SELECT transfer_id FROM token_transactions 
        WHERE transfer_id = ${transferId}
        LIMIT 1
      `);

            if (existingTransaction?.rows.length > 0) {
                console.log('TokenClaimed transaction already exists, skipping:', transferId);
                return;
            }

            const ownerAddress = event?.args?.caller;
            const tokenAddress = event?.args?.token_address;
            const amount = formatTokenAmount(event?.args?.amount?.toString() || '0');
            const price = formatTokenAmount(event?.args?.price?.toString() || '0');
            const protocolFee = formatTokenAmount(event?.args?.protocol_fee?.toString() || '0');
            const lastPrice = formatTokenAmount(event?.args?.last_price?.toString() || '0');
            const quoteAmount = formatTokenAmount(event?.args?.quote_amount?.toString() || '0');

            const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
            const timestamp = new Date(Math.max(0, eventTimestampMs));

            const preClaimVerification = await verifyUserShares(ownerAddress, tokenAddress, amount);
            console.log('Pre-claim user shares verification:', preClaimVerification);

            const existingShareholder = await db.execute(sql`
        SELECT amount_owned, amount_claimed, is_claimable 
        FROM shares_token_user 
        WHERE owner = ${ownerAddress} AND token_address = ${tokenAddress}
        LIMIT 1
      `);

            if (existingShareholder.rows.length === 0) {
                console.warn(`No shareholder record found for claim: ${ownerAddress} - ${tokenAddress}`);
                return;
            }

            const shareholder = existingShareholder.rows[0];
            const currentAmountOwned = Number(shareholder.amount_owned || '0');
            const currentAmountClaimed = Number(shareholder.amount_claimed || '0');
            const claimAmount = Number(amount);

            if (claimAmount > currentAmountOwned) {
                console.warn(`Claim amount (${claimAmount}) exceeds owned amount (${currentAmountOwned}). Adjusting claim.`);
                return;
            }

            const newAmountOwned = Math.max(0, currentAmountOwned - claimAmount);
            const newAmountClaimed = currentAmountClaimed + claimAmount;
            const isStillClaimable = newAmountOwned > 0;

            const updateShareholderPromise = db.execute(sql`
        UPDATE shares_token_user 
        SET 
          amount_owned = ${newAmountOwned.toString()},
          amount_claimed = ${newAmountClaimed.toString()},
          is_claimable = ${isStillClaimable}
        WHERE owner = ${ownerAddress} AND token_address = ${tokenAddress}
      `);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Update timeout')), 5000)
            );

            try {
                await Promise.race([updateShareholderPromise, timeoutPromise]);
                console.log('Shareholder record updated successfully for claim');
            } catch (error) {
                console.error('Error updating shareholder record:', error);
                throw error;
            }

            await db.execute(sql`
        INSERT INTO token_transactions (
          transfer_id, network, block_timestamp, transaction_hash,
          memecoin_address, owner_address, amount, quote_amount,
          price, protocol_fee, time_stamp, transaction_type
        ) VALUES (
          ${transferId}, ${'starknet-sepolia'}, ${blockTimestamp},
          ${transactionHash}, ${tokenAddress}, ${ownerAddress},
          ${claimAmount}, ${quoteAmount}, ${price},
          ${protocolFee}, ${timestamp}, ${'claim'}
        )
      `);

            setTimeout(async () => {
                const postClaimVerification = await verifyUserShares(ownerAddress, tokenAddress, newAmountOwned.toString());
                console.log('Post-claim user shares verification:', postClaimVerification);
            }, 1000);

            console.log('TokenClaimed event processed successfully');
        } catch (error) {
            console.error("Error in handleTokenClaimedEvent:", error);
        }
    }

    async function handleLiquidityCreatedEvent(event: any, header: any, rawEvent: any) {
        try {
            console.log('=== LiquidityCreated Event ===');

            const {
                timestamp: blockTimestamp,
            } = header;

            const transactionHash = encode.sanitizeHex(
                `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
            );

            const tokenAddress = event?.args?.token_address;
            const finalPrice = event?.args?.final_price?.toString() || '0';
            const finalMarketCap = event?.args?.final_market_cap?.toString() || '0';

            try {
                const existingLaunch = await db.query.tokenLaunch.findFirst({
                    where: eq(tokenLaunch.memecoin_address, tokenAddress)
                });

                if (existingLaunch) {
                    await db.update(tokenLaunch)
                        .set({
                            price: formatTokenAmount(finalPrice),
                            market_cap: formatTokenAmount(finalMarketCap),
                            is_liquidity_added: true,
                        })
                        .where(eq(tokenLaunch.memecoin_address, tokenAddress));

                    console.log('Launch Record Updated for Liquidity Creation');
                }

                const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

                await db.insert(tokenTransactions).values({
                    transfer_id: transferId,
                    network: 'starknet-sepolia',
                    block_timestamp: blockTimestamp,
                    transaction_hash: transactionHash,
                    memecoin_address: tokenAddress,
                    transaction_type: 'liquidity_created',
                    created_at: new Date(),
                });

                console.log('Liquidity Created Transaction Record Created');
            } catch (dbError: any) {
                if (dbError.code === '23505') {
                    console.log('Liquidity created transaction already exists');
                } else {
                    console.error('Database error in handleLiquidityCreatedEvent:', dbError);
                }
            }
        } catch (error) {
            console.error("Error in handleLiquidityCreatedEvent:", error);
        }
    }

    async function handleLiquidityCanBeAddedEvent(event: any, header: any, rawEvent: any) {
        try {
            console.log('=== LiquidityCanBeAdded Event ===');

            const {
                timestamp: blockTimestamp,
            } = header;

            const transactionHash = encode.sanitizeHex(
                `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
            );

            const tokenAddress = event?.args?.token_address;

            try {
                const existingLaunch = await db.query.tokenLaunch.findFirst({
                    where: eq(tokenLaunch.memecoin_address, tokenAddress)
                });

                if (existingLaunch) {
                    await db.update(tokenLaunch)
                        .set({
                            is_liquidity_added: false,
                        })
                        .where(eq(tokenLaunch.memecoin_address, tokenAddress));

                    console.log('Launch Record Updated - Liquidity Can Be Added');
                }

                const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

                await db.insert(tokenTransactions).values({
                    transfer_id: transferId,
                    network: 'starknet-sepolia',
                    block_timestamp: blockTimestamp,
                    transaction_hash: transactionHash,
                    memecoin_address: tokenAddress,
                    transaction_type: 'liquidity_can_be_added',
                    created_at: new Date(),
                });

                console.log('Liquidity Can Be Added Transaction Record Created');
            } catch (dbError: any) {
                if (dbError.code === '23505') {
                    console.log('Liquidity can be added transaction already exists');
                } else {
                    console.error('Database error in handleLiquidityCanBeAddedEvent:', dbError);
                }
            }
        } catch (error) {
            console.error("Error in handleLiquidityCanBeAddedEvent:", error);
        }
    }

    async function handleCreatorFeeDistributedEvent(event: any, header: any, rawEvent: any) {
        try {
            console.log('=== CreatorFeeDistributed Event ===');

            const {
                timestamp: blockTimestamp,
            } = header;

            const transactionHash = encode.sanitizeHex(
                `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
            );

            const tokenAddress = event?.args?.token_address;
            const creatorFee = event?.args?.creator_fee?.toString() || '0';

            try {
                const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

                await db.insert(tokenTransactions).values({
                    transfer_id: transferId,
                    network: 'starknet-sepolia',
                    block_timestamp: blockTimestamp,
                    transaction_hash: transactionHash,
                    memecoin_address: tokenAddress,
                    transaction_type: 'creator_fee_distributed',
                    created_at: new Date(),
                });

                console.log('Creator Fee Distributed Transaction Record Created');
            } catch (dbError: any) {
                if (dbError.code === '23505') {
                    console.log('Creator fee distributed transaction already exists');
                } else {
                    console.error('Database error in handleCreatorFeeDistributedEvent:', dbError);
                }
            }
        } catch (error) {
            console.error("Error in handleCreatorFeeDistributedEvent:", error);
        }
    }
}