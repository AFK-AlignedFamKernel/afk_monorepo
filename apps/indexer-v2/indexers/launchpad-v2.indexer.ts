import { defineIndexer } from '@apibara/indexer';
import { useLogger } from '@apibara/indexer/plugins';
import { drizzleStorage, useDrizzleStorage } from '@apibara/plugin-drizzle';
import { Abi, decodeEvent, StarknetStream } from '@apibara/starknet';
import { ByteArray, byteArray, constants, encode, hash } from 'starknet';
import { ApibaraRuntimeConfig } from 'apibara/types';
import { db } from 'indexer-v2-db';
import { ABI as launchpadABI } from './abi/launchpad.abi';
import { formatUnits } from 'viem';
import { randomUUID } from 'crypto';
import {
  tokenDeploy,
  tokenLaunch,
  tokenMetadata,
  tokenTransactions,
  sharesTokenUser
} from 'indexer-v2-db/schema';
import { eq, and, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { formatBigIntToFloat, formatFloatToUint256, formatFloatToBigInt } from '@/utils/format';
import { generateCandlesticksAsync } from '../services/launchpad/candlestick.service';
import { LAUNCHPAD_ADDRESS } from 'common';
import dotenv from 'dotenv';
dotenv.config();

export const ADDRESS_LAUNCHPAD = LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] || process.env.LAUNCHPAD_ADDRESS as string || "0x64d2deb12d8146d7600289addfb2ec258d8fbc5d51062f5bd3652b4d3b47ac0";


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

// Bonding curve constants
const DEX_POOL_PERCENTAGE = 20; // 20% of total supply goes to DEX pool
const USER_PURCHASABLE_PERCENTAGE = 80; // 80% of total supply is purchasable by users

// Helper function to calculate default bonding curve values
const calculateBondingCurveDefaults = (totalSupply: string) => {
  try {
    const totalSupplyBigInt = BigInt(totalSupply);

    // Calculate 20% for DEX pool (initial_pool_supply_dex)
    const dexPoolSupply = (totalSupplyBigInt * BigInt(DEX_POOL_PERCENTAGE)) / BigInt(100);

    // Calculate 80% for user purchasable supply (current_supply starts at this value)
    const userPurchasableSupply = (totalSupplyBigInt * BigInt(USER_PURCHASABLE_PERCENTAGE)) / BigInt(100);

    // Convert to human-readable strings
    const dexPoolSupplyFormatted = formatBigIntToFloat(dexPoolSupply);
    const userPurchasableSupplyFormatted = formatBigIntToFloat(userPurchasableSupply);

    console.log('Bonding curve defaults calculated:', {
      totalSupply: formatBigIntToFloat(totalSupplyBigInt),
      dexPoolSupply: dexPoolSupplyFormatted,
      userPurchasableSupply: userPurchasableSupplyFormatted,
      dexPoolPercentage: DEX_POOL_PERCENTAGE,
      userPurchasablePercentage: USER_PURCHASABLE_PERCENTAGE
    });

    return {
      dexPoolSupply: dexPoolSupplyFormatted,
      userPurchasableSupply: userPurchasableSupplyFormatted,
      dexPoolSupplyBigInt: dexPoolSupply,
      userPurchasableSupplyBigInt: userPurchasableSupply
    };
  } catch (error) {
    console.error('Error calculating bonding curve defaults:', error);
    return {
      dexPoolSupply: '0',
      userPurchasableSupply: '0',
      dexPoolSupplyBigInt: 0n,
      userPurchasableSupplyBigInt: 0n
    };
  }
};



// Helper function to calculate price based on bonding curve
const calculateBondingCurvePrice = (
  liquidityRaised: string,
  initialPoolSupply: string,
  totalSupply: string
): { price: string; marketCap: string } => {
  try {
    // Validate inputs
    if (!liquidityRaised || !initialPoolSupply || !totalSupply) {
      console.warn('Invalid inputs for bonding curve price calculation:', {
        liquidityRaised,
        initialPoolSupply,
        totalSupply
      });
      return { price: '0', marketCap: '0' };
    }

    // Convert string inputs to BigInt, handling both raw BigInt strings and formatted float strings
    let liquidityRaisedBigInt: bigint;
    let initialPoolSupplyBigInt: bigint;
    let totalSupplyBigInt: bigint;

    // Check if the strings contain decimal points (formatted floats) or are raw BigInt strings
    if (liquidityRaised.includes('.') || liquidityRaised.includes('e-') || liquidityRaised.includes('e+')) {
      liquidityRaisedBigInt = formatFloatToBigInt(liquidityRaised);
    } else {
      liquidityRaisedBigInt = BigInt(liquidityRaised);
    }

    if (initialPoolSupply.includes('.') || initialPoolSupply.includes('e-') || initialPoolSupply.includes('e+')) {
      initialPoolSupplyBigInt = formatFloatToBigInt(initialPoolSupply);
    } else {
      initialPoolSupplyBigInt = BigInt(initialPoolSupply);
    }

    if (totalSupply.includes('.') || totalSupply.includes('e-') || totalSupply.includes('e+')) {
      totalSupplyBigInt = formatFloatToBigInt(totalSupply);
    } else {
      totalSupplyBigInt = BigInt(totalSupply);
    }

    // Validate that values are non-negative
    if (liquidityRaisedBigInt < 0n || initialPoolSupplyBigInt < 0n || totalSupplyBigInt < 0n) {
      console.warn('Negative values detected in bonding curve calculation:', {
        liquidityRaised: liquidityRaisedBigInt.toString(),
        initialPoolSupply: initialPoolSupplyBigInt.toString(),
        totalSupply: totalSupplyBigInt.toString()
      });
      return { price: '0', marketCap: '0' };
    }

    // Price = liquidity_raised / initial_pool_supply_dex
    // Avoid division by zero
    const priceBigInt = initialPoolSupplyBigInt > 0n
      ? liquidityRaisedBigInt / initialPoolSupplyBigInt
      : 0n;

    // Market cap = total_supply * price
    const marketCapBigInt = totalSupplyBigInt * priceBigInt;

    const price = formatBigIntToFloat(priceBigInt);
    const marketCap = formatBigIntToFloat(marketCapBigInt);

    // Validate results
    if (price === 'NaN' || marketCap === 'NaN' || price === 'Infinity' || marketCap === 'Infinity') {
      console.warn('Invalid calculation results:', { price, marketCap });
      return { price: '0', marketCap: '0' };
    }

    console.log('Bonding curve price calculated:', {
      inputLiquidityRaised: liquidityRaised,
      inputInitialPoolSupply: initialPoolSupply,
      inputTotalSupply: totalSupply,
      liquidityRaisedBigInt: liquidityRaisedBigInt.toString(),
      initialPoolSupplyBigInt: initialPoolSupplyBigInt.toString(),
      totalSupplyBigInt: totalSupplyBigInt.toString(),
      priceBigInt: priceBigInt.toString(),
      marketCapBigInt: marketCapBigInt.toString(),
      price,
      marketCap
    });

    return { price, marketCap };
  } catch (error) {
    console.error('Error calculating bonding curve price:', error);
    return { price: '0', marketCap: '0' };
  }
};

