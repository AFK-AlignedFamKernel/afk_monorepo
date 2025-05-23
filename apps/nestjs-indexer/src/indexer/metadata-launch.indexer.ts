import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import constants from 'src/common/constants';
import { ByteArray, byteArray, cairo, hash, shortString, uint256, validateAndParseAddress } from 'starknet';
import { BuyTokenService } from 'src/services/buy-token/buy-token.service';
import { IndexerService } from './indexer.service';
import { ContractAddress } from 'src/common/types';
import { MetadataLaunchService } from 'src/services/metadata/metadata.service';

@Injectable()
export class MetadataLaunchIndexer {
  private readonly logger = new Logger(MetadataLaunchIndexer.name);
  private readonly eventKeys: string[];

  constructor(
    @Inject(MetadataLaunchService)
    private readonly metadataLaunchService: MetadataLaunchService,
    @Inject(IndexerService)
    private readonly indexerService: IndexerService,
  ) {
    this.eventKeys = [
      validateAndParseAddress(hash.getSelectorFromName('MetadataCoinAdded')),
    ];
  }

  async onModuleInit() {
    this.indexerService.registerIndexer(
      this.eventKeys,
      this.handleEvents.bind(this),
    );
  }

  private isValidChar = (char: string): boolean => {
    return /^[a-zA-Z0-9\s\-_.!@#$%^&*()/:]+$/.test(char);
  };

  private cleanString = (str: string): string => {
    return str
      .split('')
      .filter((char) => this.isValidChar(char))
      .join('')
      .trim();
  };


  private isNumeric = (str: string): boolean => {
    console.log("str", str);
    return /^\d+$/.test(str);
  };


  private async handleEvents(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    this.logger.log('Received event');
    const eventKey = validateAndParseAddress(FieldElement.toHex(event.keys[0]));

    switch (eventKey) {
      case validateAndParseAddress(hash.getSelectorFromName('MetadataCoinAdded')):
        this.logger.log('Event name: MetadataCoinAdded');
        await this.handeMetadataEvent(header, event, transaction);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventKey}`);
    }
  }

  private async handeMetadataEvent(
    header: starknet.IBlockHeader,
    event: starknet.IEvent,
    transaction: starknet.ITransaction,
  ) {
    const {
      blockNumber,
      blockHash: blockHashFelt,
      timestamp: blockTimestamp,
    } = header;
    console.log("handleMetadataEvent", event);

    const blockHash = validateAndParseAddress(
      `0x${FieldElement.toBigInt(blockHashFelt).toString(16)}`,
    ) as ContractAddress;

    const transactionHashFelt = transaction.meta.hash;
    const transactionHash = validateAndParseAddress(
      `0x${FieldElement.toBigInt(transactionHashFelt).toString(16)}`,
    ) as ContractAddress;

    const transferId = `${transactionHash}_${event.index}`;

    const [, tokenAddressFelt] = event.keys;

    const tokenAddress = validateAndParseAddress(
      `0x${FieldElement.toBigInt(tokenAddressFelt).toString(16)}`,
    ) as ContractAddress;

    const [
      urlFelt,
      nostrEventIdLow,
      nostrEventIdHigh,
      timestampFelt,
      twitterFelt,
      telegramFelt,
      githubFelt,
      websiteFelt,
      descriptionFelt,
    ] = event.data;

    console.log("event.data", event.data);

    let i = 1;

    let url = '';
    try {
      while (i < event.data.length) {
        const part = event.data[i];
        const decodedPart = shortString.decodeShortString(
          FieldElement.toBigInt(part).toString(),
        );

        if (this.isNumeric(decodedPart)) {
          i++;
          break;
        }

        url += decodedPart;
        i++;
      }

      url = this.cleanString(url);
      console.log("url", url);
    } catch (error) {
      console.log("error bytearray", error);
    }


    // const nostrEventId = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(nostrEventIdLow),
    //   high: FieldElement.toBigInt(nostrEventIdHigh),
    // });
    // let nostrEventId = cairo.felt(0);

         
    const nostrEventIdLowFelt = event.data[i++];
    const nostrEventIdHighFelt = event.data[i++];
    const nostrEventIdRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(nostrEventIdLowFelt),
      high: FieldElement.toBigInt(nostrEventIdHighFelt),
    });
    const nostrEventId = formatUnits(
      nostrEventIdRaw,
      constants.DECIMALS,
    ).toString();

    console.log("nostrEventId", nostrEventId);
    const timestamp = new Date(
      Number(FieldElement.toBigInt(timestampFelt)) * 1000,
    );

    /** TODO: 
     * ADD Twitter, Telegram, Github, Website */

    // i += 2;
    i += 3;


    let twitter = '';
    try {
      while (i < event.data.length) {
        const part = event.data[i];
        // const part = twitterFelt[i];
        const decodedPart = shortString.decodeShortString(
          FieldElement.toBigInt(part).toString(),
        );

        if (this.isNumeric(decodedPart)) {
          i++;
          break;
        }

        twitter += decodedPart;
        i++;
      }
      console.log("twitter", twitter);
      twitter = this.cleanString(twitter);
    } catch (error) {
      console.log("error decoding metadata twitter bytearray : ", error);
    }


    let website = '';
    try {
      while (i < event.data.length) {
        const part = event.data[i];
        // const part = websiteFelt[i];
        const decodedPart = shortString.decodeShortString(
          FieldElement.toBigInt(part).toString(),
        );

        if (this.isNumeric(decodedPart)) {
          i++;
          break;
        }

        website += decodedPart;
        i++;
      }
      console.log("website", website);
      website = this.cleanString(website);
    } catch (error) {
      console.log("error decoding metadata website bytearray : ", error);
    }

    let telegram = '';
    try {
      while (i < event.data.length) {
        const part = event.data[i];
        // const part = telegramFelt[i];
        const decodedPart = shortString.decodeShortString(
          FieldElement.toBigInt(part).toString(),
        );

        if (this.isNumeric(decodedPart)) {
          i++;
          break;
        }

        telegram += decodedPart;
        i++;
      }
      console.log("telegram", telegram);
      telegram = this.cleanString(telegram);
      console.log("telegram", telegram);
    } catch (error) {
      console.log("error decoding metadata telegram bytearray : ", error);
    }

    let github = '';
    try {
      while (i < event.data.length) {
        const part = event.data[i];
        // const part = githubFelt[i];
        const decodedPart = shortString.decodeShortString(
          FieldElement.toBigInt(part).toString(),
        );

        if (this.isNumeric(decodedPart)) {
          i++;
          break;
        }

        github += decodedPart;
        i++;
      }
      console.log("github", github);
      github = this.cleanString(github);
      console.log("github", github);
    } catch (error) {
      console.log("error decoding metadata github bytearray : ", error);
    }


    let description = '';

    try {
      while (i < event.data.length) {
        const part = event.data[i];
        const decodedPart = shortString.decodeShortString(
          FieldElement.toBigInt(part).toString(),
        );

        if (this.isNumeric(decodedPart)) {
          i++;
          break;
        }

        description += decodedPart;
        console.log("description", description);

        i++;
      }
      description = this.cleanString(description);
    } catch (error) {
      console.log("error decoding metadata description bytearray : ", error);
    }

    // try {
    //   twitter = byteArray.stringFromByteArray(twitterFelt as ByteArray);
    //   // twitter = byteArray(
    //   //   FieldElement.toBigInt(twitterFelt).toString(),
    //   // );
    //   telegram = shortString.decodeShortString(
    //     FieldElement.toBigInt(telegramFelt).toString(),
    //   );
    //   github = shortString.decodeShortString(
    //     FieldElement.toBigInt(githubFelt).toString(),
    //   );
    //   website = shortString.decodeShortString(
    //     FieldElement.toBigInt(websiteFelt).toString(),
    //   );
    // } catch(e) {
    //   console.log("error decoding metadata bytearray : ", e);
    // }
    console.log("twitter", twitter);
    console.log("telegram", telegram);
    console.log("github", github);
    console.log("website", website);
    console.log("description", description);
    const data = {
      transferId,
      network: 'starknet-sepolia',
      transactionHash,
      blockNumber: Number(blockNumber),
      blockHash,
      blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      memecoinAddress: tokenAddress,
      nostrEventId,
      url: url,
      timestamp: new Date(Number(blockTimestamp.seconds) * 1000),
      transactionType: 'buy',
      twitter,
      telegram,
      github,
      website,
      description,
    };


    await this.metadataLaunchService.createOrUpdate(data);
  }
}
