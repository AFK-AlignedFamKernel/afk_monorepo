export interface BuyToken {
  transferId: string;
  network: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
  transactionHash: string;
  memecoinAddress: string;
  ownerAddress: string;
  lastPrice: string;
  quoteAmount: string;
  coinAmount?: string;
  price: string;
  amount: number;
  protocolFee: string;
  timestamp: Date;
  transactionType: string;
  creatorFee?: string;
}
