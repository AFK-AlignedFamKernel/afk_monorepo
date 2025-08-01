import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { hash, uint256, validateAndParseAddress } from 'starknet';
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
    this.logger.log('Received event');
    const eventKey = validateAndParseAddress(FieldElement.toHex(event.keys[0]));

    switch (eventKey) {
      case validateAndParseAddress(hash.getSelectorFromName('BuyToken')):
        this.logger.log('Event name: BuyToken');
        await this.handleBuyTokenEvent(header, event, transaction);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }

  private async handleBuyTokenEvent(
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
      protocolFeeLow,
      protocolFeeHigh,
      timestampFelt,
      quoteAmountLow,
      quoteAmountHigh,
      creatorFeeLow,
      creatorFeeHigh,
    ] = event.data;

    const amountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountLow),
      high: FieldElement.toBigInt(amountHigh),
    });
    const amount = formatUnits(amountRaw, constants.DECIMALS).toString();


    const protocolFeeRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(protocolFeeLow),
      high: FieldElement.toBigInt(protocolFeeHigh),
    });
    const protocolFee = formatUnits(
      protocolFeeRaw,
      constants.DECIMALS,
    ).toString();

    const creatorFeeRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(creatorFeeLow),
      high: FieldElement.toBigInt(creatorFeeHigh),
    });
    const creatorFee = formatUnits(creatorFeeRaw, 18).toString();

    const quoteAmountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(quoteAmountLow),
      high: FieldElement.toBigInt(quoteAmountHigh),
    });
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
      coinAmount: Number(amount ).toString(),
      price:"0",
      protocolFee,
      lastPrice:"0",
      quoteAmount,
      timestamp,
      transactionType: 'buy',
      creatorFee,
    };

    await this.buyTokenService.create(data);
  }
}
