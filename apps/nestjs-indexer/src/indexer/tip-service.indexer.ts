import { Inject, Injectable, Logger } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { hash, shortString, uint256, validateAndParseAddress } from 'starknet';
import { TipService } from '../services/tip-service/tip.service';
import { v1alpha2 as starknet } from '@apibara/starknet/dist/proto';
import { FieldElement } from '@apibara/starknet';
import { ContractAddress } from '../common/types';
import { formatUnits } from 'viem';
import constants from '../common/constants';
import { apibara } from '@apibara/starknet/dist/proto/generated';
import IFieldElement = apibara.starknet.v1alpha2.IFieldElement;

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
    } catch (error) {
      this.logger.error(error);
    }

  }

  private getTxData(
    header: starknet.IBlockHeader,
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

      return {
        network: 'starknet-sepolia',
        transactionHash,
        blockNumber: Number(blockNumber),
        blockHash,
        blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      };
    } catch (error) {
      this.logger.error(error);
    }

  }

  private getAddress(addressFelt: IFieldElement) {
    try {
      return validateAndParseAddress(
        `0x${FieldElement.toBigInt(addressFelt).toString(16)}`,
      ) as ContractAddress;      
    } catch (error) {
      this.logger.error(error);
    }

  }

  private getU256ToHex(lowFelt: IFieldElement, highFelt: IFieldElement) {
    try {
      return uint256
        .uint256ToBN({
          low: FieldElement.toBigInt(lowFelt),
          high: FieldElement.toBigInt(highFelt),
        })
        .toString(16);
    } catch (error) {
      this.logger.error(error);
    }

  }

  private uint256ToAmount(lowFelt: IFieldElement, highFelt: IFieldElement) {
    try {
      const rawData = uint256.uint256ToBN({
        low: FieldElement.toBigInt(lowFelt),
        high: FieldElement.toBigInt(highFelt),
      });
      return Number(formatUnits(rawData, constants.DECIMALS));
    } catch (error) {
      this.logger.error(error);
    }

  }

  private async handleTipDepositEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    try {
      const commonTxData = this.getTxData(header, transaction);

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
      const sender = this.getAddress(senderFelt);
      const nostrRecipient = this.getU256ToHex(
        nostrRecipientLow,
        nostrRecipientHigh,
      );

      const [amountLow, amountHigh, contractAddressFelt, gasTokenAddressFelt, gasAmountLow, gasAmountHigh] = event.data;
      const amount = this.uint256ToAmount(amountLow, amountHigh);
      const tokenAddress = this.getAddress(contractAddressFelt);
      // const gasTokenAddress = this.getAddress(gasTokenAddressFelt);
      // const gasAmount = this.uint256ToAmount(gasAmountLow, gasAmountHigh);

      const data = {
        ...commonTxData,
        depositId,
        sender,
        nostrRecipient,
        tokenAddress,
        amount,
      };

      await this.tipService.createDeposit(data);
    } catch (error) {
      this.logger.error(error);
    }

  }

  private async handleTipTransferEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    try {
      const commonTxData = this.getTxData(header, transaction);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [
        _,
        senderFelt,
        nostrRecipientLow,
        nostrRecipientHigh,
        starknetRecipientFelt,
      ] = event.keys;
  
      const sender = this.getAddress(senderFelt);
      const nostrRecipient = this.getU256ToHex(
        nostrRecipientLow,
        nostrRecipientHigh,
      );
      const starknetRecipient = this.getAddress(starknetRecipientFelt);
  
      const [amountLow, amountHigh, contractAddressFelt] = event.data;
  
      const amount = this.uint256ToAmount(amountLow, amountHigh);
      const tokenAddress = this.getAddress(contractAddressFelt);
  
      const data = {
        ...commonTxData,
        sender,
        nostrRecipient,
        starknetRecipient,
        tokenAddress,
        amount,
      };
  
      await this.tipService.createTransfer(data);
    } catch (error) {
      this.logger.error(error);
    }
   
  }

  private async handleTipClaimEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
    ) {
    try {
      const commonTxData = this.getTxData(header, transaction);

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
      const sender = this.getAddress(senderFelt);
      const nostrRecipient = this.getU256ToHex(
        nostrRecipientLow,
        nostrRecipientHigh,
      );
      const starknetRecipient = this.getAddress(starknetRecipientFelt);
  
      const [
        amountLow,
        amountHigh,
        contractAddressFelt,
        gasAmountLow,
        gasAmountHigh,
        gasTokenAddressFelt,
      ] = event.data;
  
      const amount = this.uint256ToAmount(amountLow, amountHigh);
      const tokenAddress = this.getAddress(contractAddressFelt);
      const gasAmount = this.uint256ToAmount(gasAmountLow, gasAmountHigh);
      const gasTokenAddress = this.getAddress(gasTokenAddressFelt);
  
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
    } catch (error) {
      this.logger.error(error);
    }
  
  }

  private async handleTipCancelEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    try {
      this.logger.error(error); const commonTxData = this.getTxData(header, transaction);

      /* eslint-disable @typescript-eslint/no-unused-vars */
      const [
        _,
        depositIdFelt,
        senderFelt,
        nostrRecipientLow,
        nostrRecipientHigh,
      ] = event.keys;
  
      const depositId = FieldElement.toBigInt(depositIdFelt).toString();
      const sender = this.getAddress(senderFelt);
      const nostrRecipient = this.getU256ToHex(
        nostrRecipientLow,
        nostrRecipientHigh,
      );
  
      const [amountLow, amountHigh, contractAddressFelt] = event.data;
      const amount = this.uint256ToAmount(amountLow, amountHigh);
      const tokenAddress = this.getAddress(contractAddressFelt);
  
      const data = {
        ...commonTxData,
        depositId,
        sender,
        nostrRecipient,
        tokenAddress,
        amount: Number(amount),
      };
  
      await this.tipService.updateCancel(data);
    
    } catch (error) {
      this.logger.error(error);
        
    }
   
  }
}
