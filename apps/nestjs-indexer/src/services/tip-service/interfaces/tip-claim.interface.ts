export interface TipClaim {
  network: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
  transactionHash: string;
  depositId: string;
  sender: string;
  nostrRecipient: string;
  amount: number;
  tokenAddress: string;
  starknetRecipient: string;
  gasTokenAddress: string;
  gasAmount: number;
}
