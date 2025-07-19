
export interface LinkedDefaultStarknetAddressEventInterface extends BaseEventInterface {
  nostr_address: string;
  starknet_address: string;
  nostr_event_id?: string;
  blockTimestamp: Date;
  blockHash: string;
  blockNumber: number;
  contract_address: string;
  is_add_by_admin?: boolean;
}


export interface NostrInfofiInterface extends BaseEventInterface {
  transferId: string;
  network: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
  transactionHash: string;
  ownerAddress?: string;
  url?: string;
  nostr_event_id?: string;
  timestamp: Date;
  twitter?: string;
  telegram?: string;
  github?: string;
  website?: string;
  epoch_index?: number;
  amount_token?: string;
  amount_vote?: string;
  nostr_address?: string;
  starknet_address?: string;
  current_index_epoch?: number;
}

export interface DepositRewardsByUserEventInterface extends BaseEventInterface {
  starknet_address: string;
  nostr_address: string;
  epoch_index: number;
  amount_token: string;
  amount_algo: string;
  amount_vote: string;
  amount_total: string;
}

export interface DistributionRewardsByUserEventInterface extends BaseEventInterface {
  starknet_address: string;
  nostr_address: string;
  current_index_epoch: number;
  claimed_at: Date;
  amount_algo: string;
  amount_vote: string;
  amount_total: string;
}

export interface NewEpochEventInterface extends BaseEventInterface {
  old_epoch_index: number;
  current_index_epoch: number;
  start_duration: Date;
  end_duration: Date;
  epoch_duration: number;
}

export interface BaseEventInterface {
  transferId?: string;
  network?: string;
  blockHash?: string;
  blockNumber?: number;
  blockTimestamp?: Date;
  transactionHash?: string;
  contract_address?: string;
}


export interface AddTopicsMetadataEventInterface extends BaseEventInterface {
  current_index_keywords?: number;
  keyword?: string;
  main_topic?: string;
  keywords?: string[];
}

export interface NostrMetadataEventInterface extends BaseEventInterface {
  nostr_address?: string;
  name?: string;
  about?: string;
  event_id_nip_72?: string;
  event_id_nip_29?: string;
}
