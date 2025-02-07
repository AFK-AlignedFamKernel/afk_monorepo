import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { hash, shortString, uint256, validateAndParseAddress } from 'starknet';
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

  private isNumeric = (str: string): boolean => {
    return /^\d+$/.test(str);
  };

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

    const [, callerFelt, tokenAddressFelt] = event.keys;

    const ownerAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(callerFelt).toString(16)}`,
    ) as ContractAddress;

    const tokenAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(tokenAddressFelt).toString(16)}`,
    ) as ContractAddress;

    let i = 1;
    let symbol = '';

    while (i < event.data.length) {
      const part = event.data[i];
      const decodedPart = shortString.decodeShortString(
        FieldElement.toBigInt(part).toString(),
      );

      if (this.isNumeric(decodedPart)) {
        i++;
        break;
      }

      symbol += decodedPart;
      i++;
    }

    const part = event.data[i];
    const decodedPart = shortString.decodeShortString(
      FieldElement.toBigInt(part).toString(),
    );

    if (this.isNumeric(decodedPart)) {
      i++;
    }

    let name = '';

    while (i < event.data.length - 5) {
      const part = event.data[i];
      const decodedPart = shortString.decodeShortString(
        FieldElement.toBigInt(part).toString(),
      );

      if (this.isNumeric(decodedPart)) {
        i++;
        break;
      }

      name += decodedPart;
      i++;
    }

    const initialSupplyLow = event.data[i++];
    const initialSupplyHigh = event.data[i++];
    const initialSupplyRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(initialSupplyLow),
      high: FieldElement.toBigInt(initialSupplyHigh),
    });
    const initialSupply = formatUnits(
      initialSupplyRaw,
      constants.DECIMALS,
    ).toString();

    console.log('initial supply', initialSupply);

    const totalSupplyLow = event.data[i++];
    const totalSupplyHigh = event.data[i];
    const totalSupplyRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(totalSupplyLow),
      high: FieldElement.toBigInt(totalSupplyHigh),
    });
    const totalSupply = formatUnits(
      totalSupplyRaw,
      constants.DECIMALS,
    ).toString();

    console.log('total supply', totalSupply);

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
