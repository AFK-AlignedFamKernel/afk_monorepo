import { tokenDeploy, tokenLaunch, tokenMetadata, tokenTransactions, sharesTokenUser } from 'indexer-v2-db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { useDrizzleStorage } from '@apibara/plugin-drizzle';

interface TokenDeployData {
  transaction_hash: string;
  network?: string;
  block_hash?: string;
  block_number?: bigint;
  block_timestamp?: Date;
  memecoin_address: string;
  owner_address?: string;
  name?: string;
  symbol?: string;
  initial_supply?: string;
  total_supply?: string;
  created_at?: Date;
  is_launched?: boolean;
  description?: string;
  ipfs_hash?: string;
  ipfs_metadata_url?: string;
  nostr_id?: string;
  url?: string;
  github?: string;
  image_url?: string;
  metadata?: any;
  nostr_event_id?: string;
  telegram?: string;
  twitter?: string;
  website?: string;
}

interface TokenLaunchData {
  transaction_hash: string;
  network?: string;
  block_hash?: string;
  owner_address?: string;
  block_number?: bigint;
  block_timestamp?: Date;
  memecoin_address: string;
  quote_token?: string;
  exchange_name?: string;
  total_supply?: string;
  threshold_liquidity?: string;
  current_supply?: string;
  liquidity_raised?: string;
  is_liquidity_added?: boolean;
  total_token_holded?: string;
  price?: string;
  bonding_type?: string;
  created_at?: Date;
  initial_pool_supply_dex?: string;
  market_cap?: string;
  description?: string;
  github?: string;
  image_url?: string;
  ipfs_hash?: string;
  ipfs_metadata_url?: string;
  metadata?: any;
  nostr_event_id?: string;
  nostr_id?: string;
  telegram?: string;
  twitter?: string;
  url?: string;
  website?: string;
  name?: string;
  symbol?: string;
  token_deploy_tx_hash?: string;
}

interface TokenMetadataData {
  transaction_hash: string;
  network?: string;
  block_hash?: string;
  block_number?: bigint;
  contract_address?: string;
  block_timestamp?: Date;
  memecoin_address: string;
  url?: string;
  nostr_id?: string;
  name?: string;
  symbol?: string;
  created_at?: Date;
  nostr_event_id?: string;
  twitter?: string;
  telegram?: string;
  github?: string;
  website?: string;
}

interface TokenTransactionData {
  transfer_id: string;
  network?: string;
  block_hash?: string;
  block_number?: bigint;
  block_timestamp?: Date;
  transaction_hash?: string;
  memecoin_address?: string;
  owner_address?: string;
  last_price?: string;
  quote_amount?: string;
  coin_received?: string;
  initial_supply?: string;
  created_at?: Date;
  total_supply?: string;
  current_supply?: string;
  liquidity_raised?: string;
  price?: string;
  protocol_fee?: string;
  amount?: string;
  transaction_type?: string;
  time_stamp?: Date;
}

export async function upsertTokenDeploy(data: TokenDeployData) {
  const { db } = useDrizzleStorage();
  try {
    return db.insert(tokenDeploy).values(data).onConflictDoUpdate({
      target: tokenDeploy.transaction_hash,
      set: data,
    });
  } catch (error) {
    console.error("Error in upsertTokenDeploy:", error);
    return null;
  }
}

export async function upsertTokenLaunch(data: TokenLaunchData) {
  const { db } = useDrizzleStorage();
  try {
    return db.insert(tokenLaunch).values(data).onConflictDoUpdate({
      target: tokenLaunch.transaction_hash,
      set: data,
    });
  } catch (error) {
    console.error("Error in upsertTokenLaunch:", error);
    return null;
  }
}

export async function upsertTokenMetadata(data: TokenMetadataData) {
  const { db } = useDrizzleStorage();
  try {
    // First upsert the metadata
    const result = await db.insert(tokenMetadata).values(data).onConflictDoUpdate({
      target: tokenMetadata.transaction_hash,
      set: data,
    });

    // Then update the token deploy and launch records with the metadata
    await db.update(tokenDeploy)
      .set({
        url: data.url,
        nostr_id: data.nostr_id,
        nostr_event_id: data.nostr_event_id,
        twitter: data.twitter,
        telegram: data.telegram,
        github: data.github,
        website: data.website,
      })
      .where(eq(tokenDeploy.memecoin_address, data.memecoin_address));

    await db.update(tokenLaunch)
      .set({
        url: data.url,
        nostr_id: data.nostr_id,
        nostr_event_id: data.nostr_event_id,
        twitter: data.twitter,
        telegram: data.telegram,
        github: data.github,
        website: data.website,
      })
      .where(eq(tokenLaunch.memecoin_address, data.memecoin_address));

    return result;
  } catch (error) {
    console.error("Error in upsertTokenMetadata:", error);
    return null;
  }
}

