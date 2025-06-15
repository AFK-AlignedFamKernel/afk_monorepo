import { defineIndexer } from '@apibara/indexer';
import { useLogger } from '@apibara/indexer/plugins';
import { drizzleStorage, useDrizzleStorage } from '@apibara/plugin-drizzle';
import { Abi, decodeEvent, StarknetStream } from '@apibara/starknet';
import { byteArray, constants, encode, hash } from 'starknet';
import { ApibaraRuntimeConfig } from 'apibara/types';
import { db } from 'indexer-v2-db';
import { ABI as launchpadABI } from './abi/launchpad.abi';
import { formatUnits } from 'viem';
import { randomUUID } from 'crypto';
import { tokenDeploy, tokenLaunch, tokenMetadata, tokenTransactions, sharesTokenUser } from 'indexer-v2-db/schema';
import { eq, and, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const CREATE_TOKEN = hash.getSelectorFromName('CreateToken') as `0x${string}`;
const CREATE_LAUNCH = hash.getSelectorFromName('CreateLaunch') as `0x${string}`;
const BUY_TOKEN = hash.getSelectorFromName('BuyToken') as `0x${string}`;
const SELL_TOKEN = hash.getSelectorFromName('SellToken') as `0x${string}`;
const METADATA_COIN_ADDED = hash.getSelectorFromName('MetadataCoinAdded') as `0x${string}`;

const KNOWN_EVENT_KEYS = [
  CREATE_TOKEN,
  CREATE_LAUNCH,
  BUY_TOKEN,
  SELL_TOKEN,
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
          address: "0x57ccd649f0df9ca80debb4bd7946bb6267785c74998f4de94514f70a8f691a3" as `0x${string}`,
          keys: [CREATE_TOKEN],
        },
        {
          address: "0x57ccd649f0df9ca80debb4bd7946bb6267785c74998f4de94514f70a8f691a3" as `0x${string}`,
          keys: [CREATE_LAUNCH],
        },
        {
          address: "0x57ccd649f0df9ca80debb4bd7946bb6267785c74998f4de94514f70a8f691a3" as `0x${string}`,
          keys: [BUY_TOKEN],
        },
        {
          address: "0x57ccd649f0df9ca80debb4bd7946bb6267785c74998f4de94514f70a8f691a3" as `0x${string}`,
          keys: [SELL_TOKEN],
        },
        {
          address: "0x57ccd649f0df9ca80debb4bd7946bb6267785c74998f4de94514f70a8f691a3" as `0x${string}`,
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
        // token_transactions: 'id',
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

      console.log("timestamp", header.timestamp)



      for (const event of events) {
        if (event.transactionHash) {
          logger.log(`Found event ${event.keys[0]}`);

          try {
            let sanitizedEventKey = encode.sanitizeHex(event.keys[0]);

            if (event.keys[0] == encode.sanitizeHex(CREATE_TOKEN)) {
              console.log("event createToken")
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::CreateToken',
              });
              console.log("decodeEvent", decodeEvent)
              // await handleCreateTokenEvent(decodedEvent, event.address, header, event);
            }
            if (event?.keys[0] == encode.sanitizeHex(CREATE_LAUNCH)) {
              console.log("event CreateLaunch")
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::CreateLaunch',
              });
              // await handleCreateLaunch(decodedEvent, header, event);
            }
            if (event?.keys[0] == encode.sanitizeHex(METADATA_COIN_ADDED)) {
              console.log("event Metadata")
              try {
                const decodedEvent = decodeEvent({
                  abi: launchpadABI as Abi,
                  event,
                  eventName: 'afk_launchpad::types::launchpad_types::MetadataCoinAdded',
                });
                await handleMetadataEvent(decodedEvent, header, event);
              } catch (error) {
                console.error("Error processing metadata event:", error);
                // Don't throw here to allow processing to continue
              }
            }
            if (event?.keys[0] == encode.sanitizeHex(BUY_TOKEN)) {
              console.log("event Buy")
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::BuyToken',
              });
              await handleBuyTokenEvent(decodedEvent, header, event);
            } else if (event?.keys[0] == encode.sanitizeHex(SELL_TOKEN)) {
              console.log("event Sell")
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::SellToken',
              });
              await handleSellTokenEvent(decodedEvent, header, event);
            }
            else if (event?.keys[0] === "574011777754438778741091000026813809688738065270168948370966127226855794970" as `0x${string}`

              || event?.keys[0] == encode.sanitizeHex(BUY_TOKEN)
              || event?.keys[0] == "0x00cb205b7506d21e6fe528cd4ae2ce69ae63eb6fc10a2d0234dd39ef3d349797" as `0x${string}`

            ) {

              console.log("event Buy")
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::BuyToken',
              });
              await handleBuyTokenEvent(decodedEvent, header, event);
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
      console.log("event", event)

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      const tokenAddress = event?.args?.token_address;
      const ownerAddress = event?.args?.caller;
      const initialSupply = formatTokenAmount(event?.args?.initial_supply?.toString() || '0');
      const totalSupply = formatTokenAmount(event?.args?.total_supply?.toString() || '0');

      const symbol = byteArray.stringFromByteArray(event?.args?.symbol);
      const name = byteArray.stringFromByteArray(event?.args?.name);
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
        // // Check if token already exists
        // const existingToken = await db.query.tokenDeploy.findFirst({
        //   where: or(
        //     eq(tokenDeploy.memecoin_address, tokenAddress),
        //     eq(tokenDeploy.transaction_hash, transactionHash)
        //   )
        // });

        // if (existingToken) {
        //   console.log('Token already exists, skipping creation:', {
        //     memecoin_address: existingToken.memecoin_address,
        //     transaction_hash: existingToken.transaction_hash
        //   });
        //   return;
        // }

        // Insert new token
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
        // Handle specific database errors
        if (dbError.code === '23505') { // Unique violation
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
        // Continue execution without throwing
      }
    } catch (error) {
      console.error("Error in handleCreateTokenEvent:", error);
      // Don't throw to allow processing to continue
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
        // Check if launch already exists
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

        // Get token deploy info for name and symbol
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

        // Update token deploy to mark as launched
        await db.update(tokenDeploy)
          .set({ is_launched: true })
          .where(eq(tokenDeploy.transaction_hash, event?.args?.token_deploy_tx_hash));

        console.log('Token Deploy Updated to Launched');
      } catch (dbError: any) {
        if (dbError.code === '23505') { // Unique violation
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
        // Check if metadata already exists
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

        // Update token deploy record if it exists
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

        // Update token launch record if it exists
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
        if (dbError.code === '23505') { // Unique violation
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

      console.log("event", event)

      // Generate a unique transfer ID using transaction hash and event index
      const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

      try {
        // Check if transaction already exists
        console.log("transferId", transferId)
        // const existingTransaction = await db.query.tokenTransactions.findFirst({
        //   where: eq(tokenTransactions.transfer_id, transferId)
        // });

          // Try using raw query first to avoid id column issues
          const existingTransaction = await db.execute<{
            current_supply: string;
            liquidity_raised: string;
            total_token_holded: string;
            initial_pool_supply_dex: string;
            total_supply: string;
          }>(sql`
            SELECT 
              transfer_id,
              transaction_hash,
              transaction_type
            FROM token_transactions 
            WHERE transfer_id = ${transferId}
            LIMIT 1
          `);

        console.log("existingTransaction", existingTransaction)

        if (existingTransaction?.rows.length > 0) {
          console.log('Transaction already exists, skipping:', {
            transfer_id: transferId,
            transaction_hash: transactionHash
          });
          return;
        }

        const ownerAddress = event?.args?.caller;
        const tokenAddress = event?.args?.token_address;

        // Get values from args
        const amount = event?.args?.amount?.toString() || '0';
        const price = event?.args?.price?.toString() || '0';
        const protocolFee = event?.args?.protocol_fee?.toString() || '0';
        const lastPrice = event?.args?.last_price?.toString() || '0';
        const quoteAmount = event?.args?.quote_amount?.toString() || '0';

        // Handle timestamp properly
        const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
        const timestamp = new Date(Math.max(0, eventTimestampMs));

        // Get the launch record to update
        console.log("Getting launch record for token:", {
          tokenAddress,
          memecoin_address: tokenAddress
        });

        try {
          // Try using raw query first to avoid id column issues
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

          console.log("Launch record query result:", launchRecord);
          let currentLaunch = launchRecord.rows[0];

          if (!launchRecord || launchRecord.rows.length === 0) {
            console.log('Launch record not found for token:', tokenAddress);

            // Initialize default launch record
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
              
              console.log("insertResult", insertLaunch);
              
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


          // Calculate new values
          const newSupply = (BigInt(currentLaunch.current_supply || '0') - BigInt(amount)).toString();
          const newLiquidityRaised = (BigInt(currentLaunch.liquidity_raised || '0') + BigInt(quoteAmount)).toString();
          const newTotalTokenHolded = (BigInt(currentLaunch.total_token_holded || '0') + BigInt(amount)).toString();

          // Calculate new price based on liquidity and token supply
          const initPoolSupply = BigInt(currentLaunch.initial_pool_supply_dex || '0');
          const priceBuy = initPoolSupply > BigInt(0)
            ? (BigInt(newLiquidityRaised) / initPoolSupply).toString()
            : '0';

          // Calculate market cap
          const marketCap = (BigInt(currentLaunch.total_supply || '0') * BigInt(priceBuy)).toString();

          console.log("Calculated values for launch update:", {
            newSupply,
            newLiquidityRaised,
            newTotalTokenHolded,
            priceBuy,
            marketCap,
            current_supply: currentLaunch.current_supply,
            liquidity_raised: currentLaunch.liquidity_raised,
            total_token_holded: currentLaunch.total_token_holded,
            initial_pool_supply_dex: currentLaunch.initial_pool_supply_dex,
            total_supply: currentLaunch.total_supply
          });

          // Update launch record using raw query
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
          return; // Exit the function if we can't update the launch record
        }

        // Update or create shareholder record
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
          // Create transaction record
          console.log("create transferId", transferId)
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
          if (insertError.code === '42703') { // Column does not exist
            // Try inserting without the id field
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
            throw insertError; // Re-throw other errors
          }
        }
      } catch (dbError: any) {
        if (dbError.code === '23505') { // Unique violation
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

      // Generate a unique transfer ID using transaction hash and event index
      const transferId = `${transactionHash}_${rawEvent.eventIndexInTransaction || 0}`;

      const ownerAddress = event?.args?.caller;
      const tokenAddress = event?.args?.key_user;

      // Get values from args
      const amount = event?.args?.amount?.toString() || '0';
      const price = event?.args?.price?.toString() || '0';
      const protocolFee = event?.args?.protocol_fee?.toString() || '0';
      const lastPrice = event?.args?.last_price?.toString() || '0';
      const quoteAmount = event?.args?.coin_amount?.toString() || '0';

      // Handle timestamp properly
      const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
      const timestamp = new Date(Math.max(0, eventTimestampMs));

      try {
        // Get the launch record to update
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

        // Calculate new values
        const newSupply = (BigInt(currentLaunch.current_supply || '0') + BigInt(amount)).toString();
        const newLiquidityRaised = (BigInt(currentLaunch.liquidity_raised || '0') - BigInt(quoteAmount)).toString();
        const newTotalTokenHolded = (BigInt(currentLaunch.total_token_holded || '0') - BigInt(amount)).toString();

        // Calculate new price based on liquidity and token supply
        const initPoolSupply = BigInt(currentLaunch.initial_pool_supply_dex || '0');
        const priceSell = initPoolSupply > BigInt(0)
          ? (BigInt(newLiquidityRaised) / initPoolSupply).toString()
          : '0';

        // Calculate market cap
        const marketCap = (BigInt(currentLaunch.total_supply || '0') * BigInt(priceSell)).toString();

        console.log('Calculated Values:', {
          newSupply,
          newLiquidityRaised,
          newTotalTokenHolded,
          priceSell,
          marketCap
        });

        // Update launch record
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

        // Update shareholder record
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

        // Create transaction record
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
        // Continue execution without throwing
      }
    } catch (error) {
      console.error("Error in handleSellTokenEvent:", error);
      // Don't throw to allow processing to continue
    }
  }
} 