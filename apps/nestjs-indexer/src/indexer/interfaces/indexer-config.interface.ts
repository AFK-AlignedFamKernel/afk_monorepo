export interface IndexerConfig {
  eventKeys: string[];
  handler: (header: any, event: any, transaction: any) => Promise<void>;
}