export async function upsertTokenTransaction(data: TokenTransactionData) {
  const { db } = useDrizzleStorage();
  try {
    // First upsert the transaction
    const result = await db.insert(tokenTransactions).values(data).onConflictDoUpdate({
      target: tokenTransactions.transfer_id,
      set: data,
    });

    // Then update the launch record with new liquidity and supply
    if (data.memecoin_address) {
      const launchRecord = await db
        .select()
        .from(tokenLaunch)
        .where(eq(tokenLaunch.memecoin_address, data.memecoin_address))
        .limit(1);

      if (launchRecord && launchRecord.length > 0) {
        const currentLaunch = launchRecord[0];
        const newSupply = BigInt(currentLaunch.current_supply || '0') - BigInt(data.amount || '0');
        const newLiquidityRaised = BigInt(currentLaunch.liquidity_raised || '0') + BigInt(data.quote_amount || '0');
        const newTotalTokenHolded = BigInt(currentLaunch.total_token_holded || '0') + BigInt(data.amount || '0');

        // Calculate new price based on liquidity and token supply
        const initPoolSupply = BigInt(currentLaunch.initial_pool_supply_dex || '0');
        const price = initPoolSupply > BigInt(0) ? newLiquidityRaised / initPoolSupply : BigInt(0);

        // Calculate market cap
        const marketCap = (BigInt(currentLaunch.total_supply || '0') * price).toString();

        await db.update(tokenLaunch)
          .set({
            current_supply: newSupply.toString(),
            liquidity_raised: newLiquidityRaised.toString(),
            total_token_holded: newTotalTokenHolded.toString(),
            price: price.toString(),
            market_cap: marketCap,
          })
          .where(eq(tokenLaunch.memecoin_address, data.memecoin_address));

        // Update or create shareholder record
        if (data.owner_address) {
          const shareholderId = `${data.owner_address}_${data.memecoin_address}`;
          const existingShareholder = await db
            .select()
            .from(sharesTokenUser)
            .where(eq(sharesTokenUser.id, shareholderId))
            .limit(1);

          const newAmountOwned = existingShareholder.length > 0
            ? BigInt(existingShareholder[0].amount_owned || '0') + BigInt(data.amount || '0')
            : BigInt(data.amount || '0');

          const newAmountBuy = existingShareholder.length > 0
            ? BigInt(existingShareholder[0].amount_buy || '0') + BigInt(data.amount || '0')
            : BigInt(data.amount || '0');

          const newTotalPaid = existingShareholder.length > 0
            ? BigInt(existingShareholder[0].total_paid || '0') + BigInt(data.quote_amount || '0')
            : BigInt(data.quote_amount || '0');

          await db.insert(sharesTokenUser)
            .values({
              id: shareholderId,
              owner: data.owner_address,
              token_address: data.memecoin_address,
              amount_owned: newAmountOwned.toString(),
              amount_buy: newAmountBuy.toString(),
              total_paid: newTotalPaid.toString(),
              is_claimable: true,
            })
            .onConflictDoUpdate({
              target: sharesTokenUser.id,
              set: {
                amount_owned: newAmountOwned.toString(),
                amount_buy: newAmountBuy.toString(),
                total_paid: newTotalPaid.toString(),
                is_claimable: true,
              },
            });
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error in upsertTokenTransaction:", error);
    return null;
  }
}

export async function getTokenDeploy(transactionHash: string) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .select()
      .from(tokenDeploy)
      .where(eq(tokenDeploy.transaction_hash, transactionHash))
      .limit(1);
  } catch (error) {
    console.log("error getTokenDeploy", error);
  }
}

export async function getTokenLaunch(transactionHash: string) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .select()
      .from(tokenLaunch)
      .where(eq(tokenLaunch.transaction_hash, transactionHash))
      .limit(1);
  } catch (error) {
    console.log("error getTokenLaunch", error);
  }
}

export async function getTokenMetadata(transactionHash: string) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .select()
      .from(tokenMetadata)
      .where(eq(tokenMetadata.transaction_hash, transactionHash))
      .limit(1);
  } catch (error) {
    console.log("error getTokenMetadata", error);
  }
}

export async function getTokenTransaction(transferId: string) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.transfer_id, transferId))
      .limit(1);
  } catch (error) {
    console.log("error getTokenTransaction", error);
  }
}

// New helper functions to get metadata from token or launch models
export async function getTokenDeployWithMetadata(memecoinAddress: string) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .select()
      .from(tokenDeploy)
      .where(eq(tokenDeploy.memecoin_address, memecoinAddress))
      .limit(1);
  } catch (error) {
    console.log("error getTokenDeployWithMetadata", error);
  }
}

export async function getTokenLaunchWithMetadata(memecoinAddress: string) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .select()
      .from(tokenLaunch)
      .where(eq(tokenLaunch.memecoin_address, memecoinAddress))
      .limit(1);
  } catch (error) {
    console.log("error getTokenLaunchWithMetadata", error);
  }
}

export async function getMetadataByMemecoinAddress(memecoinAddress: string) {
  try {
    const { db } = useDrizzleStorage();
    return db
      .select()
      .from(tokenMetadata)
      .where(eq(tokenMetadata.memecoin_address, memecoinAddress))
      .limit(1);
  } catch (error) {
    console.log("error getMetadataByMemecoinAddress", error);
  }
} 