import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { hash, uint256, validateAndParseAddress } from 'starknet';
import { IndexerService } from '../indexer.service';
import { ContractAddress } from 'src/common/types';
import { NostrInfofiService } from 'src/services/nostr-infofi/nostr-infofi.service';

@Injectable()
export class InfoFiIndexer {
  private readonly logger = new Logger(InfoFiIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(NostrInfofiService)
    private readonly nostrInfofiService: NostrInfofiService,
    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('TipUserWithVote')),
      validateAndParseAddress(hash.getSelectorFromName('LinkedDefaultStarknetAddressEvent')),
      validateAndParseAddress(hash.getSelectorFromName('TipToClaimByUserBecauseNotLinked')),

      validateAndParseAddress(hash.getSelectorFromName('DistributionRewardsByUserEvent')),
      validateAndParseAddress(hash.getSelectorFromName('PushAlgoScoreEvent')),
      validateAndParseAddress(hash.getSelectorFromName('AddTopicsMetadataEvent')),
      validateAndParseAddress(hash.getSelectorFromName('NostrMetadataEvent')),
      validateAndParseAddress(hash.getSelectorFromName('DepositRewardsByUserEvent')),
      validateAndParseAddress(hash.getSelectorFromName('NewEpochEvent')),


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
    this.logger.log('Received event claim user share');
    const eventKey = validateAndParseAddress(FieldElement.toHex(event.keys[0]));

    switch (eventKey) {
      case validateAndParseAddress(hash.getSelectorFromName('NewEpochEvent')):
        this.logger.log('Event name: NewEpochEvent');
        await this.handleNewEpochEvent(header, event, transaction);
        break;
      case validateAndParseAddress(hash.getSelectorFromName('LinkedDefaultStarknetAddressEvent')):
        this.logger.log('Event name: LinkedDefaultStarknetAddressEvent');
        await this.handleLinkedDefaultStarknetAddressEvent(header, event, transaction);
        break;
      case validateAndParseAddress(hash.getSelectorFromName('DepositRewardsByUserEvent')):
        this.logger.log('Event name: DepositRewardsByUserEvent');
        await this.handleDepositRewardsByUserEvent(header, event, transaction);
        break;
      case validateAndParseAddress(hash.getSelectorFromName('DistributionRewardsByUserEvent')):
        this.logger.log('Event name: DistributionRewardsByUserEvent');
        await this.handleDistributionRewardsByUserEvent(header, event, transaction);
        break;
      case validateAndParseAddress(hash.getSelectorFromName('PushAlgoScoreEvent')):
        this.logger.log('Event name: PushAlgoScoreEvent');
        await this.handlePushAlgoScoreEvent(header, event, transaction);
        break;
      case validateAndParseAddress(hash.getSelectorFromName('TipUserWithVote')):
        this.logger.log('Event name: TipUserWithVote');
        await this.handleTipUserWithVoteEvent(header, event, transaction);
        break;

      // case validateAndParseAddress(hash.getSelectorFromName('TipToClaimByUserBecauseNotLinked')):
      //   this.logger.log('Event name: TipToClaimByUserBecauseNotLinked');
      //   await this.handleLinkedDefaultStarknetAddressEvent(header, event, transaction);
      //   break;
      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }


  private async handleNewEpochEvent(
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
    const [_, oldEpochIndexFelt, currentEpochIndexFelt,] = event.keys;

    const [
      startDurationFelt, endDurationFelt, epochDurationFelt
    ] = event.data;


    const oldEpochIndex = validateAndParseAddress(
      `0x${FieldElement.toBigInt(oldEpochIndexFelt).toString(16)}`,
    ) as string;

    const currentEpochIndex = validateAndParseAddress(
      `0x${FieldElement.toBigInt(currentEpochIndexFelt).toString(16)}`,
    ) as string;

    const data = {
      old_epoch_index: Number(oldEpochIndex),
      current_index_epoch: Number(currentEpochIndex),
      start_duration: new Date(Number(startDurationFelt) * 1000),
      end_duration: new Date(Number(endDurationFelt) * 1000),
      epoch_duration: Number(epochDurationFelt),

      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
    };

    await this.nostrInfofiService.handleNewEpochEvent(data);
  }

