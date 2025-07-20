import { NDKUserProfile } from "@nostr-dev-kit/ndk";

export interface SubInfo {
  contract_address: string;
  name: string;
  about: string;
  main_tag: string;
  total_amount_deposit: string;
  epochs?:Epoch[];
  userProfiles?:UserProfile[];
}

export interface Epoch {
  id: string;
  epoch_index: string;
  contract_address: string;
  total_ai_score: string;
  total_vote_score: string;
  total_amount_deposit: string;
  total_tip: string;
  amount_claimed: string;
  amount_vote: string;
  amount_algo: string;
  epoch_duration: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  nostr_id: string;
  starknet_address: string;
  total_ai_score: string;
  total_tip: string;
  total_vote_score: string;
  amount_claimed: string;
  created_at: string;
  updated_at: string;
}


export interface UserInfo {
  nostr_id: string;
  total_ai_score: string;
  total_vote_score: string;
  starknet_address?: string;
  is_add_by_admin?: boolean;
  epoch_states?: any[];
}

export interface VoteParams {
  nostr_address?: string;
  vote: string;
  is_upvote?: boolean;
  upvote_amount: string;
  downvote_amount: string;
  amount: string;
  amount_token: string;
}

export interface UserNostrCardProps {
  profile?: UserProfile | null | undefined;
  profileIndexer?: UserInfo;
  profileNostr?: NDKUserProfile;
  contractAddress?: string;
  event?: any;
  isRepostProps?: boolean;
  isBookmarked?: boolean;
  isReplyView?: boolean;
  isArticle?: boolean;
}