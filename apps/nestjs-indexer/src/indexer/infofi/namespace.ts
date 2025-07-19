import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { hash, uint256, validateAndParseAddress } from 'starknet';
import { IndexerService } from '../indexer.service';
import { ContractAddress } from 'src/common/types';
import { NamespaceService } from 'src/services/nostr-infofi/namespace.service';
import { uint256ToHex } from '../utils';
@Injectable()
export class NamespaceIndexer {
  private readonly logger = new Logger(NamespaceIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(NamespaceService)
    private readonly nostrInfofiService: NamespaceService,
    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('AdminAddNostrProfile')),
      validateAndParseAddress(hash.getSelectorFromName('LinkedDefaultStarknetAddressEvent')),
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
      case validateAndParseAddress(hash.getSelectorFromName('LinkedDefaultStarknetAddressEvent')):
        this.logger.log('Event name: LinkedDefaultStarknetAddressEvent');
        await this.handleLinkedDefaultStarknetAddressEvent(header, event, transaction);
        break;
      case validateAndParseAddress(hash.getSelectorFromName('AdminAddNostrProfile')):
        this.logger.log('Event name: AdminAddNostrProfile');
        await this.handleAdminAddNostrProfileEvent(header, event, transaction);
        break;

      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }

  // TODO
  // finish handle claim event
  private async handleAdminAddNostrProfileEvent(
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
    const [_, nostrPubkeyLow, nostrPubkeyHigh] = event.keys;

    const nostrPubkeyRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(nostrPubkeyLow),
      high: FieldElement.toBigInt(nostrPubkeyHigh),
    });


    let nostrAddress = uint256ToHex(nostrPubkeyLow, nostrPubkeyHigh);


    console.log("nostrAddress", nostrAddress);
    if (nostrAddress.startsWith('0x')) {
      nostrAddress = nostrAddress.slice(2, nostrAddress.length);
    }
    // if(nostrAddress?.length > 64){
    //   nostrAddress = nostrAddress.startsWith('0x') ? nostrAddress.slice(2, 64) : nostrAddress.slice(0, 64);
    // }
    const nostrRecipient = uint256ToHex(nostrPubkeyLow, nostrPubkeyHigh);

    console.log("nostrAddress", nostrAddress);
    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      // nostr_address: nostrPubkeyRaw.toString(),
      // nostr_address_hex: nostrAddress,
      nostr_address: nostrAddress,
      nostr_id: nostrRecipient,
      starknet_address: "0",
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
      is_add_by_admin: true,  
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

    console.log("nostrPubkeyRaw", nostrPubkeyRaw);
    const starknetAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(starknetAddressFelt).toString(16)}`,
    ) as ContractAddress;

    let nostrAddress = formatUnits(nostrPubkeyRaw, constants.DECIMALS);
    console.log("nostrAddress", nostrAddress);

    nostrAddress = uint256ToHex(nostrPubkeyLow, nostrPubkeyHigh);
    console.log("nostrAddress", nostrAddress);
    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      nostr_address: nostrAddress,
      // nostr_address: nostrAddress,
      starknet_address: starknetAddress,
      contract_address: constants.contracts.sepolia.NOSTRFI_SCORING_ADDRESS,
    };

    await this.nostrInfofiService.createOrUpdateLinkedDefaultStarknetAddress(data);
  }


}
