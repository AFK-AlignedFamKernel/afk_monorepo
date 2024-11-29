import { Injectable, Logger } from '@nestjs/common';
import { StreamClient, v1alpha2 } from '@apibara/protocol';
import {
  FieldElement,
  Filter,
  v1alpha2 as starknet,
  StarkNetCursor,
} from '@apibara/starknet';
import constants from 'src/common/constants';
import { env } from 'src/common/env';
import { IndexerConfig } from './interfaces';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  private readonly client: StreamClient;
  private configs: IndexerConfig[] = [];

  constructor() {
    this.client = new StreamClient({
      url: env.indexer.dnaClientUrl,
      clientOptions: {
        'grpc.max_receive_message_length':
          constants.apibara.MAX_RECEIVE_MESSAGE_LENGTH,
      },
      token: env.indexer.dnaToken,
    });
  }

  onModuleInit() {
    this.startIndexer();
  }

  registerIndexer(eventKeys: string[], handler: (data: any) => Promise<void>) {
    this.configs.push({ eventKeys, handler });
  }

  private async startIndexer() {
    if (this.configs.length === 0) {
      this.logger.warn('No indexers registered. Skipping indexer start.');
      return;
    }

    this.logger.log('Starting indexer...');

    const combinedFilter = this.combineFilters();

    this.client.configure({
      filter: combinedFilter,
      batchSize: 1,
      finality: v1alpha2.DataFinality.DATA_STATUS_ACCEPTED,
      cursor: StarkNetCursor.createWithBlockNumber(constants.STARTING_BLOCK),
    });

    for await (const message of this.client) {
      this.logger.debug(`Received message: ${message.message}`);
      if (message.message === 'data') {
        await this.handleDataMessage(message.data);
      }
    }
  }

  private combineFilters(): Uint8Array {
    const combinedFilter = Filter.create().withHeader({ weak: true });
    const allEventKeys = this.configs.flatMap((config) => config.eventKeys);
    const uniqueEventKeys = [...new Set(allEventKeys)];

    uniqueEventKeys.forEach((eventKey) => {
      combinedFilter.addEvent((event) =>
        event.withKeys([FieldElement.fromBigInt(BigInt(eventKey))]),
      );
    });

    return combinedFilter.encode();
  }

  private async handleDataMessage(dataMessage: any) {
    const { data } = dataMessage;
    for (const item of data) {
      const block = starknet.Block.decode(item);
      for (const event of block.events) {
        const eventKey = FieldElement.toHex(event.event.keys[0]);

        const matchingConfigs = this.configs.filter((config) =>
          config.eventKeys.includes(eventKey),
        );

        for (const config of matchingConfigs) {
          await config.handler(block.header, event.event, event.transaction);
        }
      }
    }
  }
}
