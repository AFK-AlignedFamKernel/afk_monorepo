import { SUB_CREATED ,
  NEW_EPOCH,
  DEPOSIT_REWARDS,
  DISTRIBUTION_REWARDS,
  TIP_USER,
  LINKED_ADDRESS,
  PUSH_ALGO_SCORE,
  ADD_TOPICS,
  NOSTR_METADATA,
} from "@/services/score.service";
import { Abi, StarknetStream, decodeEvent } from "@apibara/starknet";
import { defineIndexer } from "apibara/indexer";
import { useLogger } from "apibara/plugins";

import type { ApibaraRuntimeConfig } from "apibara/types";
import { hash } from "starknet";
import { drizzleStorage } from '@apibara/plugin-drizzle';
import { db } from 'indexer-v2-db';
import { ABI as nostrFiScoringABI } from './abi/infofi/score.abi';
// import { ABI as scoreFactoryABI } from './abi/infofi/score-factory.abi';
import { ABI as scoreFactorySecondABI } from './abi/infofi/scoreFactory.abi';
import { ABI as scoreFactoryABI } from './abi/infofi/score-factory.abi';

const PAIR_CREATED = hash.getSelectorFromName("PairCreated") as `0x${string}`;
const SWAP = hash.getSelectorFromName("Swap") as `0x${string}`;
const shortAddress = (addr?: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  return defineIndexer(StarknetStream)({
    streamUrl: runtimeConfig?.streamUrl ?? "https://starknet.preview.apibara.org",
    // finality: "accepted",
    // startingBlock: 705_000n,
    startingCursor: {
      orderKey: BigInt(runtimeConfig?.startingCursor?.orderKey),
    },
    plugins: [drizzleStorage({
      db: db as any,
    })],
    filter: {
      events: [
        // {
        //   address:
        //     "0x00dad44c139a476c7a17fc8141e6db680e9abc9f56fe249a105094c44382c2fd",
        //   keys: [PAIR_CREATED],
        // },
        {
          address: "0x20f02a8bebe4728add0704b8ffd772595b4ebf03103560e4e23b93bdbf75dec",
          keys: [
            SUB_CREATED,
            // 
            // DEPOSIT_REWARDS,
            // DISTRIBUTION_REWARDS,
            // TIP_USER,
            // LINKED_ADDRESS,
            // PUSH_ALGO_SCORE,
            // ADD_TOPICS,
            // NOSTR_METADATA,
          ],
        },
      ],
    },
    async factory({ block: { events }}) {
      const logger = useLogger();

      const poolEvents = (events ?? []).flatMap((event) => {

        const decodedEvent = decodeEvent({
          abi: scoreFactoryABI as Abi,
          // abi: scoreFactorySecondABI as Abi,
          event,
          eventName: 'afk::infofi::score_factory::TopicEvent',
        });
        const decodedEventSecondAbi = decodeEvent({
          abi: scoreFactoryABI as Abi,
          event,
          eventName: 'afk::infofi::score_factory::TopicEvent',
        });


        console.log("decodedEvent", decodedEvent)
        console.log("args", decodedEvent.args);

        const topicAddress = decodedEvent?.args?.topic_address;
        console.log("topicAddress", topicAddress);
        let pairAddress = event.data?.[2];
        console.log("pairAddress", pairAddress);
        console.log("topicAddress", topicAddress);

        pairAddress = topicAddress;
        const creator = decodedEvent?.args?.admin;
        const tokenAddress = decodedEvent?.args?.main_token_address;
        // const starknetAddress = decodedEvent?.args?.starknet_address?.toString() as string;
        const starknetAddress = decodedEvent?.args?.admin?.toString() as string;

        logger.log(
          "Factory: PairAddress    : ",
          `\x1b[35m${pairAddress}\x1b[0m`,
        );
        
        return {
          address: pairAddress,
          keys: [NEW_EPOCH, DEPOSIT_REWARDS, DISTRIBUTION_REWARDS, TIP_USER, LINKED_ADDRESS, PUSH_ALGO_SCORE, ADD_TOPICS, NOSTR_METADATA],
          number: event.eventIndex,
          hash: event.transactionHash,
          contractAddress: pairAddress,
          creator,
          tokenAddress,
          starknetAddress,
        };
      });

      if (poolEvents.length === 0) {
        return {};
      }

      return {
        filter: {
          events: poolEvents,
        },
      };
    },
    async transform({ block, endCursor }) {
      const logger = useLogger();
      const { events, header } = block;

      logger.log("Transforming...         : ", endCursor?.orderKey);
      logger.log("Event length...         : ", events.length);
      logger.log("Block number...         : ", header?.blockNumber);
      for (const event of events) {
        logger.log(
          "Event Address           : ",
          shortAddress(event.address),
          "| Txn hash :",
          shortAddress(event.transactionHash),
        );
      }
    },
  });
}