export interface IGetTokenReturnTypeObj {
  name: string;
  symbol: string;
  decimals: number;
  l2_token_address: string;
  sort_order: number;
  total_supply: null;
  logo_url: string;
}

export interface IAvnuSwapCalldata {
  quoteId: string;
  takerAddress: string;
  slippage: number;
  includeApprove: boolean;
}

export interface IAvnuSwapCalldataReturnTypeObj {
  chainId: string;
  calls: Call[];
}

export interface Call {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export interface IAvnuExecuteSwap {
  quoteId: string;
  signature: string[];
}

export interface IGetQuoteReturnTypeObj {
  specifiedAmount: string;
  amount: string;
  route: Route[];
}

export interface IGetAvnuQuoteReturnTypeObj {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: string;
  sellAmountInUsd: number;
  buyTokenAddress: string;
  buyAmount: string;
  buyAmountInUsd: number;
  buyAmountWithoutFees: string;
  buyAmountWithoutFeesInUsd: number;
  estimatedAmount: boolean;
  chainId: string;
  blockNumber: string;
  expiry: null;
  routes: Route[];
  gasFees: string;
  gasFeesInUsd: number;
  avnuFees: string;
  avnuFeesInUsd: number;
  avnuFeesBps: string;
  integratorFees: string;
  integratorFeesInUsd: number;
  integratorFeesBps: string;
  priceRatioUsd: number;
  liquiditySource: string;
  sellTokenPriceInUsd: number;
  buyTokenPriceInUsd: number;
  gasless: Gasless;
  exactTokenTo: boolean;
}

export interface Gasless {
  active: boolean;
  gasTokenPrices: GasTokenPrice[];
}

export interface GasTokenPrice {
  tokenAddress: string;
  gasFeesInGasToken: string;
  gasFeesInUsd: number;
}

export interface Route {
  name: string;
  address: string;
  percent: number;
  sellTokenAddress: string;
  buyTokenAddress: string;
  routeInfo: RouteInfo;
  routes: any[];
}

export interface RouteInfo {
  token0: string;
  token1: string;
  fee: string;
  tickSpacing: string;
  extension: string;
}

export interface IQuotePrice {
  baseToken: string;
  quoteToken: string;
  atTime?: string;
  period?: number;
}
export interface IPriceReturnType {
  timestamp: number;
  price: string;
}
export interface IAvnuQueryType {
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount?: any;
  buyAmount?: any;
  takerAddress?: string;
  size: number;
}

export interface IGetPoolReturnTypeObj {
  total_calculated: string;
  splits: Split[];
}

export interface Split {
  amount_specified: string;
  amount_calculated: string;
  route: Route[];
}

export interface Route {
  pool_key: PoolKey;
  sqrt_ratio_limit: string;
  skip_ahead: number;
}

export interface PoolKey {
  token0: string;
  token1: string;
  fee: string;
  tick_spacing: number;
  extension: string;
}
export interface Route {
  pool_key: PoolKey;
  sqrt_ratio_limit: string;
  skip_ahead: number;
}

export interface PoolKey {
  token0: string;
  token1: string;
  fee: string;
  tick_spacing: number;
  extension: string;
}
export interface IQuoteSwapQuery {
  token: string;
  otherToken: string;
  amount: string;
  decimal: number;
  direction: boolean;
}

export interface IQueryType {
  page: number;
  limit: number;
}
