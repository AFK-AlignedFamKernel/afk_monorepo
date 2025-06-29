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


export interface GeneratedCodeVerification {
  verification_code: string;
  instructions?: string;
  created_at?: string;
  expires_at?: string;
  is_verified?: boolean;
  platform: string;
  handle: string;
  user_id?: string;
}

export interface ICommunity {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  slug_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
  owner_id: string;
}

export interface IMessage {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  community_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  type: string;
  content: string;
  is_active: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
}