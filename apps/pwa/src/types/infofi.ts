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
  id: string;
  name: string;
  description: string;
}