// Helper function to validate bonding curve parameters
const validateBondingCurveParameters = (
  totalSupply: string,
  currentSupply: string,
  initialPoolSupply: string,
  liquidityRaised: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  try {
    const totalSupplyBigInt = BigInt(totalSupply);
    const currentSupplyBigInt = BigInt(currentSupply);
    const initialPoolSupplyBigInt = BigInt(initialPoolSupply);
    const liquidityRaisedBigInt = BigInt(liquidityRaised);

    // Check for negative values
    if (totalSupplyBigInt < 0n) errors.push('Total supply cannot be negative');
    if (currentSupplyBigInt < 0n) errors.push('Current supply cannot be negative');
    if (initialPoolSupplyBigInt < 0n) errors.push('Initial pool supply cannot be negative');
    if (liquidityRaisedBigInt < 0n) errors.push('Liquidity raised cannot be negative');

    // Check that current supply doesn't exceed total supply
    if (currentSupplyBigInt > totalSupplyBigInt) {
      errors.push('Current supply cannot exceed total supply');
    }

    // Check that initial pool supply is reasonable (should be 20% of total supply)
    const expectedPoolSupply = (totalSupplyBigInt * BigInt(DEX_POOL_PERCENTAGE)) / BigInt(100);
    const poolSupplyTolerance = expectedPoolSupply / BigInt(10); // 10% tolerance

    if (Math.abs(Number(initialPoolSupplyBigInt - expectedPoolSupply)) > Number(poolSupplyTolerance)) {
      errors.push(`Initial pool supply (${formatBigIntToFloat(initialPoolSupplyBigInt)}) should be approximately ${DEX_POOL_PERCENTAGE}% of total supply (${formatBigIntToFloat(expectedPoolSupply)})`);
    }

    // Check that current supply is reasonable (should be 80% of total supply initially)
    const expectedUserSupply = (totalSupplyBigInt * BigInt(USER_PURCHASABLE_PERCENTAGE)) / BigInt(100);
    const userSupplyTolerance = expectedUserSupply / BigInt(10); // 10% tolerance

    if (Math.abs(Number(currentSupplyBigInt - expectedUserSupply)) > Number(userSupplyTolerance) && currentSupplyBigInt > 0n) {
      console.warn(`Current supply (${formatBigIntToFloat(currentSupplyBigInt)}) differs from expected user purchasable supply (${formatBigIntToFloat(expectedUserSupply)})`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push(`Validation error: ${error}`);
    return { isValid: false, errors };
  }
};



// Helper function to add timeout to database operations
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Database operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};

// Circuit breaker to prevent database operations from blocking the indexer
let dbFailureCount = 0;
let lastDbFailureTime = 0;
const DB_FAILURE_THRESHOLD = 5;
const DB_RECOVERY_TIME = 30000; // 30 seconds

const isDbCircuitOpen = (): boolean => {
  const now = Date.now();
  if (dbFailureCount >= DB_FAILURE_THRESHOLD) {
    if (now - lastDbFailureTime < DB_RECOVERY_TIME) {
      return true; // Circuit is open
    } else {
      // Reset circuit breaker after recovery time
      dbFailureCount = 0;
      lastDbFailureTime = 0;
      return false;
    }
  }
  return false;
};

// Helper function to make database operations completely non-blocking
const nonBlockingDbOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  timeoutMs: number = 2000
): Promise<T | null> => {
  // Check circuit breaker
  if (isDbCircuitOpen()) {
    console.warn(`Database circuit breaker is open, skipping ${operationName}`);
    return null;
  }

  try {
    const result = await withTimeout(operation(), timeoutMs);
    // Reset failure count on success
    dbFailureCount = 0;
    return result;
  } catch (error: any) {
    dbFailureCount++;
    lastDbFailureTime = Date.now();
    console.error(`Non-blocking DB operation failed (${operationName}):`, error.message);
    console.warn(`DB failure count: ${dbFailureCount}/${DB_FAILURE_THRESHOLD}`);
    return null; // Return null instead of throwing
  }
};

