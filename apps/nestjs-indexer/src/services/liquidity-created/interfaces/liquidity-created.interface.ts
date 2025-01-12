export interface LiquidityCreated {
  transferId: string;
  network: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: Date;
  transactionHash: string;
  id?: string;
  pool?: string;
  asset: string;
  quoteTokenAddress?: string;
  owner?: string;
  exchange?: string;
  is_unruggable?: boolean;
}
