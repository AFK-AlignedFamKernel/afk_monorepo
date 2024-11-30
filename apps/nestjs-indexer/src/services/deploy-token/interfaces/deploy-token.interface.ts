export interface DeployToken {
  network?: string;
  blockHash?: string;
  blockNumber?: number;
  blockTimestamp?: Date;
  transactionHash: string;
  memecoinAddress?: string;
  ownerAddress?: string;
  name?: string;
  symbol?: string;
  initialSupply?: string;
  totalSupply?: string;
  cursor?: number;
  timeStamp?: Date;
  createdAt?: Date;
}
