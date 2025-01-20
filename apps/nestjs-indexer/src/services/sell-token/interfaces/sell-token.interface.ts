export interface SellToken {
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
  price: string;
  amount: number;
  protocolFee: string;
  timestamp: Date;
  transactionType: string;
  coinAmount?:number;
}
