
import { defineIndexer } from "@apibara/indexer";
import { StarknetStream } from "@apibara/starknet";
import { useLogger } from "@apibara/indexer/plugins";
import { hash } from "starknet";
// const {defineIndexer} = require("@apibara/indexer");
// const {StarknetStream} = require("@apibara/starknet")
// const {useLogger} = require("@apibara/indexer/plugins")
// // import { hash } from "starknet";
// const {hash} = require("starknet");
// import { db } from "./lib/db.js";
// import { starknetUsdcTransfers } from "./lib/schema.js";

const DAO_AA_CREATED = hash.getSelectorFromName("DaoAACreated") as `0x${string}`;
const SWAP = hash.getSelectorFromName("Swap") as `0x${string}`;
const shortAddress = (addr?: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export default function (runtimeConfig: any) {
  return defineIndexer(StarknetStream)({
    streamUrl: "https://starknet.preview.apibara.org",
    finality: "accepted",
    startingBlock: 800_000n,
    filter: {
      events: [
        {
          address:
            "0x67abfcaab98916c954c6a82260f61f566488dd72d94a6b1fb6be0cd2462703e",
          keys: [DAO_AA_CREATED],
        },
      ],
    },
    async factory({ block: { events } }) {
      const logger = useLogger();

      const poolEvents = (events ?? []).flatMap((event) => {
        const pairAddress = event.data?.[2];

        logger.log(
          "Factory: PairAddress    : ",
          `\x1b[35m${pairAddress}\x1b[0m`,
        );
        return {
          address: pairAddress,
          keys: [SWAP],
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
      const { events } = block;

      logger.log("Transforming...         : ", endCursor?.orderKey);
      for (const event of events) {
        logger.log(
          "Event Address           : ",
          shortAddress(event.address),
          "| Txn hash :",
          shortAddress(event.transactionHash),
        );

        const pairAddress = event.data?.[2];
        const txHash = event.transactionHash;
        const blockNumber = block.header.blockNumber;
        const blockTimestamp = block.header.timestamp;

        // await db.insert(starknetUsdcTransfers).values({ 
        //   hash: txHash,
        //   number: Number(blockNumber)
        // });
      }
    },
  });
}