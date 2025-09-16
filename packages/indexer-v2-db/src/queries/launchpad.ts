import { eq, and } from "drizzle-orm";
import { sharesTokenUser, tokenDeploy, tokenLaunch, tokenMetadata, tokenTransactions, candlesticks } from "../schema.js";
import { db } from "../index.js";

/**
 * Get token, launchpad, and stats data for a given token address.
 * @param tokenAddress - The address of the token to query.
 * @returns An object containing token, launchpad, and stats data.
 */
export const getTokenFullInfo = async (tokenAddress: string) => {
  // Get token deployment info
  const token = await db.query.tokenDeploy.findFirst({
    where: eq(tokenDeploy.memecoin_address, tokenAddress),
  });

  // Get launchpad info
  const launchpad = await db.query.tokenLaunch.findFirst({
    where: eq(tokenLaunch.memecoin_address, tokenAddress),
  });

  // Get token metadata (stats)
  const stats = await db.query.tokenMetadata.findFirst({
    where: eq(tokenMetadata.memecoin_address, tokenAddress),
  });

  return {
    token,
    launchpad,
    stats,
  };
};

/**
 * Get all launchpad entries with pagination and ordering.
 * @param offset - The number of records to skip.
 * @param limit - The number of records to return.
 * @returns An array of launchpad entries.
 */
export const getAllLaunchpads = async ({
  offset = 0,
  limit = 10,
}: {
  offset?: number;
  limit?: number;
} = {}) => {
  const launches = await db.query.tokenLaunch.findMany({
    offset,
    limit,
    orderBy: (tokenLaunch, { desc }) => [desc(tokenLaunch.liquidity_raised)],
    columns: {
      memecoin_address: true,
      quote_token: true,
      price: true,
      total_supply: true,
      liquidity_raised: true,
      created_at: true,
      threshold_liquidity: true,
      bonding_type: true,
      total_token_holded: true,
      block_timestamp: true,
      is_liquidity_added: true,
      market_cap: true,
      name: true,
      symbol: true,
      url: true,
      initial_pool_supply_dex: true,
      twitter: true,
      website: true,
      // Add fields from tokenMetadata relation
      // metadata: {
      //   select: {
      //     name: true,
      //     symbol: true,
      //     twitter: true,
      //     website: true,
      //     telegram: true,
      //     image_url: true,
      //   },
      // },
      // Add fields from tokenDeploy relation
      // tokenDeploy: {
      //   select: {
      //     name: true,
      //     symbol: true,
      //   },
      // },
    },
  });
  return launches;
};

/**
 * Get all launchpad entries with pagination and ordering.
 * @param offset - The number of records to skip.
 * @param limit - The number of records to return.
 * @returns An array of launchpad entries.
 */
export const getAllTokens = async ({
  offset = 0,
  limit = 20,
}: {
  offset?: number;
  limit?: number;
} = {}) => {
  const tokens = await db.query.tokenDeploy.findMany({
    offset,
    limit,
    orderBy: (tokenDeploy, { desc }) => [desc(tokenDeploy.created_at)],
    columns: {
      memecoin_address: true,
      created_at: true,
      name: true,
      symbol: true,
      url: true,
      block_timestamp: true,
      website:true,
    },
  });
  return tokens;
};

/**
 * Get a single launchpad entry by memecoin address.
 * @param memecoinAddress - The memecoin address to query.
 * @returns The launchpad entry or null.
 */
export const getLaunchpadByAddress = async (memecoinAddress: string) => {
  const launchpadArr = await db
    .select({
      memecoin_address: tokenLaunch.memecoin_address,
      quote_token: tokenLaunch.quote_token,
      price: tokenLaunch.price,
      total_supply: tokenLaunch.total_supply,
      liquidity_raised: tokenLaunch.liquidity_raised,
      network: tokenLaunch.network,
      created_at: tokenLaunch.created_at,
      threshold_liquidity: tokenLaunch.threshold_liquidity,
      bonding_type: tokenLaunch.bonding_type,
      total_token_holded: tokenLaunch.total_token_holded,
      block_timestamp: tokenLaunch.block_timestamp,
      is_liquidity_added: tokenLaunch.is_liquidity_added,
      market_cap: tokenLaunch.market_cap,
      initial_pool_supply_dex: tokenLaunch.initial_pool_supply_dex,
      url: tokenLaunch.url,
      name: tokenLaunch.name,
      symbol: tokenLaunch.symbol,
    })
    .from(tokenLaunch)
    .where(eq(tokenLaunch.memecoin_address, memecoinAddress))
    .limit(1);

  return launchpadArr[0] ?? null;
};


