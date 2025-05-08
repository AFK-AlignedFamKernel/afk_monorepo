export enum BondingType {
  Linear = 'linear',
  Exponential = 'exponential',
}

export interface MetadataOnchain {
  url?: string;
  twitter?: string;
  github?: string;
  telegram?: string;
  website?: string;
}

export interface DeployTokenFormValues {
  name: string;
  symbol: string;
  initialSupply: number;
  bonding_type: BondingType;
  creator_fee_percent?: number;
  metadata?: MetadataOnchain;
}

export interface TokenResponse {
  token_address: string;
  name: string;
  symbol: string;
  description?: string;
  block_timestamp: string;
  liquidity_raised?: number;
  is_liquidity_added?: boolean;
  status?: 'pending' | 'active' | 'completed' | 'failed';
  network?: string;
  chain_id?: number;
  metadata?: MetadataOnchain;
} 


export interface Launch {
  memecoin_address: string;
  quote_token: string;
  price: string;
  total_supply: string;
  liquidity_raised: string;
  network: string;
  created_at: string;
  threshold_liquidity: string;
  bonding_type: string;
  total_token_holded: string | null;
  block_timestamp: string;
  is_liquidity_added: boolean;
}