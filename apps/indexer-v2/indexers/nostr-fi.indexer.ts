import {
  SUB_CREATED,
  NEW_EPOCH,
  DEPOSIT_REWARDS,
  DISTRIBUTION_REWARDS,
  TIP_USER,
  LINKED_ADDRESS,
  PUSH_ALGO_SCORE,
  ADD_TOPICS,
  NOSTR_METADATA,
  handleEvent,
  KNOWN_EVENT_KEYS
} from "@/services/score.service";
import { Abi, DecodedEvent, StarknetStream, decodeEvent } from "@apibara/starknet";
import { defineIndexer } from "apibara/indexer";
import { useLogger } from "apibara/plugins";

import type { ApibaraRuntimeConfig } from "apibara/types";
import { hash } from "starknet";
import { drizzleStorage } from '@apibara/plugin-drizzle';
import { db } from 'indexer-v2-db';
import { ABI as nostrFiScoringABI } from './abi/infofi/score.abi';
// import { ABI as scoreFactoryABI } from './abi/infofi/score-factory.abi';
import { scoreFactoryABI as scoreFactorySecondABI } from './abi/infofi/scoreFactory.abi';
import { ABI as scoreFactoryABI } from './abi/infofi/score-factory.abi';
import { insertSubState } from "./db/nostr-fi.db";

const PAIR_CREATED = hash.getSelectorFromName("PairCreated") as `0x${string}`;
const SWAP = hash.getSelectorFromName("Swap") as `0x${string}`;
const shortAddress = (addr?: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  console.log("runtimeConfig", runtimeConfig)
  return defineIndexer(StarknetStream)({
    streamUrl: runtimeConfig?.streamUrl ?? "https://starknet.preview.apibara.org",
    finality: "accepted",
    startingBlock: BigInt(runtimeConfig?.startingBlock ?? 1095000),
    // startingCursor: {
    //   orderKey: runtimeConfig?.startingCursor?.orderKey ?? BigInt(1095000),
    // },
    // startingCursor: {
    //   orderKey: BigInt(runtimeConfig?.startingCursor?.orderKey),
    // },
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
          address: "0x14a4fd9449345aa472b4b4ab69e2547c73bb11b35679f2f3cf38c7a89a6b272",
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
        // keys: [
        //   SUB_CREATED,
        // ]
      ] as const,
    },
    async factory({ block, context }) {
      const logger = useLogger();
      const events = (block?.events ?? []) as readonly {
        address?: `0x${string}`;
        keys?: readonly (`0x${string}` | null)[];
        [key: string]: any;
      }[];
      logger.log("factory started");
      logger.log("events", events.length);

      const subCreationDataArray: any = [];

      // console.log("subCreationDataArray", subCreationDataArray)
      const subEvents = (events ?? []).flatMap((event) => {
        const decodedEvent = decodeEvent({
          abi: scoreFactoryABI as Abi,
          event: event as any,
          eventName: 'afk::infofi::score_factory::TopicEvent',
        }) as DecodedEvent;
        console.log("decodedEvent", decodedEvent);
        console.log("decodedEvent args", decodedEvent?.args);

        const topicAddress = decodedEvent?.args?.topic_address?.toString() as `0x${string}`;
        console.log("topicAddress", topicAddress);

        const creator = decodedEvent?.args?.admin;
        const tokenAddress = decodedEvent?.args?.main_token_address;
        // const starknetAddress = decodedEvent?.args?.starknet_address?.toString() as string;
        const starknetAddress = decodedEvent?.args?.admin?.toString() as string;

        logger.log(
          "Topic Address    : ",
          topicAddress,
        );

        let subCreationData = {
          address: topicAddress,
          keys: [NEW_EPOCH, DEPOSIT_REWARDS, DISTRIBUTION_REWARDS, TIP_USER, LINKED_ADDRESS, PUSH_ALGO_SCORE, ADD_TOPICS, NOSTR_METADATA,],
          number: event.eventIndex,
          hash: event.transactionHash,
          contractAddress: topicAddress,
          contract_address: topicAddress,
          creator,
          tokenAddress,
          starknetAddress,
          main_token_address: tokenAddress,
        };
        subCreationDataArray.push(subCreationData);

        // let eventData = {
        //   address: topicAddress,
        //   keys: [NEW_EPOCH, DEPOSIT_REWARDS, DISTRIBUTION_REWARDS, TIP_USER, LINKED_ADDRESS, PUSH_ALGO_SCORE, ADD_TOPICS, NOSTR_METADATA],
        // }

        let arrayEvents = KNOWN_EVENT_KEYS.map((eventKey) => {
          return {
            address: topicAddress as `0x${string}`,
            keys: [eventKey] as readonly (`0x${string}` | null)[],
          }
        })
        return arrayEvents;
      });
      let filteredSubCreationDataArray = subCreationDataArray.filter((item: any) => item !== undefined);
      // console.log("filteredSubCreationDataArray", filteredSubCreationDataArray)

      if (filteredSubCreationDataArray.length > 0) {
        await insertSubState(filteredSubCreationDataArray as any[]);
      }

      console.log("subEvents", subEvents)


      return {
        filter: {
          events: subEvents as readonly {
            address?: `0x${string}`;
            keys?: readonly (`0x${string}` | null)[];
          }[],
        },
      };
    },
    async transform({ block, endCursor }) {
      const logger = useLogger();
      const { events, header } = block;
      console.log("transform started")

      logger.log("Transforming...         : ", endCursor?.orderKey);
      logger.log("Event length...         : ", events.length);
      logger.log("Block number...         : ", header?.blockNumber);

      for (const event of events) {

        // console.log("event", event)
        logger.log(
          "Event Address           : ",
          shortAddress(event.address),
          "| Txn hash :",
          shortAddress(event.transactionHash),
          shortAddress(event.keys[0]),

        );

        console.log("event?.blockNumber", block?.header?.blockNumber)
        // console.log("event handled", event)

        await handleEvent(event, event.address)

      }
    },
  });
}