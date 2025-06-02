export type ChainString = 'KAKAROT' | 'STARKNET' | 'SEPOLIA' | 'STARKNET_SEPOLIA';
export type Token = 'ETH' | 'STRK' | 'USDC';
export enum GiftType {
  'INTERNAL',
  'EXTERNAL_PRIVATE_KEY',
  'API',
}



export type SocialPlatform = 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'discord' | 'telegram';

export interface ContentCreator {
  id?: string;
  name: string;
  description?: string;
  slug_name: string;
  metadata?: Record<string, any>;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  starknet_address?: string;
  evm_address?: string;
  btc_address?: string;
  is_active?: boolean;
  identities?: Record<string, any>;
  token_address?: string;
  nft_address?: string;
  banner_url?: string;
  avatar_url?: string;
  website_url?: string;
  bio?: string;
  location?: string;
  social_links?: Record<string, any>;
  is_verified: boolean;
  topics?: string[];
}

