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
      db,
      idColumn: {
        token_deploy: 'id',
        token_launch: 'id',
        token_metadata: 'id',
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

      console.log("timestamp", header.timestamp);

      console.log("events length", events?.length);
      for (const event of events) {
        if (event.transactionHash) {
          logger.log(`Found event ${event.keys[0]}`);

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
                const decodedEvent = decodeEvent({
                  abi: launchpadABI as Abi,
                  event,
                  eventName: 'afk_launchpad::types::launchpad_types::MetadataCoinAdded',
                });
                await handleMetadataEvent(decodedEvent, header, event);
              } catch (error) {
                console.error("Error processing metadata event:", error);
              }
            }
            if (event?.keys[0] == encode.sanitizeHex(BUY_TOKEN)) {
              console.log("event Buy");
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
        await db.insert(tokenDeploy).values({
          id: randomUUID(),
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

        console.log('Token Deploy Record Created');
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

      try {
        const existingLaunch = await db.query.tokenLaunch.findFirst({
          where: or(
            eq(tokenLaunch.transaction_hash, transactionHash),
            eq(tokenLaunch.memecoin_address, event?.args?.memecoin_address)
          )
        });

        if (existingLaunch) {
          console.log('Launch already exists, skipping creation:', {
            memecoin_address: existingLaunch.memecoin_address,
            transaction_hash: existingLaunch.transaction_hash
          });
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

        console.log('Processed Launch Data:', launchData);

        await db.insert(tokenLaunch).values(launchData);
        console.log('Token Launch Record Created');

        await db.update(tokenDeploy)
          .set({ is_launched: true })
          .where(eq(tokenDeploy.transaction_hash, event?.args?.token_deploy_tx_hash));

        console.log('Token Deploy Updated to Launched');
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Launch already exists (unique constraint violation):', {
            memecoin_address: event?.args?.memecoin_address,
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

      try {
        const existingMetadata = await db.query.tokenMetadata.findFirst({
          where: or(
            eq(tokenMetadata.transaction_hash, transactionHash),
            eq(tokenMetadata.memecoin_address, event?.args?.token_address)
          )
        });

        if (existingMetadata) {
          console.log('Metadata already exists, skipping creation:', {
            memecoin_address: existingMetadata.memecoin_address,
            transaction_hash: existingMetadata.transaction_hash
          });
          return;
        }

        const metadataData = {
          transaction_hash: transactionHash,
          network: 'starknet-sepolia',
          block_timestamp: blockTimestamp,
          memecoin_address: event?.args?.token_address || null,
          url: event?.args?.url || null,
          nostr_id: event?.args?.nostr_id || null,
          nostr_event_id: event?.args?.nostr_event_id || null,
          twitter: event?.args?.twitter || null,
          telegram: event?.args?.telegram || null,
          github: event?.args?.github || null,
          website: event?.args?.website || null,
          created_at: new Date(),
        };

        console.log('Processed Metadata:', metadataData);

        await db.insert(tokenMetadata).values(metadataData);
        console.log('Token Metadata Record Created');

        const existingDeploy = await db.query.tokenDeploy.findFirst({
          where: eq(tokenDeploy.memecoin_address, metadataData.memecoin_address)
        });

        if (existingDeploy) {
          await db.update(tokenDeploy)
            .set({
              name: event?.args?.name || existingDeploy.name,
              symbol: event?.args?.symbol || existingDeploy.symbol,
            })
            .where(eq(tokenDeploy.memecoin_address, metadataData.memecoin_address));
          console.log('Token Deploy Record Updated with Metadata');
        }

        const existingLaunch = await db.query.tokenLaunch.findFirst({
          where: eq(tokenLaunch.memecoin_address, metadataData.memecoin_address)
        });

        if (existingLaunch) {
          await db.update(tokenLaunch)
            .set({
              name: event?.args?.name || existingLaunch.name,
              symbol: event?.args?.symbol || existingLaunch.symbol,
            })
            .where(eq(tokenLaunch.memecoin_address, metadataData.memecoin_address));
          console.log('Token Launch Record Updated with Metadata');
        }
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Metadata already exists (unique constraint violation):', {
            memecoin_address: event?.args?.token_address,
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

        const amount = event?.args?.amount?.toString() || '0';
        const price = event?.args?.price?.toString() || '0';
        const protocolFee = event?.args?.protocol_fee?.toString() || '0';
        const lastPrice = event?.args?.last_price?.toString() || '0';
        const quoteAmount = event?.args?.quote_amount?.toString() || '0';

        const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
        const timestamp = new Date(Math.max(0, eventTimestampMs));

        try {
          const launchRecord = await db.execute<{
            current_supply: string;
            liquidity_raised: string;
            total_token_holded: string;
            initial_pool_supply_dex: string;
            total_supply: string;
          }>(sql`
            SELECT 
              current_supply,
              liquidity_raised,
              total_token_holded,
              initial_pool_supply_dex,
              total_supply
            FROM token_launch 
            WHERE memecoin_address = ${tokenAddress}
            LIMIT 1
          `);

          let currentLaunch = launchRecord.rows[0];

          if (!launchRecord || launchRecord.rows.length === 0) {
            console.log('Launch record not found for token:', tokenAddress);

            const defaultLaunch = {
              memecoin_address: tokenAddress,
              owner_address: ownerAddress,
              current_supply: '0',
              liquidity_raised: '0',
              total_token_holded: '0',
              initial_pool_supply_dex: '0',
              total_supply: '0',
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

          const newSupply = (BigInt(currentLaunch.current_supply || '0') - BigInt(amount)).toString();
          const newLiquidityRaised = (BigInt(currentLaunch.liquidity_raised || '0') + BigInt(quoteAmount)).toString();
          const newTotalTokenHolded = (BigInt(currentLaunch.total_token_holded || '0') + BigInt(amount)).toString();

          const initPoolSupply = BigInt(currentLaunch.initial_pool_supply_dex || '0');
          const priceBuy = initPoolSupply > BigInt(0)
            ? (BigInt(newLiquidityRaised) / initPoolSupply).toString()
            : '0';

          const marketCap = (BigInt(currentLaunch.total_supply || '0') * BigInt(priceBuy)).toString();

          console.log("Calculated values for launch update:", {
            newSupply,
            newLiquidityRaised,
            newTotalTokenHolded,
            priceBuy,
            marketCap
          });

          try {
            const updateResult = await db.execute(sql`
              UPDATE token_launch 
              SET 
                current_supply = ${newSupply},
                liquidity_raised = ${newLiquidityRaised},
                total_token_holded = ${newTotalTokenHolded},
                price = ${priceBuy},
                market_cap = ${marketCap}
              WHERE memecoin_address = ${tokenAddress}
              RETURNING *
            `);

            if (!updateResult || updateResult.rows.length === 0) {
              console.error('Update operation returned no result:', {
                tokenAddress,
                newSupply,
                newLiquidityRaised,
                newTotalTokenHolded,
                priceBuy,
                marketCap
              });
              return;
            }
          } catch (updateError) {
            console.error('Failed to update launch record:', {
              error: updateError,
              tokenAddress,
              newSupply,
              newLiquidityRaised,
              newTotalTokenHolded,
              priceBuy,
              marketCap
            });
            return;
          }

          console.log('Launch Record Updated');
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

        const existingShareholder = await db.query.sharesTokenUser.findFirst({
          where: and(
            eq(sharesTokenUser.owner, ownerAddress),
            eq(sharesTokenUser.token_address, tokenAddress)
          )
        });

        const newAmountOwned = existingShareholder ? (BigInt(existingShareholder.amount_owned || '0') + BigInt(amount)).toString() : amount;
        const newAmountBuy = existingShareholder ? (BigInt(existingShareholder.amount_buy || '0') + BigInt(amount)).toString() : amount;
        const newTotalPaid = existingShareholder ? (BigInt(existingShareholder.total_paid || '0') + BigInt(quoteAmount)).toString() : quoteAmount;

        await db.insert(sharesTokenUser)
          .values({
            id: randomUUID(),
            owner: ownerAddress,
            token_address: tokenAddress,
            amount_owned: newAmountOwned,
            amount_buy: newAmountBuy,
            total_paid: newTotalPaid,
            is_claimable: true,
          })
          .onConflictDoUpdate({
            target: [sharesTokenUser.owner, sharesTokenUser.token_address],
            set: {
              amount_owned: newAmountOwned,
              amount_buy: newAmountBuy,
              total_paid: newTotalPaid,
              is_claimable: true,
            },
          });

        console.log('Shareholder Record Updated');

        try {
          await db.insert(tokenTransactions).values({
            id: randomUUID(),
            transfer_id: transferId,
            network: 'starknet-sepolia',
            block_timestamp: blockTimestamp,
            transaction_hash: transactionHash,
            memecoin_address: tokenAddress,
            owner_address: ownerAddress,
            last_price: lastPrice,
            quote_amount: quoteAmount,
            price: price,
            amount: amount,
            protocol_fee: protocolFee,
            time_stamp: timestamp,
            transaction_type: 'buy',
            created_at: new Date(),
          });

          console.log('Transaction Record Created');
        } catch (insertError: any) {
          if (insertError.code === '42703') {
            await db.insert(tokenTransactions).values({
              id: randomUUID(),
              transfer_id: transferId,
              network: 'starknet-sepolia',
              block_timestamp: blockTimestamp,
              transaction_hash: transactionHash,
              memecoin_address: tokenAddress,
              owner_address: ownerAddress,
              last_price: lastPrice,
              quote_amount: quoteAmount,
              price: price,
              amount: amount,
              protocol_fee: protocolFee,
              time_stamp: timestamp,
              transaction_type: 'buy',
              created_at: new Date(),
            });
            console.log('Transaction Record Created (without id)');
          } else {
            throw insertError;
          }
        }
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          console.log('Transaction already exists (unique constraint violation):', {
            transfer_id: transferId,
            transaction_hash: transactionHash
          });
        } else {
          console.error('Database error in handleBuyTokenEvent:', {
            error: dbError,
            code: dbError.code,
            message: dbError.message,
            detail: dbError.detail
          });
        }
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

      const amount = event?.args?.amount?.toString() || '0';
      const price = event?.args?.price?.toString() || '0';
      const protocolFee = event?.args?.protocol_fee?.toString() || '0';
      const lastPrice = event?.args?.last_price?.toString() || '0';
      const quoteAmount = event?.args?.coin_amount?.toString() || '0';

      const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
      const timestamp = new Date(Math.max(0, eventTimestampMs));

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

        const newSupply = (BigInt(currentLaunch.current_supply || '0') + BigInt(amount)).toString();
        const newLiquidityRaised = (BigInt(currentLaunch.liquidity_raised || '0') - BigInt(quoteAmount)).toString();
        const newTotalTokenHolded = (BigInt(currentLaunch.total_token_holded || '0') - BigInt(amount)).toString();

        const initPoolSupply = BigInt(currentLaunch.initial_pool_supply_dex || '0');
        const priceSell = initPoolSupply > BigInt(0)
          ? (BigInt(newLiquidityRaised) / initPoolSupply).toString()
          : '0';

        const marketCap = (BigInt(currentLaunch.total_supply || '0') * BigInt(priceSell)).toString();

        console.log('Calculated Values:', {
          newSupply,
          newLiquidityRaised,
          newTotalTokenHolded,
          priceSell,
          marketCap
        });

        await db.update(tokenLaunch)
          .set({
            current_supply: newSupply,
            liquidity_raised: newLiquidityRaised,
            total_token_holded: newTotalTokenHolded,
            price: priceSell,
            market_cap: marketCap,
          })
          .where(eq(tokenLaunch.memecoin_address, tokenAddress));

        console.log('Launch Record Updated');

        const existingShareholder = await db.query.sharesTokenUser.findFirst({
          where: and(
            eq(sharesTokenUser.owner, ownerAddress),
            eq(sharesTokenUser.token_address, tokenAddress)
          )
        });

        if (existingShareholder) {
          const updatedAmountOwned = (BigInt(existingShareholder.amount_owned || '0') - BigInt(amount)).toString();
          const updatedAmountSell = (BigInt(existingShareholder.amount_sell || '0') + BigInt(amount)).toString();
          const updatedTotalPaid = (BigInt(existingShareholder.total_paid || '0') - BigInt(quoteAmount)).toString();

          await db.update(sharesTokenUser)
            .set({
              amount_owned: updatedAmountOwned,
              amount_sell: updatedAmountSell,
              total_paid: updatedTotalPaid,
              is_claimable: updatedAmountOwned !== '0',
            })
            .where(and(
              eq(sharesTokenUser.owner, ownerAddress),
              eq(sharesTokenUser.token_address, tokenAddress)
            ));

          console.log('Shareholder Record Updated');
        }

        await db.insert(tokenTransactions).values({
          transfer_id: transferId,
          network: 'starknet-sepolia',
          block_timestamp: blockTimestamp,
          transaction_hash: transactionHash,
          memecoin_address: tokenAddress,
          owner_address: ownerAddress,
          last_price: lastPrice,
          quote_amount: quoteAmount,
          price: price,
          amount: amount,
          protocol_fee: protocolFee,
          time_stamp: timestamp,
          transaction_type: 'sell',
          created_at: new Date(),
        });

        console.log('Transaction Record Created');
      } catch (dbError) {
        console.error('Database error in handleSellTokenEvent:', dbError);
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
      const amount = event?.args?.amount?.toString() || '0';

      try {
        const existingShareholder = await db.query.sharesTokenUser.findFirst({
          where: and(
            eq(sharesTokenUser.owner, ownerAddress),
            eq(sharesTokenUser.token_address, tokenAddress)
          )
        });

        if (existingShareholder) {
          const updatedAmountOwned = (BigInt(existingShareholder.amount_owned || '0') - BigInt(amount)).toString();
          
          await db.update(sharesTokenUser)
            .set({
              amount_owned: updatedAmountOwned,
              is_claimable: updatedAmountOwned !== '0',
            })
            .where(and(
              eq(sharesTokenUser.owner, ownerAddress),
              eq(sharesTokenUser.token_address, tokenAddress)
            ));

          console.log('Shareholder Record Updated for Claim');
        }

        const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

        await db.insert(tokenTransactions).values({
          transfer_id: transferId,
          network: 'starknet-sepolia',
          block_timestamp: blockTimestamp,
          transaction_hash: transactionHash,
          memecoin_address: tokenAddress,
          owner_address: ownerAddress,
          amount: amount,
          transaction_type: 'claim',
          created_at: new Date(),
        });

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
