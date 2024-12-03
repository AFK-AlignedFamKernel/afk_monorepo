export interface NameService {
  transactionHash: string;
  network?: string;
  blockHash?: string;
  blockNumber?: number;
  blockTimestamp?: Date;
  ownerAddress?: string;
  expiry?: Date;
  username?: string;
  name?: string;
  symbol?: string;
  paid?: string;
  quoteAddress?: string;
  cursor?: number;
  timestamp?: Date;
  createdAt?: Date;
}
