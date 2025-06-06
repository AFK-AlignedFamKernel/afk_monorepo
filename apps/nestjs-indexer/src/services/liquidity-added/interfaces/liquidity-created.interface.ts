export interface LiquidityCreated {
  transferId: string;
  network: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
  transactionHash: string;
  memecoinAddress: string;
  ownerAddress?: string;
  lastPrice?: string;
  quoteAmount?: string;
  price?: string;
  amount?: number;
  protocolFee?: string;
  date?: Date;
  timestamp?: string;
  id?: string;
  pool?: string;
  assetAddress?: string;
  transactionType?: string;
}
