export interface TipTransfer {
  network: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
  transactionHash: string;
  sender: string;
  nostrRecipient: string;
  starknetRecipient: string;
  amount: number;
  tokenAddress: string;
}