export const getSharesTokenUser = async ({
  offset = 0,
  limit = 20,
}: {
  offset?: number;
  limit?: number;
} = {}) => {
  const tokens = await db.query.sharesTokenUser.findMany({
    offset,
    limit,
    orderBy: (sharesTokenUser, { desc }) => [desc(sharesTokenUser.created_at)],
    columns: {
      owner: true,
      created_at: true,
      amount_owned: true,
      amount_buy: true,
      amount_sell: true,
      amount_claimed: true,
      total_paid: true,
      is_claimable: true,
      token_address: true,
    },
  });
  return tokens;
};


export const getSharesTokenUserByMemecoinAddress = async ({
  offset = 0,
  limit = 20,
  memecoinAddress,
}: {
  offset?: number;
  limit?: number;
  memecoinAddress: string;
}) => {
  const tokens = await db.query.sharesTokenUser.findMany({
    offset,
    limit,
    orderBy: (sharesTokenUser, { desc }) => [desc(sharesTokenUser.created_at)],
    columns: {
      owner: true,
      created_at: true,
      amount_owned: true,
      amount_buy: true,
      amount_sell: true,
      amount_claimed: true,
      total_paid: true,
      is_claimable: true,
      token_address: true,
    },
    where: eq(sharesTokenUser.token_address, memecoinAddress),
  });
  return tokens;
};


export const getTransactionsByMemecoinAddress = async ({
  offset = 0,
  limit = 20,
  memecoinAddress,
}: {
  offset?: number;
  limit?: number;
  memecoinAddress: string;
}) => {
  const tokens = await db.query.tokenTransactions.findMany({
    offset,
    limit,
    orderBy: (tokenTransactions, { desc }) => [desc(tokenTransactions.created_at)],
    columns: {
      memecoin_address: true,
      created_at: true,
      amount: true,
      price: true,
      quote_amount: true,
      network: true,
      transaction_type: true,
      transaction_hash: true,
      time_stamp: true,
    },
    where: eq(tokenTransactions.memecoin_address, memecoinAddress),
  });
  return tokens;
};

/**
 * Get candlesticks for a specific token with optional interval filtering.
 * @param memecoinAddress - The memecoin address to query.
 * @param intervalMinutes - Optional interval in minutes (5, 10, 60). If not provided, returns all intervals.
 * @param offset - The number of records to skip.
 * @param limit - The number of records to return.
 * @returns An array of candlestick data.
 */
export const getCandlesticksByMemecoinAddress = async ({
  memecoinAddress,
  intervalMinutes,
  offset = 0,
  limit = 100,
}: {
  memecoinAddress: string;
  intervalMinutes?: number;
  offset?: number;
  limit?: number;
}) => {
  const whereCondition = intervalMinutes
    ? and(
      eq(candlesticks.token_address, memecoinAddress),
      eq(candlesticks.interval_minutes, intervalMinutes)
    )
    : eq(candlesticks.token_address, memecoinAddress);

  const candles = await db
    .select({
      token_address: candlesticks.token_address,
      interval_minutes: candlesticks.interval_minutes,
      timestamp: candlesticks.timestamp,
      open: candlesticks.open,
      high: candlesticks.high,
      low: candlesticks.low,
      close: candlesticks.close,
      created_at: candlesticks.created_at,
      updated_at: candlesticks.updated_at,
    })
    .from(candlesticks)
    .where(whereCondition)
    .orderBy(candlesticks.timestamp)
    .offset(offset)
    .limit(limit);

  return candles;
};

/**
 * Get candlesticks for a specific token with date range filtering.
 * @param memecoinAddress - The memecoin address to query.
 * @param intervalMinutes - Interval in minutes (5, 10, 60).
 * @param startDate - Optional start date for filtering.
 * @param endDate - Optional end date for filtering.
 * @param offset - The number of records to skip.
 * @param limit - The number of records to return.
 * @returns An array of candlestick data.
 */
export const getCandlesticksByDateRange = async ({
  memecoinAddress,
  intervalMinutes,
  startDate,
  endDate,
  offset = 0,
  limit = 100,
}: {
  memecoinAddress: string;
  intervalMinutes: number;
  startDate?: Date;
  endDate?: Date;
  offset?: number;
  limit?: number;
}) => {
  let whereCondition = and(
    eq(candlesticks.token_address, memecoinAddress),
    eq(candlesticks.interval_minutes, intervalMinutes)
  );

  if (startDate && endDate) {
    whereCondition = and(
      whereCondition,
      // Add date range conditions if needed
    );
  }

  const candles = await db
    .select({
      token_address: candlesticks.token_address,
      interval_minutes: candlesticks.interval_minutes,
      timestamp: candlesticks.timestamp,
      open: candlesticks.open,
      high: candlesticks.high,
      low: candlesticks.low,
      close: candlesticks.close,
      created_at: candlesticks.created_at,
      updated_at: candlesticks.updated_at,
    })
    .from(candlesticks)
    .where(whereCondition)
    .orderBy(candlesticks.timestamp)
    .offset(offset)
    .limit(limit);

  return candles;
};

