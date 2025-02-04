import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { hash, uint256, validateAndParseAddress } from 'starknet';
import { IndexerService } from './indexer.service';
import { LiquidityAddedService } from 'src/services/liquidity-added/liquidity-added.service';
import { ContractAddress } from '../common/types';

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
        await this.handleLiquidityAddedEvent(header, event, transaction);
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
    const [_, idFeltLow, idFeltHigh, poolFelt, assetFelt, tokenAddressFelt] =
      event.keys;
    // const id = validateAndParseAddress(
    //   `0x${FieldElement.toBigInt(idFelt).toString(16)}`,
    // ) as ContractAddress;
    const idRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(idFeltLow),
      high: FieldElement.toBigInt(idFeltHigh),
    });
    const id = formatUnits(idRaw, constants.DECIMALS).toString();
    const pool = validateAndParseAddress(
      `0x${FieldElement.toBigInt(poolFelt).toString(16)}`,
    ) as ContractAddress;
    const assetAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(assetFelt).toString(16)}`,
    ) as ContractAddress;

    const tokenAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(tokenAddressFelt).toString(16)}`,
    ) as ContractAddress;

    const [
      ownerFelt,
      // amountHigh,
      // priceLow,
      // priceHigh,
      // protocolFeeLow,
      // protocolFeeHigh,
      // lastPriceLow,
      // lastPriceHigh,
      // timestampFelt,
      // quoteAmountLow,
      // quoteAmountHigh,
    ] = event.data;

    const ownerAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(ownerFelt).toString(16)}`,
    ) as ContractAddress;
    // const amountRaw = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(amountLow),
    //   high: FieldElement.toBigInt(amountHigh),
    // });
    // const amount = formatUnits(amountRaw, constants.DECIMALS).toString();

    // const priceRaw = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(priceLow),
    //   high: FieldElement.toBigInt(priceHigh),
    // });
    // const price = formatUnits(priceRaw, constants.DECIMALS);

    // const protocolFeeRaw = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(protocolFeeLow),
    //   high: FieldElement.toBigInt(protocolFeeHigh),
    // });
    // const protocolFee = formatUnits(
    //   protocolFeeRaw,
    //   constants.DECIMALS,
    // ).toString();

    // const lastPriceRaw = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(lastPriceLow),
    //   high: FieldElement.toBigInt(lastPriceHigh),
    // });
    // const lastPrice = formatUnits(lastPriceRaw, constants.DECIMALS).toString();

    // const quoteAmountRaw = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(quoteAmountLow ?? amountLow),
    //   high: FieldElement.toBigInt(quoteAmountHigh ?? amountHigh),
    // });
    // const quoteAmount = formatUnits(
    //   quoteAmountRaw,
    //   constants.DECIMALS,
    // ).toString();

    // const timestamp = new Date(
    //   Number(FieldElement.toBigInt(timestampFelt)) * 1000,
    // );

    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      ownerAddress,
      assetAddress,
      memecoinAddress: tokenAddress,
      pool,
      id,
      // timestamp:blockTimestamp?.seconds,
      date: new Date(Number(blockTimestamp.seconds) * 1000),
      timestamp: new Date(Number(blockTimestamp.seconds) * 1000)?.toString(),
      // amount: Number(amount),
      // price,
      // protocolFee,
      // lastPrice,
      // quoteAmount,
      // timestamp,
      transactionType: 'buy',
    };

    await this.liquidityAddedService.create(data);
  }
}