  private async handleDistributionRewardsByUserEvent(
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
    const [_, starknetAddressFelt, nostrAddressLow, nostrAddressHigh] = event.keys;

    const nostrAddressRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(nostrAddressLow),
      high: FieldElement.toBigInt(nostrAddressHigh),
    });
    const nostrAddress = validateAndParseAddress(
      `0x${nostrAddressRaw.toString(16)}`,
    ) as ContractAddress;


    const [epochIndex, claimedAt, amountAlgoLow, amountAlgoHigh, amountVoteLow, amountVoteHigh, amountTotalLow, amountTotalHigh] = event.data;

    const amountAlgoRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountAlgoLow),
      high: FieldElement.toBigInt(amountAlgoHigh),
    });
    const amountAlgo = formatUnits(amountAlgoRaw, constants.DECIMALS).toString();

    const amountVoteRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountVoteLow),
      high: FieldElement.toBigInt(amountVoteHigh),
    });
    const amountVote = formatUnits(amountVoteRaw, constants.DECIMALS).toString();

    const amountTotalRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountTotalLow),
      high: FieldElement.toBigInt(amountTotalHigh),
    });
    const amountTotal = formatUnits(amountTotalRaw, constants.DECIMALS).toString();

    const starknetAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(starknetAddressFelt).toString(16)}`,
    ) as ContractAddress;

    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      epoch_index: Number(epochIndex),
      amount_algo: amountAlgo,
      amount_vote: amountVote,
      amount_total: amountTotal,
      amount_token: amountTotal,
      nostr_address: nostrAddress,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      starknet_address: starknetAddress,
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
    };

    await this.nostrInfofiService.createOrUpdateDepositRewardsByUser(data);
  }

  private async handleDepositRewardsByUserEvent(
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
    const [_, starknetAddressFelt] = event.keys;



    const [epochIndex, amountTokenLow, amountTokenHigh] = event.data;

    const amountTokenRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountTokenLow),
      high: FieldElement.toBigInt(amountTokenHigh),
    });
    const amountToken = formatUnits(amountTokenRaw, constants.DECIMALS).toString();

    const starknetAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(starknetAddressFelt).toString(16)}`,
    ) as ContractAddress;

    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      epoch_index: Number(epochIndex),
      amount_token: amountToken,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      starknet_address: starknetAddress,
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
    };

    await this.nostrInfofiService.createOrUpdateDepositRewardsByUser(data);
  }

  private async handlePushAlgoScoreEvent(
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
    const [_, nostrPubkeyLow, nostrPubkeyHigh, starknetAddressFelt] = event.keys;


    const nostrPubkeyRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(nostrPubkeyLow),
      high: FieldElement.toBigInt(nostrPubkeyHigh),
    });

    const starknetAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(starknetAddressFelt).toString(16)}`,
    ) as ContractAddress;



    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      nostr_address: nostrPubkeyRaw.toString(),
      starknet_address: starknetAddress,
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
    };

    await this.nostrInfofiService.createOrUpdateLinkedDefaultStarknetAddress(data);
  }


  // TODO
  // finish handle claim event
  private async handleLinkedDefaultStarknetAddressEvent(
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
    const [_, nostrPubkeyLow, nostrPubkeyHigh, starknetAddressFelt] = event.keys;


    const nostrPubkeyRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(nostrPubkeyLow),
      high: FieldElement.toBigInt(nostrPubkeyHigh),
    });

    const starknetAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(starknetAddressFelt).toString(16)}`,
    ) as ContractAddress;



    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      nostr_address: nostrPubkeyRaw.toString(),
      starknet_address: starknetAddress,
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
    };

    await this.nostrInfofiService.createOrUpdateLinkedDefaultStarknetAddress(data);
  }

  // TODO
  // finish handle claim event
  private async handleTipUserWithVoteEvent(
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
    const [_, nostrAddressLow, nostrAddressHigh, starknetAddressFelt] = event.keys;

    const nostrAddressRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(nostrAddressLow),
      high: FieldElement.toBigInt(nostrAddressHigh),
    });

    const nostrAddress = validateAndParseAddress(
      `0x${nostrAddressRaw.toString(16)}`,
    ) as ContractAddress;

    const starknetAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(starknetAddressFelt).toString(16)}`,
    ) as ContractAddress;

    const [
      currentIndexEpochFelt,
      amountLow,
      amountHigh,
      amountVoteLow,
      amountVoteHigh,
      nostrEventIdLow,
      nostrEventIdHigh,
    ] = event.data;

    const currentIndexEpoch = validateAndParseAddress(
      `0x${FieldElement.toBigInt(currentIndexEpochFelt).toString(16)}`,
    ) as string;

    const amountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountLow),
      high: FieldElement.toBigInt(amountHigh),
    });
    const amount = formatUnits(amountRaw, constants.DECIMALS).toString();

    const amountVoteRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountVoteLow),
      high: FieldElement.toBigInt(amountVoteHigh),
    });
    const amountVote = formatUnits(amountVoteRaw, constants.DECIMALS).toString();

    const nostrEventIdRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(nostrEventIdLow),
      high: FieldElement.toBigInt(nostrEventIdHigh),
    });
    const nostrEventId = validateAndParseAddress(
      `0x${nostrEventIdRaw.toString(16)}`,
    ) as ContractAddress;


    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      nostr_address: nostrAddress,
      starknet_address: starknetAddress,
      amount_token: amount,
      amount_vote: amountVote,
      nostr_event_id: nostrEventId,
      current_index_epoch: Number(currentIndexEpoch),
      timestamp: new Date(Number(blockTimestamp.seconds) * 1000),
    };

    await this.nostrInfofiService.createTipUserWithVote(data);
  }
}
