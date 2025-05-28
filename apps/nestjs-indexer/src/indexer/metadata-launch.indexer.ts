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
    console.log("handleMetadataEvent");

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
      nostrEventIdLow,
      nostrEventIdHigh,
      ipfsHashFelt,
      urlFelt,
      // twitterFelt,
      // telegramFelt,
      // githubFelt,
      // websiteFelt,
      // descriptionFelt,
    ] = event.data;

    console.log("event.data", event.data.length);


    // const nostrEventId = uint256.uint256ToBN({
    //   low: FieldElement.toBigInt(nostrEventIdLow),
    //   high: FieldElement.toBigInt(nostrEventIdHigh),
    // });
    // let nostrEventId = cairo.felt(0);


    const nostrEventIdRaw = uint256.uint256ToBN({
      low: FieldElement.toBigInt(nostrEventIdLow),
      high: FieldElement.toBigInt(nostrEventIdHigh),
    });
    const nostrEventId = formatUnits(
      nostrEventIdRaw,
      constants.DECIMALS,
    ).toString();

    console.log("nostrEventId", nostrEventId);
    // let i = 2;
    let i = 3;
    let ipfsHash = '';
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

        ipfsHash += decodedPart;
        i++;
      }
      console.log("ipfsHash", ipfsHash);

      ipfsHash = this.cleanString(ipfsHash);
      console.log("ipfsHash", ipfsHash);
    } catch (error) {
      console.log("error bytearray", error);
    }

    let bodyMetadata: any | undefined;
    try {

      if (ipfsHash) {
        const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
        const data = await response.json();
        console.log("data", data);
        bodyMetadata = data;
      }

    } catch (error) {
      console.log("error fetching ipfs hash", error);
    }





    /** TODO: 
     * ADD Twitter, Telegram, Github, Website */

    // i += 2;
    // i += 3;


    let ipfsUrl = '';
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

        ipfsUrl += decodedPart;
        i++;
      }
      console.log("ipfsUrl", ipfsUrl);
      ipfsUrl = this.cleanString(ipfsUrl);
    } catch (error) {
      console.log("error decoding metadata ipfsUrl bytearray : ", error);
    }

    try {

      
      if (ipfsUrl ) {
        const response = await fetch(`${ipfsUrl}`);
        const data = await response.json();
        console.log("data", data);
        bodyMetadata = data;
      
      }

    } catch (error) {
      console.log("error fetching website", error);
      if (!bodyMetadata) {
        let retryCount = 0;
        const maxRetries = 3;
        const timeout = 1000; // 1 second timeout

        while (retryCount < maxRetries) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`${ipfsUrl}`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            bodyMetadata = data;
            break;
          } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
              console.log(`Failed to fetch twitter after ${maxRetries} retries:`, error);
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
          }
        }
      }
    }


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
      twitter:bodyMetadata?.twitter ?? twitter ?? '',
      telegram:bodyMetadata?.telegram ?? telegram,
      github:bodyMetadata?.github ?? github ?? '',
      website:bodyMetadata?.website ?? website ?? '',
      description:bodyMetadata?.description ?? description ?? '',
      ipfsHash:bodyMetadata?.ipfsHash ?? ipfsHash ?? ipfsUrl,
    };


    await this.metadataLaunchService.createOrUpdate(data);
  }
}
