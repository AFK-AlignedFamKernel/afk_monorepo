
export interface LinkedDefaultStarknetAddressEventInterface {
  nostr_address: string;
  starknet_address: string;
  nostr_event_id?: string;
  blockTimestamp: Date;
  blockHash: string;
  blockNumber: number;
  contract_address: string;
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
  epoch_index: number;
  amount_token: string;
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

export interface BaseEventInterface {
  transferId?: string;
  network?: string;
  blockHash?: string;
  blockNumber?: number;
  blockTimestamp?: Date;
  transactionHash: string;
}

export interface NewEpochEventInterface extends BaseEventInterface {
  old_epoch_index: number;
  current_index_epoch: number;
  start_duration: Date;
  end_duration: Date;
  epoch_duration: number;
}