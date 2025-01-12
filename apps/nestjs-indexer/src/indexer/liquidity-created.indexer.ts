import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { validateAndParseAddress, hash } from 'starknet';
import { IndexerService } from './indexer.service';
import { ContractAddress } from 'src/common/types';
import { LiquidityCreatedService } from 'src/services/liquidity-created/liquidity-created.service';

@Injectable()
export class LiquidityCreatedIndexer {
  private readonly logger = new Logger(LiquidityCreatedIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(LiquidityCreatedService)
    private readonly liquidityCreatedService: LiquidityCreatedService,

    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('LiquidityCreated')),
    ];
  }

  async onModuleInit() {
    this.indexerService.registerIndexer(
      this.eventKeys,
      this.handleEvents.bind(this),
    );
  }

  private async handleEvents(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    this.logger.log('Received event liquidity created');
    const eventKey = validateAndParseAddress(FieldElement.toHex(event.keys[0]));

    switch (eventKey) {
      case validateAndParseAddress(
        hash.getSelectorFromName('LiquidityCreated'),
      ):
        this.logger.log('Event name: LiquidityCreated');
        this.handleLiquidityAddedEvent(header, event, transaction);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }

  private async handleLiquidityAddedEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    const {
      blockNumber,
      blockHash: blockHashFelt,
      timestamp: blockTimestamp,
    } = header;

    const blockHash = validateAndParseAddress(
      `0x${FieldElement.toBigInt(blockHashFelt).toString(16)}`,
    ) as ContractAddress;

    const transactionHashFelt = transaction.meta.hash;
    const transactionHash = validateAndParseAddress(
      `0x${FieldElement.toBigInt(transactionHashFelt).toString(16)}`,
    ) as ContractAddress;

    const transferId = `${transactionHash}_${event.index}`;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [id, pool, assetFelt, quoteTokenAddressFelt] = event.keys;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const asset = validateAndParseAddress(
      `0x${FieldElement.toBigInt(assetFelt).toString(16)}`,
    ) as ContractAddress;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const quoteTokenAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(quoteTokenAddressFelt).toString(16)}`,
    ) as ContractAddress;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [owner, exhange, is_unruggable] = event.data;

    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      asset,
    };

    await this.liquidityCreatedService.create(data);
  }
}
