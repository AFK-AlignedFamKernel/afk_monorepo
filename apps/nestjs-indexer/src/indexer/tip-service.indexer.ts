import { Inject, Injectable, Logger } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { hash, validateAndParseAddress } from 'starknet';
import { TipService } from '../services/tip-service/tip.service';
import { v1alpha2 as starknet } from '@apibara/starknet/dist/proto';
import { FieldElement } from '@apibara/starknet';
import {
  feltToAddress,
  getEventTxData,
  uint256ToAmount,
  uint256ToHex,
} from './utils';

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
    try {
      const eventKey = validateAndParseAddress(
        FieldElement.toHex(event.keys[0]),
      );

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
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async handleTipDepositEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    const commonTxData = getEventTxData(header, transaction);

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [
      _,
      depositIdFelt,
      senderFelt,
      nostrRecipientLow,
      nostrRecipientHigh,
    ] = event.keys;

    const depositId = FieldElement.toBigInt(depositIdFelt).toString();
    const sender = feltToAddress(senderFelt);
    const nostrRecipient = uint256ToHex(nostrRecipientLow, nostrRecipientHigh);

    const [amountLow, amountHigh, contractAddressFelt] = event.data;
    const amount = uint256ToAmount(amountLow, amountHigh);
    const tokenAddress = feltToAddress(contractAddressFelt);

    const data = {
      ...commonTxData,
      depositId,
      sender,
      nostrRecipient,
      tokenAddress,
      amount,
    };

    await this.tipService.createDeposit(data);
  }

  private async handleTipTransferEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    const commonTxData = getEventTxData(header, transaction);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [
      _,
      senderFelt,
      nostrRecipientLow,
      nostrRecipientHigh,
      starknetRecipientFelt,
    ] = event.keys;

    const sender = feltToAddress(senderFelt);
    const nostrRecipient = uint256ToHex(nostrRecipientLow, nostrRecipientHigh);
    const starknetRecipient = feltToAddress(starknetRecipientFelt);

    const [amountLow, amountHigh, contractAddressFelt] = event.data;

    const amount = uint256ToAmount(amountLow, amountHigh);
    const tokenAddress = feltToAddress(contractAddressFelt);

    const data = {
      ...commonTxData,
      sender,
      nostrRecipient,
      starknetRecipient,
      tokenAddress,
      amount,
    };

    await this.tipService.createTransfer(data);
  }

  private async handleTipClaimEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    const commonTxData = getEventTxData(header, transaction);

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [
      _,
      depositIdFelt,
      senderFelt,
      nostrRecipientLow,
      nostrRecipientHigh,
      starknetRecipientFelt,
    ] = event.keys;

    const depositId = FieldElement.toBigInt(depositIdFelt).toString();
    const sender = feltToAddress(senderFelt);
    const nostrRecipient = uint256ToHex(nostrRecipientLow, nostrRecipientHigh);
    const starknetRecipient = feltToAddress(starknetRecipientFelt);

    const [
      amountLow,
      amountHigh,
      contractAddressFelt,
      gasTokenAddressFelt,
      gasAmountLow,
      gasAmountHigh,
    ] = event.data;

    const amount = uint256ToAmount(amountLow, amountHigh);
    const tokenAddress = feltToAddress(contractAddressFelt);
    const gasAmount = uint256ToAmount(gasAmountLow, gasAmountHigh);
    const gasTokenAddress = feltToAddress(gasTokenAddressFelt);

    const data = {
      ...commonTxData,
      depositId,
      sender,
      nostrRecipient,
      starknetRecipient,
      amount,
      tokenAddress,
      gasTokenAddress,
      gasAmount,
    };

    await this.tipService.updateClaim(data);
  }

  private async handleTipCancelEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    const commonTxData = getEventTxData(header, transaction);

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [
      _,
      depositIdFelt,
      senderFelt,
      nostrRecipientLow,
      nostrRecipientHigh,
    ] = event.keys;

    const depositId = FieldElement.toBigInt(depositIdFelt).toString();
    const sender = feltToAddress(senderFelt);
    const nostrRecipient = uint256ToHex(nostrRecipientLow, nostrRecipientHigh);

    const [amountLow, amountHigh, contractAddressFelt] = event.data;
    const amount = uint256ToAmount(amountLow, amountHigh);
    const tokenAddress = feltToAddress(contractAddressFelt);

    const data = {
      ...commonTxData,
      depositId,
      sender,
      nostrRecipient,
      tokenAddress,
      amount: Number(amount),
    };

    await this.tipService.updateCancel(data);
  }
}
