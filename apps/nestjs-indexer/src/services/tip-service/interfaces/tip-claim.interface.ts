export interface TipClaim {
  network: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
  transactionHash: string;
  depositId: string;
  sender?: string;
  nostrRecipient?: string;
  starknetRecipient?: string;
  amount?: number;
  tokenAddress?: string;
  gasTokenAddress?: string;
  gasAmount?: number;
}
