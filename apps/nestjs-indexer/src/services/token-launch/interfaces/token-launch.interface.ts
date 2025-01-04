export interface TokenLaunch {
  network?: string;
  blockHash?: string;
  blockNumber?: number;
  blockTimestamp?: Date;
  transactionHash: string;
  memecoinAddress?: string;
  quoteToken?: string;
  exchangeName?: string;
  totalSupply?: string;
  currentSupply?: string;
  liquidityRaised?: string;
  price?: string;
  cursor?: number;
  timeStamp?: Date;
  createdAt?: Date;
  ownerAddress?:string;
  bondingType?:string;
  thresholdLiquidity?:string;
}
