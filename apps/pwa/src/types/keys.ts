export interface TokenDeployInterface {
  token_address: string;
  name: string;
  symbol: string;
  description?: string;
  block_timestamp: string;
  liquidity_raised?: number;
  is_liquidity_added?: boolean;
  creator_address?: string;
  total_supply?: string;
  decimals?: number;
  launch_date?: string;
  status?: 'pending' | 'active' | 'completed' | 'failed';
  network?: string;
  chain_id?: number;
  metadata?: MetadataOnchain;
} 