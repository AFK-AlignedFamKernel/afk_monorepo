import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { hash, shortString, uint256, validateAndParseAddress } from 'starknet';
import { NameServiceService } from 'src/services/name-service/name-service.service';
import { IndexerService } from './indexer.service';
import { ContractAddress } from 'src/common/types';

@Injectable()
export class NameServiceIndexer {
  private readonly logger = new Logger(NameServiceIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(NameServiceService)
    private readonly nameServiceService: NameServiceService,
    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('UsernameClaimed')),
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
    this.logger.log('Received event');
    const eventKey = validateAndParseAddress(FieldElement.toHex(event.keys[0]));

    switch (eventKey) {
      case validateAndParseAddress(hash.getSelectorFromName('UsernameClaimed')):
        this.logger.log('Event name: UsernameClaimed');
        await this.handleUsernameClaimedEvent(header, event, transaction);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }

  private async handleUsernameClaimedEvent(
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, addressFelt] = event.keys;

    const address = validateAndParseAddress(
      `0x${FieldElement.toBigInt(addressFelt).toString(16)}`,
    ) as ContractAddress;

    const [usernameFelt, expiryFelt, paidLow, paidHigh, quoteTokenFelt] =
      event.data;

    const username = usernameFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(usernameFelt).toString(),
        )
      : '';

    const expiry = new Date(Number(FieldElement.toBigInt(expiryFelt)) * 1000);

    const paidRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(paidLow),
      high: FieldElement.toBigInt(paidHigh),
    });
    const paid = formatUnits(paidRaw, constants.DECIMALS).toString();

    const quoteToken = validateAndParseAddress(
      `0x${FieldElement.toBigInt(quoteTokenFelt).toString(16)}`,
    ) as ContractAddress;

    const data = {
      transactionHash,
      network: 'starknet-sepolia',
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      ownerAddress: address,
      expiry,
      name: username,
      username,
      paid,
      quoteToken: quoteToken,
    };

    await this.nameServiceService.create(data);
  }
}
