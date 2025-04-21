import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { hash, uint256, validateAndParseAddress } from 'starknet';
import { IndexerService } from '../indexer.service';
import { ContractAddress } from 'src/common/types';
import { NostrInfofiService } from 'src/services/nostr-infofi/nostr-infofi.service';
import { uint256ToHex } from '../utils';

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
      validateAndParseAddress(hash.getSelectorFromName('DepositRewardsByUserEvent')),
      validateAndParseAddress(hash.getSelectorFromName('NewEpochEvent')),
      validateAndParseAddress(hash.getSelectorFromName('AddTopicsMetadataEvent')),
      validateAndParseAddress(hash.getSelectorFromName('NostrMetadataEvent')),


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
    this.logger.log('Received event sub infofi');
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

      case validateAndParseAddress(hash.getSelectorFromName('AddTopicsMetadataEvent')):
        this.logger.log('Event name: AddTopicsMetadataEvent');
        await this.handleAddTopicsMetadataEvent(header, event, transaction);
        break;

      case validateAndParseAddress(hash.getSelectorFromName('NostrMetadataEvent')):
        this.logger.log('Event name: NostrMetadataEvent');
        await this.handleNostrMetadataEvent(header, event, transaction);
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

    let currentEpochIndex = validateAndParseAddress(
      `0x${FieldElement.toBigInt(currentEpochIndexFelt).toString(16)}`,
    ) as string;

    console.log("currentEpochIndex", currentEpochIndex);
    currentEpochIndex = FieldElement.toBigInt(currentEpochIndexFelt).toString(16);
    console.log("currentEpochIndex", currentEpochIndex);


    let startDuration = validateAndParseAddress(
      `0x${FieldElement.toBigInt(startDurationFelt).toString(16)}`,
    ) as string;

    let endDuration = validateAndParseAddress(
      `0x${FieldElement.toBigInt(endDurationFelt).toString(16)}`,
    ) as string;
    
    


    const data = {
      old_epoch_index: Number(oldEpochIndex),
      current_index_epoch: Number(currentEpochIndex),
      start_duration: new Date(Number(startDuration)),
      end_duration: new Date(Number(endDuration)),
      epoch_duration: Number(epochDurationFelt),
      epoch_index: Number(currentEpochIndex),
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


  private async handleAddTopicsMetadataEvent(
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
    const [_, currentIndexKeywordsFelt] = event.keys;

    const [
      keywordsFelt, mainTopicFelt, mainTagFelt
    ] = event.data;


    const currentIndexKeywords = validateAndParseAddress(
      `0x${FieldElement.toBigInt(currentIndexKeywordsFelt).toString(16)}`,
    ) as string;

    let keywords = validateAndParseAddress(
      `0x${FieldElement.toBigInt(keywordsFelt).toString(16)}`,
    ) as string;

    console.log("keywords", keywords);
    keywords = FieldElement.toBigInt(keywordsFelt).toString(16);
    console.log("keywords", keywords);

    let mainTopic = validateAndParseAddress(
      `0x${FieldElement.toBigInt(mainTopicFelt).toString(16)}`,
    ) as string;

    console.log("mainTopic", mainTopic);

    const data = {
      current_index_keywords: Number(currentIndexKeywords),
      keywords: keywords.split(','),
      keyword: keywords[0],
      main_topic: mainTopic,
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
    };

    await this.nostrInfofiService.handleAddTopicsMetadataEvent(data);
  }

  private async handleNostrMetadataEvent(
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
      eventIdNip72Felt, eventIdNip29Felt, nameFelt, aboutFelt,
    ] = event.data;


    let eventIdNip72 = validateAndParseAddress(
      `0x${FieldElement.toBigInt(eventIdNip72Felt).toString(16)}`,
    ) as string;

    let eventIdNip29 = validateAndParseAddress(
      `0x${FieldElement.toBigInt(eventIdNip29Felt).toString(16)}`,
    ) as string;

    console.log("eventIdNip72", eventIdNip72);
    eventIdNip72 = FieldElement.toBigInt(eventIdNip72Felt).toString(16);
    console.log("eventIdNip72", eventIdNip72);

    console.log("eventIdNip29", eventIdNip29);
    eventIdNip29 = FieldElement.toBigInt(eventIdNip29Felt).toString(16);
    console.log("eventIdNip29", eventIdNip29);

    let name = validateAndParseAddress(
      `0x${FieldElement.toBigInt(nameFelt).toString(16)}`,
    ) as string;

    let about = validateAndParseAddress(
      `0x${FieldElement.toBigInt(aboutFelt).toString(16)}`,
    ) as string;

    console.log("name", name);
    console.log("about", about);  

    const data = {
      name: name,
      about: about, 
      event_id_nip_72: eventIdNip72,
      event_id_nip_29: eventIdNip29,
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
    };

    await this.nostrInfofiService.handleNostrMetadataEvent(data);
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
    // const nostrAddress = validateAndParseAddress(
    //   `0x${nostrAddressRaw.toString(16)}`,
    // ) as ContractAddress;


    let nostrAddress = uint256ToHex(nostrAddressLow, nostrAddressHigh);

    console.log("nostrAddress", nostrAddress);
    if (nostrAddress.startsWith('0x')) {
      nostrAddress = nostrAddress.slice(2, nostrAddress.length);
    }
    console.log("nostrAddress sanitized", nostrAddress);

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
      current_index_epoch: Number(epochIndex),
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

    const [epochIndexFelt, amountTokenLow, amountTokenHigh] = event.data;

    console.log("epochIndexFelt", epochIndexFelt);
    let epochIndex = validateAndParseAddress(
      `0x${FieldElement.toBigInt(epochIndexFelt).toString(16)}`,
    ) as string;

    console.log("epochIndex", epochIndex);
    epochIndex = FieldElement.toBigInt(epochIndexFelt).toString(16);
    console.log("epochIndex", epochIndex);
    const amountTokenRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountTokenLow),
      high: FieldElement.toBigInt(amountTokenHigh),
    });
    const amountToken = formatUnits(amountTokenRaw, constants.DECIMALS).toString();
    console.log("amountToken", amountToken);
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
      current_index_epoch: Number(epochIndex),
      amount_token: amountToken,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      starknet_address: starknetAddress,
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
      amount_algo: amountToken,
      amount_vote: amountToken,
      amount_total: amountToken,
      nostr_address: "0",
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



    let nostrAddress = uint256ToHex(nostrPubkeyLow, nostrPubkeyHigh);

    console.log("nostrAddress", nostrAddress);
    if (nostrAddress.startsWith('0x')) {
      nostrAddress = nostrAddress.slice(2, nostrAddress.length);
    }
    console.log("nostrAddress sanitized", nostrAddress);


    const [_totalAiScoreLow, _totalAiScoreHigh, _totalNostrAddressLow, _totalNostrAddressHigh, _totalPointsWeightLow, _totalPointsWeightHigh, _isClaimedFelt, _claimedAtFelt, _currentIndexEpochFelt] = event.data;


    const totalAiScoreRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(_totalAiScoreLow),
      high: FieldElement.toBigInt(_totalAiScoreHigh),
    });

    const totalAiScore = formatUnits(totalAiScoreRaw, constants.DECIMALS).toString();

    const totalNostrAddressRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(_totalNostrAddressLow),
      high: FieldElement.toBigInt(_totalNostrAddressHigh),
    });

    const totalNostrAddress = formatUnits(totalNostrAddressRaw, constants.DECIMALS).toString();

    const totalPointsWeightRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(_totalPointsWeightLow),
      high: FieldElement.toBigInt(_totalPointsWeightHigh),
    });

    const totalPointsWeight = formatUnits(totalPointsWeightRaw, constants.DECIMALS).toString();

    const isClaimed = FieldElement.toBigInt(_isClaimedFelt).toString(16);

    console.log("claimedAt", _claimedAtFelt);
    const claimedAt = new Date(Number(_claimedAtFelt) * 1000);
    console.log("claimedAt", claimedAt);


    let currentEpochIndex = validateAndParseAddress(
      `0x${FieldElement.toBigInt(_currentIndexEpochFelt).toString(16)}`,
    ) as string;

    console.log("currentEpochIndex", currentEpochIndex);
    currentEpochIndex = FieldElement.toBigInt(_currentIndexEpochFelt).toString(16);
    console.log("currentEpochIndex", currentEpochIndex);

    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      nostr_address: nostrAddress,
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


    const starknetAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(starknetAddressFelt).toString(16)}`,
    ) as ContractAddress;

    let nostrAddress = uint256ToHex(nostrPubkeyLow, nostrPubkeyHigh);

    console.log("nostrAddress", nostrAddress);
    if (nostrAddress.startsWith('0x')) {
      nostrAddress = nostrAddress.slice(2, nostrAddress.length);
    }
    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      nostr_address: nostrAddress,
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

    console.log("handleTipUserWithVoteEvent");
    console.log("handleTipUserWithVoteEvent event", event);

    console.log("event.data", event.data);
    console.log("event.keys", event.keys);

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

    // const nostrAddress = validateAndParseAddress(
    //   `0x${nostrAddressRaw.toString(16)}`,
    // ) as ContractAddress;

    let nostrAddress = uint256ToHex(nostrAddressLow, nostrAddressHigh);

    console.log("nostrAddress", nostrAddress);
    if (nostrAddress.startsWith('0x')) {
      nostrAddress = nostrAddress.slice(2, nostrAddress.length);
    }
    console.log("nostrAddress sanitized", nostrAddress);
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
      // currentIndexEpochFelt,
    ] = event.data;

    console.log("currentIndexEpochFelt", currentIndexEpochFelt);
    // const currentIndexEpoch = validateAndParseAddress(
    //   `0x${FieldElement.toBigInt(currentIndexEpochFelt).toString(16)}`,
    // ) as string;
    let currentIndexEpoch = validateAndParseAddress(
      `0x${FieldElement.toBigInt(currentIndexEpochFelt).toString(16)}`,
    ) as string;
    console.log("currentIndexEpoch", currentIndexEpoch);
    currentIndexEpoch = FieldElement.toBigInt(currentIndexEpochFelt).toString(16)
    console.log("currentIndexEpoch", currentIndexEpoch);
    console.log("amountLow", amountLow);
    console.log("amountHigh", amountHigh);
    const amountRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(amountLow),
      high: FieldElement.toBigInt(amountHigh),
    });
    let amount = formatUnits(amountRaw, constants.DECIMALS).toString();
    console.log("amount", amount);
    // amount = "0";
    // const amountVoteRaw = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(amountVoteLow),
    //   high: FieldElement.toBigInt(amountVoteHigh),
    // });
    // const amountVote = amountVoteRaw.toString();

    console.log("amount", amount);
    // const nostrEventIdRaw = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(nostrEventIdLow),
    //   high: FieldElement.toBigInt(nostrEventIdHigh),
    // });
    // const nostrEventId = validateAndParseAddress(
    //   `0x${nostrEventIdRaw.toString(16)}`,
    // ) as ContractAddress;


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
      amount_vote: amount,
      nostr_event_id: nostrAddress,
      current_index_epoch: Number(currentIndexEpoch) ?? 0,
      epoch_index: Number(currentIndexEpoch) ?? 0,
      timestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
    };

    await this.nostrInfofiService.createTipUserWithVote(data);
  }
}
