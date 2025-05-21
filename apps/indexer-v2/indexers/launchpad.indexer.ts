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
import { eq } from 'drizzle-orm';

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
          address: "0x711392008ddacbe090c87a8cee79275f58a12b853dcc6fdb23bf8dd74c2899d" as `0x${string}`,
          keys: [CREATE_TOKEN],
        },
        {
          address: "0x711392008ddacbe090c87a8cee79275f58a12b853dcc6fdb23bf8dd74c2899d" as `0x${string}`,
          keys: [CREATE_LAUNCH],
        },
        {
          address: "0x711392008ddacbe090c87a8cee79275f58a12b853dcc6fdb23bf8dd74c2899d" as `0x${string}`,
          keys: [BUY_TOKEN],
        },
        {
          address: "0x711392008ddacbe090c87a8cee79275f58a12b853dcc6fdb23bf8dd74c2899d" as `0x${string}`,
          keys: [SELL_TOKEN],
        },
        {
          address: "0x711392008ddacbe090c87a8cee79275f58a12b853dcc6fdb23bf8dd74c2899d" as `0x${string}`,
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
        shares_token_user: 'id'
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
              console.log("decodeEvent",decodeEvent)
              await handleCreateTokenEvent(decodedEvent, event.address, header, event);
            }
            if (event?.keys[0] == encode.sanitizeHex(CREATE_LAUNCH)) {
              console.log("event CreateLaunch")
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::CreateLaunch',
              });
              await handleCreateLaunch(decodedEvent, header, event);
            }
            if (event?.keys[0] == encode.sanitizeHex(METADATA_COIN_ADDED)) {
              console.log("event Metadata")
              try {
                const decodedEvent = decodeEvent({
                  abi: launchpadABI as Abi,
                  event,
                  eventName: 'afk_launchpad::types::launchpad_types::MetadataCoinAdded',
                });
                // await handleMetadataEvent(decodedEvent, header, event);
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
              // await handleSellTokenEvent(decodedEvent, header, event);
            }
            else if (event?.keys[0] === "0x00cb205b7506d21e6fe528cd4ae2ce69ae63eb6fc10a2d0234dd39ef3d349797") {
              console.log("event createToken")
              const decodedEvent = decodeEvent({
                abi: launchpadABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::CreateToken',
              });
              await handleCreateTokenEvent(decodedEvent, event.address, header, event);

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

      const symbol = byteArray.stringFromByteArray( event?.args?.symbol);
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

      await db.insert(tokenDeploy).values({
        transaction_hash: transactionHash,
        network: 'starknet-sepolia',
        block_timestamp: blockTimestamp,
        memecoin_address: tokenAddress,
        owner_address: ownerAddress,
        name: event?.args?.name,
        symbol: event?.args?.symbol,
        initial_supply: initialSupply,
        total_supply: totalSupply,
        created_at: new Date(),
        is_launched: false,
      });

      console.log('Token Deploy Record Created');
    } catch (error) {
      console.error("Error in handleCreateTokenEvent:", error);
      throw error;
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

      // Get token deploy info for name and symbol
      const tokenDeployInfo = await db
        .select()
        .from(tokenDeploy)
        .where(eq(tokenDeploy.transaction_hash, event?.args?.token_deploy_tx_hash))
        .limit(1);

      const launchData = {
        memecoin_address: event?.args?.memecoin_address,
        owner_address: event?.args?.owner,
        name: tokenDeployInfo[0]?.name || null,
        symbol: tokenDeployInfo[0]?.symbol || null,
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
      };

      console.log('Processed Launch Data:', launchData);

      await db.insert(tokenLaunch).values({
        transaction_hash: transactionHash,
        network: 'starknet-sepolia',
        block_timestamp: blockTimestamp,
        ...launchData,
        created_at: new Date(),
      });

      console.log('Token Launch Record Created');

      // Update token deploy to mark as launched
      await db.update(tokenDeploy)
        .set({ is_launched: true })
        .where(eq(tokenDeploy.transaction_hash, event?.args?.token_deploy_tx_hash));

      console.log('Token Deploy Updated to Launched');
    } catch (error) {
      console.error("Error in handleCreateLaunch:", error);
      throw error;
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

      const metadataData = {
        memecoin_address: event?.args?.token_address || null,
        url: event?.args?.url || null,
        nostr_id: event?.args?.nostr_id || null,
        nostr_event_id: event?.args?.nostr_event_id || null,
        twitter: event?.args?.twitter || null,
        telegram: event?.args?.telegram || null,
        github: event?.args?.github || null,
        website: event?.args?.website || null,
      };

      console.log('Processed Metadata:', metadataData);

      await db.insert(tokenMetadata).values({
        transaction_hash: transactionHash,
        network: 'starknet-sepolia',
        block_timestamp: blockTimestamp,
        ...metadataData,
        created_at: new Date(),
      });

      console.log('Token Metadata Record Created');

      // Update token deploy record if it exists
      const existingDeploy = await db
        .select()
        .from(tokenDeploy)
        .where(eq(tokenDeploy.memecoin_address, metadataData.memecoin_address))
        .limit(1);

      if (existingDeploy.length > 0) {
        await db.update(tokenDeploy)
          .set({
            name: event?.args?.name || existingDeploy[0].name,
            symbol: event?.args?.symbol || existingDeploy[0].symbol,
          })
          .where(eq(tokenDeploy.memecoin_address, metadataData.memecoin_address));
        console.log('Token Deploy Record Updated with Metadata');
      }

      // Update token launch record if it exists
      const existingLaunch = await db
        .select()
        .from(tokenLaunch)
        .where(eq(tokenLaunch.memecoin_address, metadataData.memecoin_address))
        .limit(1);

      if (existingLaunch.length > 0) {
        await db.update(tokenLaunch)
          .set({
            name: event?.args?.name || existingLaunch[0].name,
            symbol: event?.args?.symbol || existingLaunch[0].symbol,
          })
          .where(eq(tokenLaunch.memecoin_address, metadataData.memecoin_address));
        console.log('Token Launch Record Updated with Metadata');
      }

    } catch (error) {
      console.error("Error in handleMetadataEvent:", error);
      // Don't re-throw to allow processing to continue
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

      // Handle timestamp properly - use block timestamp if event timestamp is invalid
      const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestamp;
      const timestamp = new Date(Math.max(0, eventTimestampMs));

      console.log('Processed Buy Values:', {
        transferId,
        ownerAddress,
        tokenAddress,
        amount,
        price,
        protocolFee,
        lastPrice,
        quoteAmount,
        eventTimestamp: eventTimestampMs,
        blockTimestamp,
        timestamp: timestamp.toISOString()
      });

      // Get the launch record to update
      const launchRecord = await db
        .select()
        .from(tokenLaunch)
        .where(eq(tokenLaunch.memecoin_address, tokenAddress))
        .limit(1);

      console.log('Current Launch Record:', launchRecord[0]);

      // Calculate new values
      const currentLaunch = launchRecord[0] || {
        current_supply: '0',
        liquidity_raised: '0',
        total_token_holded: '0',
        initial_pool_supply_dex: '0',
        total_supply: '0'
      };

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

      console.log('Calculated Values:', {
        newSupply,
        newLiquidityRaised,
        newTotalTokenHolded,
        priceBuy,
        marketCap
      });

      console.log("try upsert launch record");

      // Upsert launch record
      await db.insert(tokenLaunch)
        .values({
          transaction_hash: transactionHash,
          network: 'starknet-sepolia',
          block_timestamp: blockTimestamp,
          memecoin_address: tokenAddress,
          owner_address: ownerAddress,
          current_supply: newSupply,
          liquidity_raised: newLiquidityRaised,
          total_token_holded: newTotalTokenHolded,
          price: priceBuy,
          market_cap: marketCap,
          created_at: new Date(),
        })
        .onConflictDoUpdate({
          target: tokenLaunch.memecoin_address,
          set: {
            current_supply: newSupply,
            liquidity_raised: newLiquidityRaised,
            total_token_holded: newTotalTokenHolded,
            price: priceBuy,
            market_cap: marketCap,
          },
        });

      console.log('Launch Record Upserted');

      // Update or create shareholder record
      const shareholderId = `${ownerAddress}_${tokenAddress}`;
      const existingShareholder = await db
        .select()
        .from(sharesTokenUser)
        .where(eq(sharesTokenUser.id, shareholderId))
        .limit(1);

      console.log('Existing Shareholder:', existingShareholder[0]);

      const newAmountOwned = existingShareholder.length > 0
        ? (BigInt(existingShareholder[0].amount_owned || '0') + BigInt(amount)).toString()
        : amount;

      const newAmountBuy = existingShareholder.length > 0
        ? (BigInt(existingShareholder[0].amount_buy || '0') + BigInt(amount)).toString()
        : amount;

      const newTotalPaid = existingShareholder.length > 0
        ? (BigInt(existingShareholder[0].total_paid || '0') + BigInt(quoteAmount)).toString()
        : quoteAmount;

      console.log('New Shareholder Values:', {
        newAmountOwned,
        newAmountBuy,
        newTotalPaid
      });

      await db.insert(sharesTokenUser)
        .values({
          id: shareholderId,
          owner: ownerAddress,
          token_address: tokenAddress,
          amount_owned: newAmountOwned,
          amount_buy: newAmountBuy,
          total_paid: newTotalPaid,
          is_claimable: true,
        })
        .onConflictDoUpdate({
          target: sharesTokenUser.id,
          set: {
            amount_owned: newAmountOwned,
            amount_buy: newAmountBuy,
            total_paid: newTotalPaid,
            is_claimable: true,
          },
        });

      console.log('Shareholder Record Updated');

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
        transaction_type: 'buy',
        created_at: new Date(),
      });

      console.log('Transaction Record Created');
    } catch (error) {
      console.error("Error in handleBuyTokenEvent:", error);
    }
  }

  async function handleSellTokenEvent(event: any, header: any, rawEvent: any) {
    try {
      console.log('=== SellToken Event ===');
      console.log('Raw Event:', JSON.stringify(rawEvent, null, 2));

      const {
        blockNumber,
        blockHash: blockHashFelt,
        timestamp: blockTimestamp,
      } = header;

      const blockHash = encode.sanitizeHex(
        `0x${BigInt(blockHashFelt).toString(16)}`,
      );

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
      const blockTimestampMs = Number(blockTimestamp) * 1000;
      const eventTimestampMs = event?.args?.timestamp ? Number(event.args.timestamp) * 1000 : blockTimestampMs;
      const timestamp = new Date(Math.max(0, eventTimestampMs));

      console.log('Processed Sell Values:', {
        transferId,
        ownerAddress,
        tokenAddress,
        amount,
        price,
        protocolFee,
        lastPrice,
        quoteAmount,
        eventTimestamp: eventTimestampMs,
        blockTimestamp,
        timestamp: timestamp.toISOString()
      });

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
      const shareholderId = `${ownerAddress}_${tokenAddress}`;
      const existingShareholder = await db
        .select()
        .from(sharesTokenUser)
        .where(eq(sharesTokenUser.id, shareholderId))
        .limit(1);

      if (existingShareholder.length > 0) {
        const newAmountOwned = (BigInt(existingShareholder[0].amount_owned || '0') - BigInt(amount)).toString();
        const newAmountSell = (BigInt(existingShareholder[0].amount_sell || '0') + BigInt(amount)).toString();
        const newTotalPaid = (BigInt(existingShareholder[0].total_paid || '0') - BigInt(quoteAmount)).toString();

        await db.update(sharesTokenUser)
          .set({
            amount_owned: newAmountOwned,
            amount_sell: newAmountSell,
            total_paid: newTotalPaid,
            is_claimable: newAmountOwned !== '0',
          })
          .where(eq(sharesTokenUser.id, shareholderId));

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
    } catch (error) {
      console.error("Error in handleSellTokenEvent:", error);
      throw error; // Re-throw to ensure the error is properly handled
    }
  }
} 