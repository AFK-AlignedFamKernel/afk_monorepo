import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { validateAndParseAddress, hash } from 'starknet';
import { BuyTokenService } from 'src/services/buy-token/buy-token.service';
import { IndexerService } from './indexer.service';
import { ContractAddress } from 'src/common/types';

@Injectable()
export class BuyTokenIndexer {
  private readonly logger = new Logger(BuyTokenIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(BuyTokenService)
    private readonly buyTokenService: BuyTokenService,

    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('BuyToken')),
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
    try {
      this.logger.log('Received event');
      const eventKey = validateAndParseAddress(
        FieldElement.toHex(event.keys[0]),
      );

      switch (eventKey) {
        case validateAndParseAddress(hash.getSelectorFromName('BuyToken')):
          this.logger.log('Event name: BuyToken');
          await this.handleBuyTokenEvent(header, event, transaction);
          break;
        default:
          this.logger.warn(`Unknown event type: ${eventKey}`);
      }
    } catch (error) {
      this.logger.error('Error in handleEvents:', error);
      throw error;
    }
  }

  private safeUint256ToBN(
    lowFelt: starknet.IFieldElement,
    highFelt: starknet.IFieldElement,
  ): bigint {
    try {
      // Convert FieldElements to BigInts directly
      const low = FieldElement.toBigInt(lowFelt);
      const high = FieldElement.toBigInt(highFelt);

      this.logger.debug(`Converting uint256 - low: ${low}, high: ${high}`);

      // Validate the low and high values
      const UINT_128_MAX = BigInt('0xffffffffffffffffffffffffffffffff');
      if (low > UINT_128_MAX || high > UINT_128_MAX) {
        this.logger.warn(`Low or high value exceeds maximum ${UINT_128_MAX}`);
        // Handle overflow by capping at max value
        return UINT_128_MAX;
      }

      // Combine high and low parts into a single bigint
      const fullValue = (high << BigInt(128)) + low;

      this.logger.debug(`Full value: ${fullValue}`);

      return fullValue;
    } catch (error) {
      this.logger.error('Error converting uint256:', error);
      return BigInt(0);
    }
  }

  private async handleBuyTokenEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    try {
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

      const [, callerFelt, tokenAddressFelt] = event.keys;

      const ownerAddress = validateAndParseAddress(
        `0x${FieldElement.toBigInt(callerFelt).toString(16)}`,
      ) as ContractAddress;

      const tokenAddress = validateAndParseAddress(
        `0x${FieldElement.toBigInt(tokenAddressFelt).toString(16)}`,
      ) as ContractAddress;

      const [
        amountLow,
        amountHigh,
        priceLow,
        priceHigh,
        protocolFeeLow,
        protocolFeeHigh,
        lastPriceLow,
        lastPriceHigh,
        timestampFelt,
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
      const lastPrice = formatUnits(
        lastPriceRaw,
        constants.DECIMALS,
      ).toString();

      const quoteAmountRaw = this.safeUint256ToBN(
        quoteAmountLow,
        quoteAmountHigh,
      );
      const quoteAmount = formatUnits(
        quoteAmountRaw,
        constants.DECIMALS,
      ).toString();

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
        ownerAddress,
        memecoinAddress: tokenAddress,
        amount: Number(amount),
        price,
        protocolFee,
        lastPrice,
        quoteAmount,
        timestamp,
        transactionType: 'buy',
      };

      await this.buyTokenService.create(data);
    } catch (error) {
      this.logger.error('Error in handleBuyTokenEvent:', error);
      throw error;
    }
  }
}
