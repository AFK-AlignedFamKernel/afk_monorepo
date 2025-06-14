import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { hash, shortString, uint256, validateAndParseAddress } from 'starknet';
import { TokenLaunchService } from 'src/services/token-launch/token-launch.service';
import { IndexerService } from './indexer.service';
import { ContractAddress } from 'src/common/types';

@Injectable()
export class TokenLaunchIndexer {
  private readonly logger = new Logger(TokenLaunchIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(TokenLaunchService)
    private readonly tokenLaunchService: TokenLaunchService,

    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('CreateLaunch')),
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
    this.logger.log('Received event TokenLaunch');
    const eventKey = validateAndParseAddress(FieldElement.toHex(event.keys[0]));

    switch (eventKey) {
      case validateAndParseAddress(hash.getSelectorFromName('CreateLaunch')):
        this.logger.log('Event name: CreateLaunch');
        await this.handleTokenLaunchEvent(header, event, transaction);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }

  private async handleTokenLaunchEvent(
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
    const [_, callerFelt, tokenAddressFelt, quoteTokenAddressFelt] = event.keys;

    const ownerAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(callerFelt).toString(16)}`,
    ) as ContractAddress;

    const tokenAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(tokenAddressFelt).toString(16)}`,
    ) as ContractAddress;

    const quoteTokenAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(quoteTokenAddressFelt).toString(16)}`,
    ) as ContractAddress;

    const [
      amountLow,
      amountHigh,
      totalSupplyLow,
      totalSupplyHigh,
      thresholdLiquidityLow,
      thresholdLiquidityHigh,
      bondingTypeFelt,
      creatorFeePercentLow,
      creatorFeePercentHigh,
    ] = event.data;

    const amountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountLow),
      high: FieldElement.toBigInt(amountHigh),
    });
    const amount = formatUnits(amountRaw, constants.DECIMALS).toString();


    const totalSupplyRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(totalSupplyLow),
      high: FieldElement.toBigInt(totalSupplyHigh),
    });
    const totalSupply = formatUnits(
      totalSupplyRaw,
      constants.DECIMALS,
    ).toString();


    const thresholdLiquidityRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(thresholdLiquidityLow),
      high: FieldElement.toBigInt(thresholdLiquidityHigh),
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const thresholdLiquidity = formatUnits(
      thresholdLiquidityRaw,
      constants.DECIMALS,
    ).toString();
    console.log('thresholdLiquidity', thresholdLiquidity);

    // const bondingType = bondingTypeFelt;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bondingType = bondingTypeFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(bondingTypeFelt).toString(),
        )
      : '';

    console.log('bondingType', bondingType);

    const creatorFeePercentRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(creatorFeePercentLow),
      high: FieldElement.toBigInt(creatorFeePercentHigh),
    });
    const creatorFeePercent = formatUnits(creatorFeePercentRaw, 2).toString();

    const data = {
      transactionHash,
      network: 'starknet-sepolia',
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      memecoinAddress: tokenAddress,
      quoteToken: quoteTokenAddress,
      amount: Number(amount),
      totalSupply,
      price:"0",
      ownerAddress,
      bondingType,
      thresholdLiquidity,
      creatorFeePercent,
    };

    await this.tokenLaunchService.create(data);
  }
}
