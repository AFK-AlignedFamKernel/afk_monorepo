import { Inject, Injectable, Logger } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { hash, shortString, uint256, validateAndParseAddress } from 'starknet';
import { TipService } from '../services/tip-service/tip.service';
import { v1alpha2 as starknet } from '@apibara/starknet/dist/proto';
import { FieldElement } from '@apibara/starknet';
import { ContractAddress } from '../common/types';
import { formatUnits } from 'viem';
import constants from '../common/constants';

@Injectable()
export class TipServiceIndexer {
  private readonly logger = new Logger(TipServiceIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(TipService)
    private readonly tipService: TipService,

    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('DepositEvent')),
      validateAndParseAddress(hash.getSelectorFromName('TransferEvent')),
      validateAndParseAddress(hash.getSelectorFromName('ClaimEvent')),
      validateAndParseAddress(hash.getSelectorFromName('CancelEvent')),
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
      case validateAndParseAddress(hash.getSelectorFromName('DepositEvent')):
        this.logger.log('Event name: DepositEvent');
        await this.handleTipDepositEvent(header, event, transaction);
        break;
      case validateAndParseAddress(hash.getSelectorFromName('TransferEvent')):
        this.logger.log('Event name: TransferEvent');
        await this.handleTipTransferEvent(header, event, transaction);
        break;
      case validateAndParseAddress(hash.getSelectorFromName('ClaimEvent')):
        this.logger.log('Event name: ClaimEvent');
        await this.handleTipClaimEvent(header, event, transaction);
        break;
      case validateAndParseAddress(hash.getSelectorFromName('CancelEvent')):
        this.logger.log('Event name: CancelEvent');
        await this.handleTipCancelEvent(header, event, transaction);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }

  private async handleTipDepositEvent(
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
    const [_, depositIdFelt, senderFelt, nostrRecipientFelt] = event.keys;

    const depositId = depositIdFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(depositIdFelt).toString(),
        )
      : '';

    const senderAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(senderFelt).toString(16)}`,
    ) as ContractAddress;

    const nostrRecipient = validateAndParseAddress(
      `0x${FieldElement.toBigInt(nostrRecipientFelt).toString(16)}`,
    ) as ContractAddress;

    const [amountLow, amountHigh, contractAddressFelt] = event.data;

    const amountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountLow),
      high: FieldElement.toBigInt(amountHigh),
    });
    const amount = formatUnits(amountRaw, constants.DECIMALS).toString();

    const tokenAddress = contractAddressFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(contractAddressFelt).toString(),
        )
      : '';

    const data = {
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      depositId,
      sender: senderAddress,
      nostrRecipient,
      tokenAddress,
      amount: Number(amount),
    };

    await this.tipService.createDeposit(data);
  }

  private async handleTipTransferEvent(
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
    const [_, senderFelt, nostrRecipientFelt, starknetRecipientFelt] =
      event.keys;

    const senderAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(senderFelt).toString(16)}`,
    ) as ContractAddress;

    const nostrRecipient = validateAndParseAddress(
      `0x${FieldElement.toBigInt(nostrRecipientFelt).toString(16)}`,
    ) as ContractAddress;

    const starknetRecipient = validateAndParseAddress(
      `0x${FieldElement.toBigInt(starknetRecipientFelt).toString(16)}`,
    ) as ContractAddress;

    const [amountLow, amountHigh, contractAddressFelt] = event.data;

    const amountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountLow),
      high: FieldElement.toBigInt(amountHigh),
    });
    const amount = formatUnits(amountRaw, constants.DECIMALS).toString();

    const tokenAddress = contractAddressFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(contractAddressFelt).toString(),
        )
      : '';

    const data = {
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      sender: senderAddress,
      nostrRecipient,
      starknetRecipient,
      tokenAddress,
      amount: Number(amount),
    };

    await this.tipService.createTransfer(data);
  }

  private async handleTipClaimEvent(
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

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [
      _,
      depositIdFelt,
      senderFelt,
      nostrRecipientFelt,
      starknetRecipientFelt,
    ] = event.keys;

    const depositId = depositIdFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(depositIdFelt).toString(),
        )
      : '';

    const sender = validateAndParseAddress(
      `0x${FieldElement.toBigInt(senderFelt).toString(16)}`,
    ) as ContractAddress;

    const nostrRecipient = validateAndParseAddress(
      `0x${FieldElement.toBigInt(nostrRecipientFelt).toString(16)}`,
    ) as ContractAddress;

    const starknetRecipient = validateAndParseAddress(
      `0x${FieldElement.toBigInt(starknetRecipientFelt).toString(16)}`,
    ) as ContractAddress;

    const [
      amountLow,
      amountHigh,
      contractAddressFelt,
      gasAmountLow,
      gasAmountHigh,
      gasTokenAddressFelt,
    ] = event.data;

    const amountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountLow),
      high: FieldElement.toBigInt(amountHigh),
    });
    const amount = formatUnits(amountRaw, constants.DECIMALS).toString();

    const tokenAddress = contractAddressFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(contractAddressFelt).toString(),
        )
      : '';

    const gasAmountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(gasAmountLow),
      high: FieldElement.toBigInt(gasAmountHigh),
    });
    const gasAmount = formatUnits(gasAmountRaw, constants.DECIMALS).toString();

    const gasTokenAddress = gasTokenAddressFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(gasTokenAddressFelt).toString(),
        )
      : '';

    const data = {
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      depositId,
      sender,
      nostrRecipient,
      starknetRecipient,
      amount: Number(amount),
      tokenAddress,
      gasTokenAddress,
      gasAmount: Number(gasAmount),
    };

    await this.tipService.updateClaim(data);
  }

  private async handleTipCancelEvent(
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

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [_, depositIdFelt, senderFelt, nostrRecipientFelt] = event.keys;

    const depositId = depositIdFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(depositIdFelt).toString(),
        )
      : '';

    const sender = validateAndParseAddress(
      `0x${FieldElement.toBigInt(senderFelt).toString(16)}`,
    ) as ContractAddress;

    const nostrRecipient = validateAndParseAddress(
      `0x${FieldElement.toBigInt(nostrRecipientFelt).toString(16)}`,
    ) as ContractAddress;

    const [amountLow, amountHigh, contractAddressFelt] = event.data;

    const amountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountLow),
      high: FieldElement.toBigInt(amountHigh),
    });
    const amount = formatUnits(amountRaw, constants.DECIMALS).toString();

    const tokenAddress = contractAddressFelt
      ? shortString.decodeShortString(
          FieldElement.toBigInt(contractAddressFelt).toString(),
        )
      : '';

    const data = {
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      depositId,
      sender,
      nostrRecipient,
      tokenAddress,
      amount: Number(amount),
    };

    await this.tipService.updateCancel(data);
  }
}
