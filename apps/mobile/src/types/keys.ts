import {Uint256} from 'starknet';

export type ACTION_LAUNCHPAD = 'BUY' | 'SELL';

export interface MetadataOnchain {
  token_address?: string;
  owner?: string;
  owner_nostr?: string;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  nostr_event_id?: string;
  tags?: string[];
  is_verified?: boolean;
  twitter?: string;
  website?:string;
  telegram?:string;
  github?:string;
}

export interface KeysUser {
  owner: string;
  token_address: string;
  price: Uint256;
  initial_key_price: Uint256;
  total_supply: Uint256;
  created_at: Uint256;
  token_quote: TokenQuoteBuyKeys;
}

export interface LaunchDataMerged extends TokenLaunchInterface, TokenDeployInterface {}
export interface TokenLaunchInterface {
  owner?: string;
  token_address: string;
  price: Uint256;
  initial_key_price: Uint256;
  available_supply: Uint256;
  bonding_curve_type?: BondingType;
  total_supply: Uint256;
  created_at: string;
  liquidity_raised: Uint256;
  token_holded: Uint256;
  is_liquidity_launch?: boolean;
  token_quote: TokenQuoteBuyKeys;
  threshold_liquidity?: Uint256;
  slope?: Uint256;
  quote_token_address?: string;
  quote_token?: string;
  is_launched?: boolean;
  initial_pool_supply_dex?: string;
}

export interface UserShareInterface {
  owner?: string;
  token_address?: string;
  created_at?: string;
  amount_owned?: string;
  // total?: number;
  // total_buy?: number;
  // total_sell?: number;
  // quote_amount?: number;
}

export interface TokenDeployInterface {
  memecoin_address: string;
  symbol?: string;
  price: Uint256;
  name: string;
  network: string;
  owner?: string;
  owner_address?: string;
  total_supply: Uint256;
  // created_at: Uint256;
  created_at: string;
  liquidity_raised: Uint256;
  token_holded: Uint256;
  is_liquidity_launch?: boolean;
  is_liquidity_added?: boolean;
  token_quote: TokenQuoteBuyKeys;
  threshold_liquidity?: Uint256;
  slope?: Uint256;
  quote_token?: string;
  block_timestamp?: string;
  is_launched?: boolean;
  initial_pool_supply_dex?: string;
  url?: string;
  nostr_id?: string;
  description?: string;
  market_cap?: number;
  total_token_holded?: number;
  bonding_type?:string;
}

export interface TokenDeployIndexerInterface {
  memecoin_address: string;
  price: Uint256;
  name: string;
  network: string;
  owner: string;
  total_supply: Uint256;
  created_at: string;
  liquidity_raised: Uint256;
  token_holded: Uint256;
  is_liquidity_launch?: boolean;
  is_launched?: boolean;
  initial_pool_supply_dex?: string;
  quote_token?: string;
  threshold_liquidity?: Uint256;
  slope?: Uint256;
}

export interface TokenStatsInterface {
  price?: number;
  liquidity_raised?: number;
}

export interface TokenTxInterface {
  memecoin_address: string;
  owner_address: string;
  amount: number;
  quote_amount?: number;
  price: number;
  coin_received: boolean;
  liquidity_raised: boolean;
  total_supply: boolean;
  network: boolean;
  transaction_type: boolean;
  created_at: boolean;

}


export interface TokenHoldersInterface {
  data: {
   amount_owned?: string;
   owner_address?: string;
   owner?: string;
   token_address?: string;
  }[];
}


// export interface TokenHoldersInterface {
//   data: {
//     _sum: {
//       amount: string;
//     };
//     _count: {
//       owner_address: number;
//     };
//     owner_address: string;
//   }[];
// }

export interface Token {
  owner: string;
  token_address: string;
  price: Uint256;
  symbol: string;
  name: string;
  total_supply: Uint256;
  initial_supply: Uint256;
  created_at: Uint256;
  token_quote: TokenQuoteBuyKeys;
}

export interface TokenQuoteBuyKeys {
  token_address: string;
  price: Uint256;
  initial_key_price: Uint256;
  step_increase_linear: Uint256;
  is_enable: boolean;
}

export interface SharesKeys {
  owner: string;
  key_address: string;
  amount_owned: Uint256;
  amount_buy: Uint256;
  amount_sell: Uint256;
  total_paid: Uint256;
  created_at: Uint256;
}

export enum BondingType {
  Linear=0,
  Exponential=1,
  // Scoring, // Nostr data with Appchain connected to a Relayer
  // Limited,
}
