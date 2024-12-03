import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { uint256, validateAndParseAddress, hash, shortString } from 'starknet';
import { DeployTokenService } from 'src/services/deploy-token/deploy-token.service';
import { IndexerService } from './indexer.service';
import { ContractAddress } from 'src/common/types';

@Injectable()
export class DeployTokenIndexer {
  private readonly logger = new Logger(DeployTokenIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(DeployTokenService)
    private readonly deployTokenService: DeployTokenService,

    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('CreateToken')),
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
      case validateAndParseAddress(hash.getSelectorFromName('CreateToken')):
        this.logger.log('Event name: CreateToken');
        this.handleCreateTokenEvent(header, event, transaction);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }

  private async handleCreateTokenEvent(
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
    const [_, callerFelt, tokenAddressFelt] = event.keys;

    const ownerAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(callerFelt).toString(16)}`,
    ) as ContractAddress;

    const tokenAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(tokenAddressFelt).toString(16)}`,
    ) as ContractAddress;

    const [
      symbolFelt,
      nameFelt,
      initialSupplyLow,
      initialSupplyHigh,
      totalSupplyLow,
      totalSupplyHigh,
    ] = event.data;

    const symbol = symbolFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(symbolFelt).toString(),
        )
      : '';

    const name = nameFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(nameFelt).toString(),
        )
      : '';

    const initialSupplyRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(initialSupplyLow),
      high: FieldElement.toBigInt(initialSupplyHigh),
    });
    const initialSupply = formatUnits(
      initialSupplyRaw,
      constants.DECIMALS,
    ).toString();

    const totalSupplyRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(totalSupplyLow),
      high: FieldElement.toBigInt(totalSupplyHigh),
    });
    const totalSupply = formatUnits(
      totalSupplyRaw,
      constants.DECIMALS,
    ).toString();

    const data = {
      transactionHash,
      network: 'starknet-sepolia',
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      memecoinAddress: tokenAddress,
      ownerAddress,
      name,
      symbol,
      initialSupply,
      totalSupply,
    };

    await this.deployTokenService.create(data);
  }
}
