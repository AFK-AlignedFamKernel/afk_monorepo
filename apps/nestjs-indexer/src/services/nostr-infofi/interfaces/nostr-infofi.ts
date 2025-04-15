
export interface LinkedDefaultStarknetAddressEventInterface {
  nostr_address: string;
  starknet_address: string;
  nostr_event_id?: string;
  blockTimestamp: Date;
  blockHash: string;
  blockNumber: number;
  contract_address: string;
}


export interface NostrInfofiInterface {
  transferId: string;
  network: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
  transactionHash: string;
  memecoinAddress: string;
  ownerAddress?: string;
  url?: string;
  nostr_event_id?: string;
  timestamp: Date;
  transactionType: string;
  twitter?: string;
  telegram?: string;
  github?: string;
  website?: string;
}
