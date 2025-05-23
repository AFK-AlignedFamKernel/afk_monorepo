export interface MetadataLaunch {
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
  description?: string;
  image_url?: string;
  ipfsHash?: string;
}