// Helper function to retry database operations
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.log(`Database operation attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
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
      orderKey: BigInt(config?.startingCursor?.orderKey ?? 1962305),
    },
    filter: {
      events: [
        {
          address: ADDRESS_LAUNCHPAD as `0x${string}`,
          keys: [CREATE_TOKEN],
        },
        {
          address: ADDRESS_LAUNCHPAD as `0x${string}`,
          keys: [CREATE_LAUNCH],
        },
        {
          address: ADDRESS_LAUNCHPAD as `0x${string}`,
          keys: [BUY_TOKEN], // 0x00cb205b7506d21e6fe528cd4ae2ce69ae63eb6fc10a2d0234dd39ef3d349797
        },
        {
          address: ADDRESS_LAUNCHPAD as `0x${string}`,
          keys: [SELL_TOKEN],
        },
        {
          address: ADDRESS_LAUNCHPAD as `0x${string}`,
          keys: [TOKEN_CLAIMED],
        },
        {
          address: ADDRESS_LAUNCHPAD as `0x${string}`,
          keys: [LIQUIDITY_CREATED],
        },
        {
          address: ADDRESS_LAUNCHPAD as `0x${string}`,
          keys: [LIQUIDITY_CAN_BE_ADDED],
        },
        {
          address: ADDRESS_LAUNCHPAD as `0x${string}`,
          keys: [CREATOR_FEE_DISTRIBUTED],
        },
        {
          address: ADDRESS_LAUNCHPAD as `0x${string}`,
          keys: [METADATA_COIN_ADDED],
        },
      ],
    },
    plugins: [drizzleStorage({
      db,
      idColumn: {
        token_deploy: 'transaction_hash',
        token_launch: 'transaction_hash',
        token_metadata: 'transaction_hash',
        token_transactions: 'transfer_id',
        shares_token_user: 'owner'
      }
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

      // // Database health check - ensure database is responsive
      // try {
      //   await db.execute(sql`SELECT 1`);
      //   console.log("Database connection healthy");
      // } catch (dbHealthError) {
      //   console.error("Database connection unhealthy:", dbHealthError);
      //   // Continue processing but log the issue
      // }

      console.log("timestamp", header.timestamp);

      console.log("events length", events?.length);
      let processedEvents = 0;
      for (const event of events) {
        try {
          if (event.transactionHash) {
            processedEvents++;
            if (processedEvents % 10 === 0) {
              console.log(`Processed ${processedEvents}/${events?.length} events`);
            }
          logger.log(`Found event ${event.keys[0]}`);

          logger.log("event sanitized", encode.sanitizeHex(event.keys[0]));
          logger.log("BUY_TOKEN", encode.sanitizeHex(BUY_TOKEN));
          logger.log("CREATE_LAUNCH", encode.sanitizeHex(CREATE_LAUNCH));
          try {
            let sanitizedEventKey = encode.sanitizeHex(event.keys[0]);

            if (event.keys[0] == encode.sanitizeHex(CREATE_TOKEN)) {
              console.log("event createToken");
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::CreateToken',
              });
              await handleCreateTokenEvent(decodedEvent, event.address, header, event);
            }

            if (event?.keys[0] == encode.sanitizeHex(CREATE_LAUNCH)
              || encode.sanitizeHex(event?.keys[0]) == encode.sanitizeHex(CREATE_LAUNCH)
              || encode.sanitizeHex(event?.keys[0].slice(4)) == encode.sanitizeHex(CREATE_LAUNCH)
              || encode.sanitizeHex(event?.keys[0].slice(4)) == encode.sanitizeHex(CREATE_LAUNCH).slice(4)
            ) {
              console.log("event CreateLaunch");
              try {
                const decodedEvent = decodeEvent({
                  abi: launchpadABI as Abi,
                  event,
                  eventName: 'afk_launchpad::types::launchpad_types::CreateLaunch',
                });
                await handleCreateLaunch(decodedEvent, header, event);
              } catch (decodeError) {
                console.error("Failed to decode CreateLaunch event:", decodeError);
                // Try to handle with raw event data by creating a mock decoded event
                const mockEvent = { args: {} };
                try {
                  await handleCreateLaunch(mockEvent, header, event);
                } catch (rawError) {
                  console.error("Failed to handle CreateLaunch event with raw data:", rawError);
                }
              }
            }
            if (event?.keys[0] == encode.sanitizeHex(METADATA_COIN_ADDED)) {
              console.log("event Metadata");
              try {
                // Try to decode the event, but handle failures gracefully
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
            if (event?.keys[0] == encode.sanitizeHex(BUY_TOKEN)
              || encode.sanitizeHex(event?.keys[0]) == encode.sanitizeHex(BUY_TOKEN)
              || encode.sanitizeHex(event?.keys[0].slice(4)) == encode.sanitizeHex(BUY_TOKEN)
              || encode.sanitizeHex(event?.keys[0].slice(4)) == encode.sanitizeHex(BUY_TOKEN).slice(4)
            ) {
              console.log("event BuyToken");
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::BuyToken',
              });
              // Fire and forget - don't await to prevent blocking
              handleBuyTokenEvent(decodedEvent, header, event).catch(error => {
                console.error('BuyToken event handler failed:', error.message);
              });
            }
            if (event?.keys[0] == encode.sanitizeHex(SELL_TOKEN)) {
              console.log("event Sell");
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::SellToken',
              });
              // Fire and forget - don't await to prevent blocking
              handleSellTokenEvent(decodedEvent, header, event).catch(error => {
                console.error('SellToken event handler failed:', error.message);
              });
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
            logger.error(`Error processing event (continuing with next event): ${error.message}`);
            // Don't throw - let indexer continue processing other events
          }
          }
        } catch (eventError: any) {
          logger.error(`Error processing individual event (continuing with next event): ${eventError.message}`);
          // Don't throw - let indexer continue processing other events
        }
      }
      console.log(`Completed processing ${processedEvents} events in this block`);
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

      // Defensive: handle both BigInt and string, and undefined
      function safeToString(val: any): string {
        if (val === undefined || val === null) return '0';
        try {
          // If already string, return as is
          if (typeof val === 'string') return val;
          // If BigInt, convert to string
          if (typeof val === 'bigint') return val.toString();
          // If number, convert to string
          if (typeof val === 'number') return val.toString();
          // If object with toString, use it
          if (typeof val.toString === 'function') return val.toString();
        } catch (e) {
          return '0';
        }
        return '0';
      }

      const initialSupply = formatTokenAmount(safeToString(event?.args?.initial_supply));
      const totalSupply = formatTokenAmount(safeToString(event?.args?.total_supply));

      console.log("event args", event?.args);
      console.log("Decoded values - tokenAddress:", tokenAddress, "ownerAddress:", ownerAddress);
      console.log("Decoded values - initialSupply:", initialSupply, "totalSupply:", totalSupply);

      // Defensive: ensure input is a hex string, fallback to empty string if not
      function safeHexString(val: string | ByteArray): string {
        if (typeof val === 'string' && val.startsWith('0x')) return val;
        return '0x';
      }

      let symbol = '';
      let name = '';
      try {
        console.log("event?.args?.symbol", event?.args?.symbol);
        // Convert hex string to byte array first
        if (typeof event?.args?.symbol === 'string' && event?.args?.symbol.startsWith('0x')) {
          const symbolHex = event.args.symbol.slice(2); // Remove '0x' prefix
          const symbolBytes = [];
          for (let i = 0; i < symbolHex.length; i += 2) {
            symbolBytes.push(BigInt('0x' + symbolHex.slice(i, i + 2)));
          }
          symbol = byteArray.stringFromByteArray({
            data: symbolBytes,
            pending_word: 0n,
            pending_word_len: symbolBytes.length
          });
        } else {
          symbol = '';
        }
      } catch (e) {
        symbol = '';
        console.error('Error decoding symbol from byte array:', e, event?.args?.symbol);
      }
      try {
        console.log("event?.args?.name", event?.args?.name);
        // Convert hex string to byte array first
        if (typeof event?.args?.name === 'string' && event?.args?.name.startsWith('0x')) {
          const nameHex = event.args.name.slice(2); // Remove '0x' prefix
          const nameBytes = [];
          for (let i = 0; i < nameHex.length; i += 2) {
            nameBytes.push(BigInt('0x' + nameHex.slice(i, i + 2)));
          }
          name = byteArray.stringFromByteArray({
            data: nameBytes,
            pending_word: 0n,
            pending_word_len: nameBytes.length
          });
        } else {
          name = '';
        }
      } catch (e) {
        name = '';
        console.error('Error decoding name from byte array:', e, event?.args?.name);
      }

      // Validate addresses
      if (!tokenAddress || !ownerAddress) {
        console.error('Invalid addresses:', { tokenAddress, ownerAddress });
        return;
      }

      console.log('Processed Values:', {
        tokenAddress,
        ownerAddress,
        initialSupply,
        totalSupply,
        transactionHash,
        name,
        symbol
      });

      try {
        // Insert token deploy record using drizzle
        console.log('Attempting to insert token deploy record...');

        // Use raw SQL for better performance and avoid hanging
        try {
          const rawSqlPromise = db.execute(sql`
            INSERT INTO token_deploy (
              transaction_hash,
              network,
              block_timestamp,
              memecoin_address,
              owner_address,
              name,
              symbol,
              initial_supply,
              total_supply,
              created_at,
              is_launched,
              nostr_id
            ) VALUES (
              ${transactionHash},
              ${'starknet-sepolia'},
              ${blockTimestamp},
              ${tokenAddress},
              ${ownerAddress},
              ${name},
              ${symbol},
              ${initialSupply},
              ${totalSupply},
              ${new Date()},
              ${false},
              ${event?.args?.nostr_id || null}
            )
            ON CONFLICT (transaction_hash) DO NOTHING
          `);
          const rawSqlTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Raw SQL insert timed out after 10s')), 10000);
          });
          await Promise.race([rawSqlPromise, rawSqlTimeoutPromise]);
          console.log('Token Deploy Record Created successfully via raw SQL');
        } catch (sqlError: any) {
          console.error('Raw SQL insert failed:', sqlError);

          // Fallback to drizzle insert
          try {
            const drizzlePromise = db.insert(tokenDeploy).values({
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
              nostr_id: event?.args?.nostr_id,
            });
            const drizzleTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Drizzle insert timed out after 10s')), 10000);
            });
            await Promise.race([drizzlePromise, drizzleTimeoutPromise]);
            console.log('Token Deploy Record Created successfully via drizzle fallback');
          } catch (drizzleError: any) {
            console.error('Drizzle insert failed:', drizzleError);
            throw drizzleError; // Re-throw to be caught by outer catch
          }
        }
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Token already exists (unique constraint violation):', {
            tokenAddress,
            transactionHash
          });
        } else {
          console.error('Database error in handleCreateTokenEvent:', {
            error: dbError,
            code: dbError.code,
            message: dbError.message,
            detail: dbError.detail
          });
        }
      }
    } catch (error) {
      console.error("Error in handleCreateTokenEvent:", error);
    }
  }

  async function handleCreateLaunch(event: any, header: any, rawEvent: any) {
    try {
      console.log('=== CreateLaunch Event ===');
      console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

      const {
        timestamp: blockTimestamp,
      } = header;

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );


      const tokenAddress = event?.args?.token_address || event?.args?.memecoin_address;
      try {
        const existingLaunch = await db.query.tokenLaunch.findFirst({
          where: or(
            eq(tokenLaunch.transaction_hash, transactionHash),
            eq(tokenLaunch.memecoin_address, tokenAddress)
          )
        });

        console.log("existingLaunch", existingLaunch);

        if (existingLaunch) {
          console.log('Launch already exists, skipping creation:', {
            memecoin_address: existingLaunch.memecoin_address,
            transaction_hash: existingLaunch.transaction_hash
          });
          return;
        }

        const tokenDeployInfo = await db.query.tokenDeploy.findFirst({
          where: eq(tokenDeploy.memecoin_address, tokenAddress)
        });
        console.log("tokenDeployInfo", tokenDeployInfo);

        if (!tokenDeployInfo) {
          console.log('Token deploy not found for launch:', {
            memecoin_address: tokenAddress
          });
          // return;
        }


        console.log("Bonding type", event?.args?.bonding_type?.toString() || null);

        console.log("event args CreateLaunch", event?.args);

        const caller = event?.args?.caller || event?.args?.owner;

        const bondingType = event?.args?.bonding_type["_tag"] || event?.args?.bonding_type?.toString() || null;
        console.log("Bonding type", bondingType);

        // Get total supply from event or token deploy info
        const totalSupplyFromEvent = event?.args?.total_supply?.toString() || '0';
        const totalSupplyFromDeploy = tokenDeployInfo?.total_supply || '0';
        const totalSupply = totalSupplyFromEvent !== '0' ? totalSupplyFromEvent : totalSupplyFromDeploy;

        // Calculate default bonding curve values if not provided in event
        const bondingCurveDefaults = calculateBondingCurveDefaults(totalSupply);

        // Use event values if available, otherwise use calculated defaults
        const currentSupplyFromEvent = event?.args?.current_supply?.toString() || '0';
        const initialPoolSupplyFromEvent = event?.args?.initial_pool_supply_dex?.toString() || '0';

        const currentSupply = currentSupplyFromEvent !== '0'
          ? formatTokenAmount(currentSupplyFromEvent)
          : bondingCurveDefaults.userPurchasableSupply;

        const initialPoolSupply = initialPoolSupplyFromEvent !== '0'
          ? formatTokenAmount(initialPoolSupplyFromEvent)
          : bondingCurveDefaults.dexPoolSupply;

        // Calculate initial price and market cap
        const liquidityRaised = formatTokenAmount(event?.args?.liquidity_raised?.toString() || '0');
        const { price, marketCap } = calculateBondingCurvePrice(
          event?.args?.liquidity_raised?.toString() || '0',
          bondingCurveDefaults.dexPoolSupplyBigInt.toString(),
          totalSupply
        );

        const launchData = {
          transaction_hash: transactionHash,
          network: 'starknet-sepolia',
          block_timestamp: blockTimestamp,
          memecoin_address: tokenAddress,
          owner_address: caller,
          name: tokenDeployInfo?.name || null,
          symbol: tokenDeployInfo?.symbol || null,
          quote_token: event?.args?.quote_token,
          total_supply: formatTokenAmount(totalSupply),
          threshold_liquidity: formatTokenAmount(event?.args?.threshold_liquidity?.toString() || '0'),
          current_supply: currentSupply,
          liquidity_raised: liquidityRaised,
          is_liquidity_added: event?.args?.is_liquidity_added || false,
          total_token_holded: formatTokenAmount(event?.args?.total_token_holded?.toString() || '0'),
          price: price,
          bonding_type: bondingType,
          initial_pool_supply_dex: initialPoolSupply,
          market_cap: marketCap,
          token_deploy_tx_hash: event?.args?.token_deploy_tx_hash,
          created_at: new Date(),
        };

        console.log('Processed Launch Data:', launchData);

        // Validate bonding curve parameters
        const validation = validateBondingCurveParameters(
          totalSupply,
          bondingCurveDefaults.userPurchasableSupplyBigInt.toString(),
          bondingCurveDefaults.dexPoolSupplyBigInt.toString(),
          event?.args?.liquidity_raised?.toString() || '0'
        );

        if (!validation.isValid) {
          console.warn('Bonding curve validation failed:', validation.errors);
        } else {
          console.log('Bonding curve validation passed');
        }

        // Insert token launch with timeout, but don't crash on error/timeout
        try {
          const insertPromise = db.insert(tokenLaunch).values(launchData);
          const insertTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Drizzle insert timed out after 10s')), 10000);
          });
          await Promise.race([insertPromise, insertTimeout]);
          console.log('Token Launch Record Created');
        } catch (err) {
          console.error('Error or timeout during token launch insert:', err);
        }

        // Update token deploy to launched with timeout, but don't crash on error/timeout
        try {
          const updatePromise = db.update(tokenDeploy)
            .set({ is_launched: true })
            .where(eq(tokenDeploy.transaction_hash, event?.args?.token_deploy_tx_hash));
          const updateTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Drizzle update timed out after 10s')), 10000);
          });
          await Promise.race([updatePromise, updateTimeout]);
          console.log('Token Deploy Updated to Launched');
        } catch (err) {
          console.error('Error or timeout during token deploy update:', err);
        }
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Launch already exists (unique constraint violation):', {
            memecoin_address: tokenAddress,
            transaction_hash: transactionHash
          });
        } else {
          console.error('Database error in handleCreateLaunch:', {
            error: dbError,
            code: dbError.code,
            message: dbError.message,
            detail: dbError.detail
          });
        }
      }
    } catch (error) {
      console.error("Error in handleCreateLaunch:", error);
    }
  }



  async function handleMetadataEvent(event: any, header: any, rawEvent: any) {
    try {
      console.log('=== Metadata Event ===');
      console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

      const {
        timestamp: blockTimestamp,
      } = header;

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );


      console.log("event?.args?", event?.args);
      console.log("rawEvent?.keys?", rawEvent?.keys);
      // If no decoded event, try to extract basic info from raw event
      let tokenAddress = null;
      console.log('Extracting token address from metadata event...');

      if (event?.args?.token_address) {
        tokenAddress = event.args.token_address;
        console.log('Found token address in event args:', tokenAddress);
      } else if (rawEvent.keys && rawEvent.keys.length > 1) {
        // Fallback: extract from raw event keys
        console.log('Extracting token address from raw event keys...');
        tokenAddress = encode.sanitizeHex(`0x${BigInt(rawEvent.keys[1]).toString(16)}`);
        console.log('Extracted token address from keys:', tokenAddress);
      }

      if (!tokenAddress) {
        console.log('No token address found in metadata event, skipping');
        return;
      }

      console.log('Using token address for metadata:', tokenAddress);

      // Extract metadata from raw event data since event.args is undefined
      let extractedMetadata: {
        url: string | null;
        nostr_id: string | null;
        nostr_event_id: string | null;
        twitter: string | null;
        telegram: string | null;
        github: string | null;
        website: string | null;
      } = {
        url: null,
        nostr_id: null,
        nostr_event_id: null,
        twitter: null,
        telegram: null,
        github: null,
        website: null
      };

      const urlHex = event.args.url.slice(2); // Remove '0x' prefix
      const urlBytes = [];
      for (let i = 0; i < urlHex.length; i += 2) {
        urlBytes.push(BigInt('0x' + urlHex.slice(i, i + 2)));
      }
      let url = byteArray.stringFromByteArray({
        data: urlBytes,
        pending_word: 0n,
        pending_word_len: urlBytes.length
      });



      console.log('URL:', url);


      if (url) {
        const result = await fetch(url);
        const data: any = await result.json();
        console.log('Data:', data);
        if (data) {
          extractedMetadata.url = data?.url;
          extractedMetadata.nostr_id = data?.nostr_id;
          extractedMetadata.twitter = data?.twitter;
          extractedMetadata.telegram = data?.telegram;
          extractedMetadata.github = data?.github;
          extractedMetadata.website = data?.website;
        }
      }

      try {

        const updateTokenLaunchPromise = db.update(tokenLaunch)
          .set({
            url: extractedMetadata.url,
            twitter: extractedMetadata.twitter,
            telegram: extractedMetadata.telegram,
            github: extractedMetadata.github,
            website: extractedMetadata.website,
          })
          .where(eq(tokenLaunch.memecoin_address, tokenAddress));

        const updateTokenLaunchTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Drizzle update timed out after 10s')), 10000);
        });
        await Promise.race([updateTokenLaunchPromise, updateTokenLaunchTimeout]);
        console.log("Token Launch Record Updated");
      } catch (error) {
        console.error('Error or timeout during token launch update:', error);

      }

      try {

        const updateTokenDeployPromise = db.update(tokenDeploy)
          .set({
            url: extractedMetadata.url,
            telegram: extractedMetadata.telegram,
            github: extractedMetadata.github,
            website: extractedMetadata.website,
          })
          .where(eq(tokenDeploy.memecoin_address, tokenAddress));

        const updateTokenDeployTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Drizzle update timed out after 10s')), 10000);
        });
        await Promise.race([updateTokenDeployPromise, updateTokenDeployTimeout]);
        console.log("Token Deploy Record Updated");
      } catch (error) {
        console.error('Error or timeout during token deploy update:', error);

      }
      try {
        // Check if metadata already exists using raw SQL
        const existingMetadataResult = await db.execute(sql`
          SELECT memecoin_address, transaction_hash FROM token_metadata 
          WHERE transaction_hash = ${transactionHash} OR memecoin_address = ${tokenAddress}
          LIMIT 1
        `);


        if (existingMetadataResult.rows.length > 0) {
          const existingMetadata = existingMetadataResult.rows[0];
          console.log('Metadata already exists, skipping creation:', {
            memecoin_address: existingMetadata.memecoin_address,
            transaction_hash: existingMetadata.transaction_hash
          });
          return;
        }


        console.log("event?.args", event?.args);
        console.log('Constructing metadata data object...');
        const metadataData = {
          transaction_hash: transactionHash,
          network: 'starknet-sepolia',
          block_timestamp: blockTimestamp,
          memecoin_address: tokenAddress,
          url: extractedMetadata.url,
          nostr_id: extractedMetadata.nostr_id,
          nostr_event_id: extractedMetadata.nostr_event_id,
          twitter: extractedMetadata.twitter,
          telegram: extractedMetadata.telegram,
          github: extractedMetadata.github,
          website: extractedMetadata.website,
          created_at: new Date(),
        };
        console.log('Metadata data object constructed successfully');

        console.log('Processed Metadata:', metadataData);
        console.log('About to start database operations...');
        console.log('Using raw SQL to insert metadata record...');

        // Use raw SQL directly since drizzle is having schema issues
        console.log('Starting raw SQL insert...');
        try {
          console.log('Executing INSERT statement...');
          await db.execute(sql`
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
              ${extractedMetadata.url || null},
              ${extractedMetadata.nostr_id || null},
              ${extractedMetadata.nostr_event_id || null},
              ${extractedMetadata.twitter || null},
              ${extractedMetadata.telegram || null},
              ${extractedMetadata.github || null},
              ${extractedMetadata.website || null},
              ${new Date()}
            )
          `);
          console.log('Token Metadata Record Created via raw SQL');
        } catch (sqlError: any) {
          console.error('Raw SQL insert failed:', sqlError);
          throw sqlError;
        }

        // Check if token deploy exists and update it
        try {
          const existingDeployResult = await db.execute(sql`
            SELECT name, symbol FROM token_deploy 
            WHERE memecoin_address = ${tokenAddress}
            LIMIT 1
          `);

          if (existingDeployResult.rows.length > 0) {
            const existingDeploy = existingDeployResult.rows[0];
            await db.execute(sql`
              UPDATE token_deploy 
              SET 
                name = ${event?.args?.name || existingDeploy.name},
                symbol = ${event?.args?.symbol || existingDeploy.symbol}
              WHERE memecoin_address = ${tokenAddress}
            `);
            console.log('Token Deploy Record Updated with Metadata');
          }
        } catch (updateError) {
          console.error('Failed to update token deploy:', updateError);
        }

        // Check if token launch exists
        try {
          const existingLaunchResult = await db.execute(sql`
            SELECT name, symbol FROM token_launch 
            WHERE memecoin_address = ${tokenAddress}
            LIMIT 1
          `);

          if (existingLaunchResult.rows.length > 0) {
            const existingLaunch = existingLaunchResult.rows[0];
            await db.execute(sql`
              UPDATE token_launch 
              SET 
                name = ${event?.args?.name || existingLaunch.name},
                symbol = ${event?.args?.symbol || existingLaunch.symbol}
              WHERE memecoin_address = ${tokenAddress}
            `);
            console.log('Token Launch Record Updated with Metadata');
          }
        } catch (updateError) {
          console.error('Failed to update token launch:', updateError);
        }
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Metadata already exists (unique constraint violation):', {
            memecoin_address: tokenAddress,
            transaction_hash: transactionHash
          });
        } else {
          console.error('Database error in handleMetadataEvent:', {
            error: dbError,
            code: dbError.code,
            message: dbError.message,
            detail: dbError.detail
          });
        }
      }
    } catch (error) {
      console.error("Error in handleMetadataEvent:", error);
    }
  }

  async function handleBuyTokenEvent(event: any, header: any, rawEvent: any) {
    try {
      console.log('=== BuyToken Event ===');
      console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

      const {
        timestamp: blockTimestamp,
      } = header;

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

      try {
        const existingTransaction = await db.execute<{
          transfer_id: string;
          transaction_hash: string;
          transaction_type: string;
        }>(sql`
          SELECT 
            transfer_id,
            transaction_hash,
            transaction_type
          FROM token_transactions 
          WHERE transfer_id = ${transferId}
          LIMIT 1
        `);

        if (existingTransaction?.rows.length > 0) {
          console.log('Transaction already exists, skipping:', {
            transfer_id: transferId,
            transaction_hash: transactionHash
          });
          return;
        }

        const ownerAddress = event?.args?.caller;
        const tokenAddress = event?.args?.token_address;

        const amountString = event?.args?.amount?.toString() || '0';
        const priceString = event?.args?.price?.toString() || '0';
        const protocolFee = event?.args?.protocol_fee?.toString() || '0';
        const lastPrice = event?.args?.last_price?.toString() || '0';
        const quoteAmountString = event?.args?.quote_amount?.toString() || '0';

        console.log("amountString", amountString);
        console.log("quoteAmountString", quoteAmountString);
        console.log("priceString", priceString);

        // Keep original BigInt values for calculations
        const amountBigInt = BigInt(amountString);
        const quoteAmountBigInt = BigInt(quoteAmountString);
        const priceBigInt = BigInt(priceString);

        // Convert to human-readable strings for display/storage
        const amount = formatBigIntToFloat(amountBigInt);
        const quoteAmount = formatBigIntToFloat(quoteAmountBigInt);
        // Note: We'll calculate the actual price based on bonding curve below
        const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
        const timestamp = new Date(Math.max(0, eventTimestampMs));

        let price = '0';
        console.log("amount", amount);
        console.log("quoteAmount", quoteAmount);

        let newTotalTokenHoldedOverZero = 0;
        let calculatedPrice = '0'; // Will be set based on bonding curve calculation
        try {
          const launchRecord = await db.execute<{
            current_supply: string;
            liquidity_raised: string;
            total_token_holded: string;
            initial_pool_supply_dex: string;
            total_supply: string;
            threshold_liquidity: string;
          }>(sql`
            SELECT 
              current_supply,
              liquidity_raised,
              total_token_holded,
              initial_pool_supply_dex,
              threshold_liquidity,
              total_supply
            FROM token_launch 
            WHERE memecoin_address = ${tokenAddress}
            LIMIT 1
          `);

          let currentLaunch = launchRecord.rows[0];

          if (!launchRecord || launchRecord.rows.length === 0) {
            console.log('Launch record not found for token:', tokenAddress);

            // Get total supply from token deploy if available
            const tokenDeployInfo = await db.query.tokenDeploy.findFirst({
              where: eq(tokenDeploy.memecoin_address, tokenAddress)
            });

            const totalSupply = tokenDeployInfo?.total_supply || '1000000000000000000000000'; // Default 1M tokens
            const bondingCurveDefaults = calculateBondingCurveDefaults(totalSupply);

            const defaultLaunch = {
              memecoin_address: tokenAddress,
              owner_address: ownerAddress,
              current_supply: bondingCurveDefaults.userPurchasableSupply,
              liquidity_raised: '0',
              total_token_holded: '0',
              initial_pool_supply_dex: bondingCurveDefaults.dexPoolSupply,
              threshold_liquidity: '0',
              total_supply: formatTokenAmount(totalSupply),
              price: '0',
              market_cap: '0',
              network: 'starknet-sepolia',
              block_timestamp: new Date(blockTimestamp),
              transaction_hash: transactionHash,
              created_at: new Date()
            };

            try {
              const insertLaunch = await db.execute(sql`
                INSERT INTO token_launch (
                  memecoin_address,
                  owner_address,
                  current_supply,
                  liquidity_raised,
                  total_token_holded,
                  initial_pool_supply_dex,
                  total_supply,
                  price,
                  market_cap,
                  network,
                  block_timestamp,
                  transaction_hash,
                  created_at
                ) VALUES (
                  ${defaultLaunch.memecoin_address},
                  ${defaultLaunch.owner_address},
                  ${defaultLaunch.current_supply},
                  ${defaultLaunch.liquidity_raised},
                  ${defaultLaunch.total_token_holded},
                  ${defaultLaunch.initial_pool_supply_dex},
                  ${defaultLaunch.total_supply},
                  ${defaultLaunch.price},
                  ${defaultLaunch.market_cap},
                  ${defaultLaunch.network},
                  ${defaultLaunch.block_timestamp},
                  ${defaultLaunch.transaction_hash},
                  ${defaultLaunch.created_at}
                )
                ON CONFLICT (memecoin_address) DO NOTHING
                RETURNING *
              `);

              if (!insertLaunch || insertLaunch.rows.length === 0) {
                console.error('Insert operation returned no result:', {
                  tokenAddress,
                  defaultLaunch
                });
                return;
              }

              console.log('Created default launch record for token:', tokenAddress);
              currentLaunch = insertLaunch.rows[0] as {
                current_supply: string;
                liquidity_raised: string;
                total_token_holded: string;
                initial_pool_supply_dex: string;
                total_supply: string;
                threshold_liquidity: string;
              };
            } catch (error) {
              console.error('Failed to create default launch record:', {
                error,
                tokenAddress,
                defaultLaunch
              });
              return;
            }
          }

          if (!currentLaunch) {
            console.log("currentLaunch not found")
            return;
          }

          // Work with human-readable numbers only (simplified approach)
          const currentSupply = Number(currentLaunch.current_supply || '0');
          const liquidityRaised = Number(currentLaunch.liquidity_raised || '0');
          const totalTokenHolded = Number(currentLaunch.total_token_holded || '0');
          const initPoolSupply = Number(currentLaunch.initial_pool_supply_dex || '0');
          const totalSupply = Number(currentLaunch.total_supply || '0');
          const thresholdLiquidity = Number(currentLaunch.threshold_liquidity || '0');

          // Calculate new values (following old indexer logic)
          let newSupply = currentSupply - Number(amount);
          let newLiquidityRaised = liquidityRaised + Number(quoteAmount);
          const newTotalTokenHolded = totalTokenHolded + Number(amount);

          newTotalTokenHoldedOverZero = newTotalTokenHolded + Number(amount);
          // Handle negative supply (following old indexer pattern)
          if (newSupply < 0) {
            console.warn(`Buy amount ${amount} would exceed remaining supply ${currentSupply}. Setting supply to 0.`);
            newSupply = 0;
          }

          // Handle threshold liquidity (following old indexer pattern)
          if (newLiquidityRaised > thresholdLiquidity && thresholdLiquidity > 0) {
            console.log(`Liquidity raised ${newLiquidityRaised} exceeds threshold ${thresholdLiquidity}. Capping at threshold.`);
            newLiquidityRaised = thresholdLiquidity;
          }

          // Calculate price using bonding curve formula: Price = liquidity_raised / initial_pool_supply_dex
          const priceBuy = initPoolSupply > 0 ? (newLiquidityRaised / initPoolSupply).toString() : '0';
          calculatedPrice = priceBuy; // Store for use in transaction

          price = priceBuy;
          // Calculate market cap: total_supply * price (following old indexer pattern)
          const marketCap = (totalSupply * Number(priceBuy)).toString();

          // Fix: Ensure both operands are BigInt for arithmetic, not string


          console.log("Calculated values for launch update:", {
            newSupply: newSupply,
            newLiquidityRaised: newLiquidityRaised.toString(),
            newTotalTokenHolded: newTotalTokenHoldedOverZero,
            priceBuy: priceBuy,
            marketCap: marketCap,
            initPoolSupply: initPoolSupply,
            currentLiquidityRaised: liquidityRaised
          });

          // Update launch record with non-blocking approach
          console.log("Updating launch record");
          const updateResult = await nonBlockingDbOperation(
            () => db.execute(sql`
                UPDATE token_launch 
                SET 
                  current_supply = ${newSupply},
                  liquidity_raised = ${newLiquidityRaised},
                  total_token_holded = ${newTotalTokenHolded},
                  price = ${priceBuy},
                  market_cap = ${marketCap}
                WHERE memecoin_address = ${tokenAddress}
              `),
            'update_launch_record',
            2000
          );
          
          if (updateResult) {
            console.log("Update result", updateResult);
            console.log('Launch Record Updated');
          } else {
            console.log('Launch record update failed or timed out - continuing');
          }

        } catch (launchError: any) {
          console.error('Error fetching/updating launch record:', {
            error: launchError,
            code: launchError.code,
            message: launchError.message,
            detail: launchError.detail,
            tokenAddress
          });
          return;
        }

        // Find existing shareholder (following old indexer pattern)
        const existingShareholder = await db.query.sharesTokenUser.findFirst({
          where: and(
            eq(sharesTokenUser.owner, ownerAddress),
            eq(sharesTokenUser.token_address, tokenAddress)
          )
        });

        console.log("existingShareholder", existingShareholder);

        // Calculate new amount owned (following old indexer logic)
        let newAmountOwned = existingShareholder
          ? Number(existingShareholder.amount_owned || '0') + Number(amount)
          : Number(amount);

        // Handle case where amount owned exceeds total token held (following old indexer pattern)
        if (newAmountOwned > newTotalTokenHoldedOverZero && newTotalTokenHoldedOverZero > 0) {
          console.warn(`Amount owned (${newAmountOwned}) exceeds total token held (${newTotalTokenHoldedOverZero}). Adjusting amount owned to total token held.`);
          newAmountOwned = newTotalTokenHoldedOverZero;
        }

        // Update or create shareholder record with non-blocking approach
        console.log("update or insert shareholder record");
        const shareholderResult = await nonBlockingDbOperation(
          () => db.insert(sharesTokenUser)
            .values({
              owner: ownerAddress,
              token_address: tokenAddress,
              amount_owned: newAmountOwned.toString(),
              amount_buy: amount, // Track individual buy amount
              total_paid: quoteAmount, // Track total paid in quote token
              is_claimable: false,
            })
            .onConflictDoUpdate({
              target: [sharesTokenUser.owner, sharesTokenUser.token_address], // Use unique index for conflict resolution
              set: {
                amount_owned: newAmountOwned.toString(),
                amount_buy: amount,
                total_paid: quoteAmount,
                is_claimable: false,
              },
            }),
          'update_shareholder_record',
          2000
        );
        
        if (shareholderResult) {
          console.log("Shareholder Record Updated/Created");
        } else {
          console.log('Shareholder record update failed or timed out - continuing');
        }
        console.log('Shareholder Record Updated');

        // Use upsert pattern to prevent duplicates with non-blocking approach
        console.log("insert token transaction");
        const transactionResult = await nonBlockingDbOperation(
          () => db.insert(tokenTransactions)
            .values({
              transfer_id: transferId,
              network: 'starknet-sepolia',
              block_timestamp: blockTimestamp,
              transaction_hash: transactionHash,
              memecoin_address: tokenAddress,
              owner_address: ownerAddress,
              last_price: lastPrice,
              quote_amount: quoteAmount,
              price: calculatedPrice, // Use calculated price from bonding curve
              amount: amount,
              protocol_fee: protocolFee,
              time_stamp: timestamp,
              transaction_type: 'buy',
              created_at: new Date(),
            })
            .onConflictDoNothing(), // Prevent duplicates
          'insert_transaction_record',
          2000
        );
        
        if (transactionResult) {
          console.log('Transaction Record Created');
        } else {
          console.log('Transaction record insert failed or timed out - continuing');
        }

        // Generate candlesticks asynchronously (non-blocking)
        generateCandlesticksAsync(tokenAddress);

      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Transaction already exists (unique constraint violation):', {
            transfer_id: transferId,
            transaction_hash: transactionHash
          });
        } else {
          console.error('Database error in handleBuyTokenEvent (continuing with indexer):', {
            error: dbError.message,
            transfer_id: transferId,
            transaction_hash: transactionHash
          });
        }
        // Don't throw - let indexer continue processing other events
      }
    } catch (error) {
      console.error("Error in handleBuyTokenEvent:", error);
    }
  }

  async function handleSellTokenEvent(event: any, header: any, rawEvent: any) {
    try {
      console.log('=== SellToken Event ===');
      console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

      const {
        timestamp: blockTimestamp,
      } = header;

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

      const ownerAddress = event?.args?.caller;
      const tokenAddress = event?.args?.key_user;

      const quoteAmountString = event?.args?.amount?.toString() || '0';
      const priceString = event?.args?.price?.toString() || '0';
      const protocolFee = event?.args?.protocol_fee?.toString() || '0';
      const lastPrice = event?.args?.last_price?.toString() || '0';
      const amountString = event?.args?.coin_amount?.toString() || '0';

      // Keep original BigInt values for calculations
      const amountBigInt = BigInt(amountString);
      const quoteAmountBigInt = BigInt(quoteAmountString);
      const priceBigInt = BigInt(priceString);

      // Convert to human-readable strings for display/storage
      const amount = formatBigIntToFloat(amountBigInt);
      const quoteAmount = formatBigIntToFloat(quoteAmountBigInt);
      // Note: We'll calculate the actual price based on bonding curve below

      const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
      const timestamp = new Date(Math.max(0, eventTimestampMs));

      let calculatedSellPrice = '0'; // Will be set based on bonding curve calculation

      try {
        const launchRecord = await db
          .select()
          .from(tokenLaunch)
          .where(eq(tokenLaunch.memecoin_address, tokenAddress))
          .limit(1);

        if (!launchRecord || launchRecord.length === 0) {
          console.log('No launch record found for token:', tokenAddress);
          return;
        }

        const currentLaunch = launchRecord[0];

        console.log("currentLaunch", currentLaunch);

        // Work with human-readable numbers only (simplified approach)
        const currentSupply = Number(currentLaunch.current_supply || '0');
        const liquidityRaised = Number(currentLaunch.liquidity_raised || '0');
        const totalTokenHolded = Number(currentLaunch.total_token_holded || '0');
        const initPoolSupply = Number(currentLaunch.initial_pool_supply_dex || '0');
        const totalSupply = Number(currentLaunch.total_supply || '0');

        const newSupply = currentSupply + Number(amount);
        const newLiquidityRaised = Math.max(0, liquidityRaised - Number(quoteAmount)); // Ensure non-negative
        const newTotalTokenHolded = Math.max(0, totalTokenHolded - Number(amount)); // Ensure non-negative

        // Calculate price using bonding curve formula: Price = liquidity_raised / initial_pool_supply_dex
        const priceSell = initPoolSupply > 0 ? (newLiquidityRaised / initPoolSupply).toString() : '0';
        calculatedSellPrice = priceSell; // Store for use in transaction

        // Calculate market cap: total_supply * price (following old indexer pattern)
        const marketCap = (totalSupply * Number(priceSell)).toString();

        console.log('Calculated Values for Sell:', {
          newSupply,
          newLiquidityRaised,
          newTotalTokenHolded,
          priceSell,
          marketCap,
          initPoolSupply,
          currentLiquidityRaised: liquidityRaised
        });


        try {
          const updatePromise = db.update(tokenLaunch)
            .set({
              current_supply: newSupply.toString(),
              liquidity_raised: newLiquidityRaised.toString(),
              total_token_holded: newTotalTokenHolded.toString(),
              price: priceSell,
              market_cap: marketCap,
            })
            .where(eq(tokenLaunch.memecoin_address, tokenAddress));
          
          const updateTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Drizzle update timed out after 5s")), 5000);
          });
          await Promise.race([updatePromise, updateTimeout]);
          console.log('Launch Record Updated');
        } catch (error: any) {
          console.error('Failed to update launch record (continuing with indexer):', {
            error: error.message,
            tokenAddress
          });
          // Don't throw - let indexer continue processing other events
        }


        console.log('Launch Record Updated');

        const existingShareholder = await db.query.sharesTokenUser.findFirst({
          where: and(
            eq(sharesTokenUser.owner, ownerAddress),
            eq(sharesTokenUser.token_address, tokenAddress)
          )
        });
        console.log("existingShareholder", existingShareholder);


        // Update shareholder record for sell with timeout handling - don't block indexer
        try {
          if (existingShareholder) {
            // Calculate new amount owned after sell - subtract the amount being sold
            const updatedAmountOwned = Math.max(0, Number(existingShareholder.amount_owned || '0') - Number(amount));

            const updatePromise = db.update(sharesTokenUser)
              .set({
                amount_owned: updatedAmountOwned.toString(),
                amount_sell: amount, // Track individual sell amount
                total_paid: quoteAmount, // Track amount received in quote token
                is_claimable: updatedAmountOwned > 0,
              })
              .where(and(
                eq(sharesTokenUser.owner, ownerAddress),
                eq(sharesTokenUser.token_address, tokenAddress)
              ));
            
            const updateTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Drizzle update timed out after 5s")), 5000);
            });
            await Promise.race([updatePromise, updateTimeout]);
            console.log('Shareholder Record Updated for Sell');
          } else {
            console.log("Shareholder not found for sell - this shouldn't happen");
            // If no existing shareholder, this might be an error case
            // But we'll still create a record with 0 amount owned
            const insertPromise = db.insert(sharesTokenUser).values({
              owner: ownerAddress,
              token_address: tokenAddress,
              amount_owned: '0', // No tokens owned after sell
              amount_sell: amount,
              total_paid: quoteAmount,
              is_claimable: false,
            });
            
            const insertTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Drizzle insert timed out after 5s")), 5000);
            });
            await Promise.race([insertPromise, insertTimeout]);
            console.log("Shareholder Record Created for Sell (unexpected case)");
          }
        } catch (error: any) {
          console.error('Failed to update shareholder for sell (continuing with indexer):', {
            error: error.message,
            ownerAddress,
            tokenAddress
          });
          // Don't throw - let indexer continue processing other events
        }
        // Use upsert pattern to prevent duplicates with timeout handling - don't block indexer
        try {
          const insertPromise = db.insert(tokenTransactions)
            .values({
              transfer_id: transferId,
              network: 'starknet-sepolia',
              block_timestamp: blockTimestamp,
              transaction_hash: transactionHash,
              memecoin_address: tokenAddress,
              owner_address: ownerAddress,
              last_price: lastPrice,
              quote_amount: quoteAmount,
              price: calculatedSellPrice, // Use calculated price from bonding curve
              amount: amount,
              protocol_fee: protocolFee,
              time_stamp: timestamp,
              transaction_type: 'sell',
              created_at: new Date(),
            })
            .onConflictDoNothing(); // Prevent duplicates

          const insertTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Drizzle insert timed out after 5s")), 5000);
          });
          await Promise.race([insertPromise, insertTimeout]);
          console.log('Transaction Record Created');
        } catch (error: any) {
          console.error('Failed to insert sell transaction (continuing with indexer):', {
            error: error.message,
            transferId,
            transactionHash
          });
          // Don't throw - let indexer continue processing other events
        }

        // Generate candlesticks asynchronously (non-blocking)
        generateCandlesticksAsync(tokenAddress);

      } catch (dbError: any) {
        console.error('Database error in handleSellTokenEvent (continuing with indexer):', {
          error: dbError.message,
          tokenAddress
        });
        // Don't throw - let indexer continue processing other events
      }
    } catch (error) {
      console.error("Error in handleSellTokenEvent:", error);
    }
  }

  async function handleTokenClaimedEvent(event: any, header: any, rawEvent: any) {
    try {
      console.log('=== TokenClaimed Event ===');
      console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

      const {
        timestamp: blockTimestamp,
      } = header;

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      const ownerAddress = event?.args?.caller;
      const tokenAddress = event?.args?.token_address;
      const amountString = event?.args?.amount?.toString() || '0';

      // Keep original BigInt value for calculations
      const amountBigInt = BigInt(amountString);

      // Convert to human-readable string for display/storage
      const amount = formatBigIntToFloat(amountBigInt);

      try {
        const existingShareholder = await db.query.sharesTokenUser.findFirst({
          where: and(
            eq(sharesTokenUser.owner, ownerAddress),
            eq(sharesTokenUser.token_address, tokenAddress)
          )
        });

        if (existingShareholder) {
          // Use BigInt arithmetic for calculations
          const existingAmountOwnedBigInt = BigInt(existingShareholder.amount_owned || '0');
          const existingAmountClaimedBigInt = BigInt(existingShareholder.amount_claimed || '0');
          const updatedAmountOwnedBigInt = existingAmountOwnedBigInt - amountBigInt;
          const updatedAmountClaimedBigInt = existingAmountClaimedBigInt + amountBigInt;

          // Convert to human-readable strings for storage
          const updatedAmountOwned = formatBigIntToFloat(updatedAmountOwnedBigInt);
          const updatedAmountClaimed = formatBigIntToFloat(updatedAmountClaimedBigInt);

          await db.update(sharesTokenUser)
            .set({
              amount_owned: updatedAmountOwned,
              amount_claimed: updatedAmountClaimed,
              is_claimable: updatedAmountOwned !== '0',
            })
            .where(and(
              eq(sharesTokenUser.owner, ownerAddress),
              eq(sharesTokenUser.token_address, tokenAddress)
            ));

          console.log('Shareholder Record Updated for Claim');
        } else {
          console.log("Shareholder not found for claim - this shouldn't happen");
        }

        const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

        // Use upsert pattern to prevent duplicates (following nestjs indexer pattern)
        try {
          await db.insert(tokenTransactions)
            .values({
              transfer_id: transferId,
              network: 'starknet-sepolia',
              block_timestamp: blockTimestamp,
              transaction_hash: transactionHash,
              memecoin_address: tokenAddress,
              owner_address: ownerAddress,
              amount: amount,
              transaction_type: 'claim',
              created_at: new Date(),
            })
            .onConflictDoNothing(); // Prevent duplicates
        } catch (error: any) {
          console.error('Failed to insert claim transaction:', {
            error: error,
            code: error.code,
            message: error.message,
            detail: error.detail
          });
        }

        console.log('Claim Transaction Record Created');
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Claim transaction already exists (unique constraint violation):', {
            transfer_id: `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`,
            transaction_hash: transactionHash
          });
        } else {
          console.error('Database error in handleTokenClaimedEvent:', {
            error: dbError,
            code: dbError.code,
            message: dbError.message,
            detail: dbError.detail
          });
        }
      }
    } catch (error) {
      console.error("Error in handleTokenClaimedEvent:", error);
    }
  }

  async function handleLiquidityCreatedEvent(event: any, header: any, rawEvent: any) {
    try {
      console.log('=== LiquidityCreated Event ===');
      console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

      const {
        timestamp: blockTimestamp,
      } = header;

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      console.log("events args", event?.args);
      const tokenAddress = event?.args?.asset;
     
      let finalPrice = event?.args?.final_price?.toString() || '0';
      let finalMarketCap = event?.args?.final_market_cap?.toString() || '0';

      try {
        const existingLaunch = await db.query.tokenLaunch.findFirst({
          where: eq(tokenLaunch.memecoin_address, tokenAddress)
        });

        console.log("existingLaunch", existingLaunch);
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
        const initialPoolSupply = existingLaunch?.initial_pool_supply_dex || '0';
        const newLiquidityRaised = existingLaunch?.liquidity_raised || '0';
        finalPrice = Number(initialPoolSupply) > 0 ? (Number(newLiquidityRaised) / Number(initialPoolSupply)).toString() : '0';
        finalMarketCap = (Number(existingLaunch?.total_supply) * Number(finalPrice)).toString();

        const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

        try {
          withTimeout(async () => {
            await db.insert(tokenTransactions)
              .values({
                transfer_id: transferId,
              network: 'starknet-sepolia',
              block_timestamp: blockTimestamp,
              transaction_hash: transactionHash,
              memecoin_address: tokenAddress,
              transaction_type: 'liquidity_created',
              created_at: new Date(),
            })
            .onConflictDoNothing(); // Prevent duplicates
          }, 10000);
        } catch (error: any) {
          console.error('Failed to insert liquidity created transaction:', {
            error: error,
            code: error.code,
            message: error.message,
            detail: error.detail
          });
        }

        console.log('Liquidity Created Transaction Record Created');
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Liquidity created transaction already exists (unique constraint violation):', {
            transfer_id: `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`,
            transaction_hash: transactionHash
          });
        } else {
          console.error('Database error in handleLiquidityCreatedEvent:', {
            error: dbError,
            code: dbError.code,
            message: dbError.message,
            detail: dbError.detail
          });
        }
      }
    } catch (error) {
      console.error("Error in handleLiquidityCreatedEvent:", error);
    }
  }

  async function handleLiquidityCanBeAddedEvent(event: any, header: any, rawEvent: any) {
    try {
      console.log('=== LiquidityCanBeAdded Event ===');
      console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

      const {
        timestamp: blockTimestamp,
      } = header;

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      const tokenAddress = event?.args?.asset;

      try {
        const existingLaunch = await db.query.tokenLaunch.findFirst({
          where: eq(tokenLaunch.memecoin_address, tokenAddress)
        });

        console.log("existingLaunch", existingLaunch);

        if (existingLaunch) {
          await db.update(tokenLaunch)
            .set({
              is_liquidity_added: false,
            })
            .where(eq(tokenLaunch.memecoin_address, tokenAddress));

          console.log('Launch Record Updated - Liquidity Can Be Added');
        }

        const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

        try {
         withTimeout( async () => {
          await db.insert(tokenTransactions)
            .values({
              transfer_id: transferId,
              network: 'starknet-sepolia',
              block_timestamp: blockTimestamp,
              transaction_hash: transactionHash,
              memecoin_address: tokenAddress,
              transaction_type: 'liquidity_can_be_added',
              created_at: new Date(),
            })
            .onConflictDoNothing(); // Prevent duplicates
         }, 10000);
        } catch (error: any) {
          console.error('Failed to insert liquidity can be added transaction:', {
            error: error,
            code: error.code,
            message: error.message,
            detail: error.detail
          });
        }

        console.log('Liquidity Can Be Added Transaction Record Created');
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Liquidity can be added transaction already exists (unique constraint violation):', {
            transfer_id: `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`,
            transaction_hash: transactionHash
          });
        } else {
          console.error('Database error in handleLiquidityCanBeAddedEvent:', {
            error: dbError,
            code: dbError.code,
            message: dbError.message,
            detail: dbError.detail
          });
        }
      }
    } catch (error) {
      console.error("Error in handleLiquidityCanBeAddedEvent:", error);
    }
  }

  async function handleCreatorFeeDistributedEvent(event: any, header: any, rawEvent: any) {
    try {
      console.log('=== CreatorFeeDistributed Event ===');
      console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

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

        try {
          await db.insert(tokenTransactions)
            .values({
              transfer_id: transferId,
              network: 'starknet-sepolia',
              block_timestamp: blockTimestamp,
              transaction_hash: transactionHash,
              memecoin_address: tokenAddress,
              transaction_type: 'creator_fee_distributed',
              created_at: new Date(),
            })
            .onConflictDoNothing(); // Prevent duplicates
        } catch (error: any) {
          console.error('Failed to insert creator fee distributed transaction:', {
            error: error,
            code: error.code,
            message: error.message,
            detail: error.detail
          });
        }

        console.log('Creator Fee Distributed Transaction Record Created');
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Creator fee distributed transaction already exists (unique constraint violation):', {
            transfer_id: `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`,
            transaction_hash: transactionHash
          });
        } else {
          console.error('Database error in handleCreatorFeeDistributedEvent:', {
            error: dbError,
            code: dbError.code,
            message: dbError.message,
            detail: dbError.detail
          });
        }
      }
    } catch (error) {
      console.error("Error in handleCreatorFeeDistributedEvent:", error);
    }
  }
}
