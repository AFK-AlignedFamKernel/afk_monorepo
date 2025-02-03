import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { validateAndParseAddress, hash } from 'starknet';
import { IndexerService } from './indexer.service';
import { LiquidityAddedService } from 'src/services/liquidity-added/liquidity-added.service';

@Injectable()
export class LiquidityAddedIndexer {
  private readonly logger = new Logger(LiquidityAddedIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(LiquidityAddedService)
    private readonly liquidityAddedService: LiquidityAddedService,

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
    this.logger.log('Received event liquidity added');
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

  private safeUint256ToBN(
    lowFelt: starknet.IFieldElement,
    highFelt: starknet.IFieldElement,
  ): bigint {
    try {
      const lowStr = FieldElement.toHex(lowFelt);
      const highStr = FieldElement.toHex(highFelt);

      const low = BigInt(`0x${lowStr}`);
      const high = BigInt(`0x${highStr}`);

      this.logger.debug(`Converting uint256 - low: ${low}, high: ${high}`);

      const UINT_128_MAX = BigInt('0xffffffffffffffffffffffffffffffff');
      if (low > UINT_128_MAX || high > UINT_128_MAX) {
        this.logger.warn(`Low or high value exceeds maximum ${UINT_128_MAX}`);
        return UINT_128_MAX;
      }

      const fullValue = (high << BigInt(128)) + low;
      this.logger.debug(`Full value: ${fullValue}`);
      return fullValue;
    } catch (error) {
      this.logger.error('Error converting uint256:', error);
      return BigInt(0);
    }
  }

  private async handleLiquidityAddedEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    const blockNumber = header.blockNumber;
    const blockHashBigInt = BigInt(FieldElement.toHex(header.blockHash));
    const blockHash = `0x${blockHashBigInt.toString(16).padStart(64, '0')}`;
    const blockTimestamp = header.timestamp;

    const transactionHashBigInt = BigInt(
      FieldElement.toHex(transaction.meta.hash),
    );
    const transactionHash = `0x${transactionHashBigInt.toString(16).padStart(64, '0')}`;
    const transferId = `${transactionHash}_${event.index}`;

    const [, callerFelt, tokenAddressFelt] = event.keys;
    const callerBigInt = BigInt(FieldElement.toHex(callerFelt));
    const tokenBigInt = BigInt(FieldElement.toHex(tokenAddressFelt));
    const ownerAddress = `0x${callerBigInt.toString(16).padStart(64, '0')}`;
    const tokenAddress = `0x${tokenBigInt.toString(16).padStart(64, '0')}`;

    const [
      amountLow,
      amountHigh,
      priceLow,
      priceHigh,
      protocolFeeLow,
      protocolFeeHigh,
      lastPriceLow,
      lastPriceHigh,
      quoteAmountLow,
      quoteAmountHigh,
    ] = event.data;

    const amountRaw = this.safeUint256ToBN(amountLow, amountHigh);
    const amount = formatUnits(amountRaw, constants.DECIMALS).toString();

    const priceRaw = this.safeUint256ToBN(priceLow, priceHigh);
    const price = formatUnits(priceRaw, constants.DECIMALS);

    const protocolFeeRaw = this.safeUint256ToBN(
      protocolFeeLow,
      protocolFeeHigh,
    );
    const protocolFee = formatUnits(
      protocolFeeRaw,
      constants.DECIMALS,
    ).toString();

    const lastPriceRaw = this.safeUint256ToBN(lastPriceLow, lastPriceHigh);
    const lastPrice = formatUnits(lastPriceRaw, constants.DECIMALS).toString();

    const quoteAmountRaw = this.safeUint256ToBN(
      quoteAmountLow,
      quoteAmountHigh,
    );
    const quoteAmount = formatUnits(
      quoteAmountRaw,
      constants.DECIMALS,
    ).toString();

    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      ownerAddress,
      memecoinAddress: tokenAddress,
      amount: Number(amount),
      price,
      protocolFee,
      lastPrice,
      quoteAmount,
      timestamp: new Date(Number(blockTimestamp.seconds) * 1000).toISOString(),
      transactionType: 'buy',
    };

    await this.liquidityAddedService.create(data);
  }
}
