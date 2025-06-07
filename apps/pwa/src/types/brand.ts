export interface IBrand {
  id: string;
  name: string;
  description?: string;
  slug_name: string;
  metadata?: Record<string, any>;
  owner_id: string;
  created_at: string;
  updated_at: string;
  starknet_address?: string;
  evm_address?: string;
  btc_address?: string;
  solana_address?: string;
  starknet_address_verified?: string;
  is_active: boolean;
  identities: Record<string, any>;
  token_address?: string;
  twitter_handle?: string;
  youtube_handle?: string;
  tiktok_handle?: string;
  reddit_handle?: string;
  telegram_handle?: string;
  banner_url?: string;
  avatar_url?: string;
  website_url?: string;
  bio?:string;
  verified_socials: Record<string, any>;
  nostr_address?: string;
  lud_address?: string;
  tokens_address?: string[];
  creator_token?: string;
  topics: string[];
  is_verified: boolean;
}


export interface IContentCreator {
  id: string;
  name: string;
  description?: string;
  slug_name: string;
  metadata?: Record<string, any>;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  starknet_address?: string;
  evm_address?: string;
  btc_address?: string;
  solana_address?: string;
  starknet_address_verified?: string;
  is_active: boolean;
  identities: Record<string, any>;
  token_address?: string;
  twitter_handle?: string;
  youtube_handle?: string;
  tiktok_handle?: string;
  reddit_handle?: string;
  telegram_handle?: string;
  banner_url?: string;
  avatar_url?: string;
  website_url?: string;
  bio?:string;
  nostr_address?: string;
  lud_address?: string;
  tokens_address?: string[];
  creator_token?: string;
  topics: string[];
  is_verified: boolean;
  unverified_socials: Record<string, any>;
  verified_socials: Record<string, any>;
}


export interface ILeaderboardStats {
  id: string;
  brand_id: string;
  platform: string;
  total_score: number;
  rank_position: number;
  previous_rank: number;
  rank_change: number;
  user_votes: Record<string, any>;
  user_top: string[];
  user_rank: any;
  data_user_stats: Record<string, any>;
  new_user: string[];
  last_updated: string;
  users: string[];
  users_scores:any[];
  users_names: string[];
  total_users: number;
  total_mindshare_score: number;
  total_engagement_score: number;
  total_quality_score: number;
  created_at: string;
  creator_ranks: Record<string, any>;
  scraping_ranks: Record<string, any>;
}


export interface ICreatorAnalytics {
  id: string;
  creator_id?: string;
  platform: string;
  mindshare_score: number;
  insight_value_score: number;
  regularity_score: number;
  clarity_score: number;
  storytelling_score: number;
  hook_conclusion_score: number;
  reputation_score: number;
  copywriting_score: number;
  topics: string[];
  content_used: Record<string, any>[];
  user_votes: Record<string, any>;
  last_updated: string;
  created_at: string;
  analytics_updated_at: string;
  llm_classification: Record<string, any>;
  classification_data: Record<string, any>[];
  classification_updated_at: string;
  socials_llm_classification: Record<string, any>[];
  socials_scores: Record<string, any>[];
  reputation_scores: Record<string, any>[];
  reputation: Record<string, any>;
  recommendations: Record<string, any>;
  stats_creator: Record<string, any>;
  stats_content: Record<string, any>;
  rank_afk: number;
}