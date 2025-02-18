import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { cairo, hash, shortString, uint256, validateAndParseAddress } from 'starknet';
import { BuyTokenService } from 'src/services/buy-token/buy-token.service';
import { IndexerService } from './indexer.service';
import { ContractAddress } from 'src/common/types';
import { MetadataLaunchService } from 'src/services/metadata/metadata.service';

@Injectable()
export class MetadataLaunchIndexer {
  private readonly logger = new Logger(MetadataLaunchIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(MetadataLaunchService)
    private readonly metadataLaunchService: MetadataLaunchService,
    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('MetadataCoinAdded')),
    ];
  }

  async onModuleInit() {
    this.indexerService.registerIndexer(
      this.eventKeys,
      this.handleEvents.bind(this),
    );
  }

  private isValidChar = (char: string): boolean => {
    return /^[a-zA-Z0-9\s\-_.!@#$%^&*()]+$/.test(char);
  };

  private cleanString = (str: string): string => {
    return str
      .split('')
      .filter((char) => this.isValidChar(char))
      .join('')
      .trim();
  };


  private isNumeric = (str: string): boolean => {
    return /^\d+$/.test(str);
  };


  private async handleEvents(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    this.logger.log('Received event');
    const eventKey = validateAndParseAddress(FieldElement.toHex(event.keys[0]));

    switch (eventKey) {
      case validateAndParseAddress(hash.getSelectorFromName('MetadataCoinAdded')):
        this.logger.log('Event name: MetadataCoinAdded');
        await this.handeMetadataEvent(header, event, transaction);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }

  private async handeMetadataEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    const {
      blockNumber,
      blockHash: blockHashFelt,
      timestamp: blockTimestamp,
    } = header;
    console.log("handleMetadataEvent", event);

    const blockHash = validateAndParseAddress(
      `0x${FieldElement.toBigInt(blockHashFelt).toString(16)}`,
    ) as ContractAddress;

    const transactionHashFelt = transaction.meta.hash;
    const transactionHash = validateAndParseAddress(
      `0x${FieldElement.toBigInt(transactionHashFelt).toString(16)}`,
    ) as ContractAddress;

    const transferId = `${transactionHash}_${event.index}`;

    const [, tokenAddressFelt] = event.keys;

    const tokenAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(tokenAddressFelt).toString(16)}`,
    ) as ContractAddress;

    const [
      urlFelt,
      nostrEventIdLow,
      nostrEventIdHigh,
      timestampFelt
    ] = event.data;

    let i = 1;
    
    let url = '';
    while (i < event.data.length) {
      const part = event.data[i];
      const decodedPart = shortString.decodeShortString(
        FieldElement.toBigInt(part).toString(),
      );

      if (this.isNumeric(decodedPart)) {
        i++;
        break;
      }

      url= decodedPart;
      i++;
    }

    url = this.cleanString(url);

    // const nostrEventId = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(nostrEventIdLow),
    //   high: FieldElement.toBigInt(nostrEventIdHigh),
    // });
    let nostrEventId = cairo.felt(0);

    try {
      nostrEventId = cairo.felt(FieldElement.toBigInt(nostrEventIdLow)) + cairo.felt(FieldElement.toBigInt(nostrEventIdHigh));
      
    } catch (error) {
      
    }
    console.log("nostrEventId", nostrEventId);
    const timestamp = new Date(
      Number(FieldElement.toBigInt(timestampFelt)) * 1000,
    );

    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      memecoinAddress: tokenAddress,
      nostrEventId,
      url: url,
      timestamp,
      transactionType: 'buy',
    };


    await this.metadataLaunchService.createOrUpdate(data);
  }
}
