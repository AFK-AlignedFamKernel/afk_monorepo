import { defineIndexer } from '@apibara/indexer';
import { useLogger } from '@apibara/indexer/plugins';
import { drizzleStorage, useDrizzleStorage } from '@apibara/plugin-drizzle';
import { StarknetStream } from '@apibara/starknet';
import { hash } from 'starknet';
import { ApibaraRuntimeConfig } from 'apibara/types';
import { daoCreation } from 'indexer-v2-db/dist/lib/schema';
import { db } from 'indexer-v2-db/dist/lib/db';

const DAO_AA_CREATED = hash.getSelectorFromName('DaoAACreated') as `0x${string}`;
const PROPOSAL_CREATED = hash.getSelectorFromName('ProposalCreated') as `0x${string}`;
const PROPOSAL_VOTED = hash.getSelectorFromName('ProposalVoted') as `0x${string}`;
const PROPOSAL_CANCELED = hash.getSelectorFromName('ProposalCanceled') as `0x${string}`;
const PROPOSAL_RESOLVED = hash.getSelectorFromName('ProposalResolved') as `0x${string}`;

export default function (config: ApibaraRuntimeConfig) {
  return defineIndexer(StarknetStream)({
    streamUrl: 'https://starknet-sepolia.preview.apibara.org',
    startingCursor: {
      orderKey: 500_000n,
    },
    filter: {
      events: [
        {
          address: '0x67abfcaab98916c954c6a82260f61f566488dd72d94a6b1fb6be0cd2462703e', // DAO Factory to deploy
          keys: [DAO_AA_CREATED],
        },
      ],
    },
    plugins: [drizzleStorage({ db })],
    async factory({ block: { events }, context }) {
      const logger = useLogger();
      const { db } = useDrizzleStorage();

      if (events.length === 0) {
        return {};
      }

      const daoCreationEvents = events.map((event) => {
        const daoAddress = event.keys[1];

        logger.log('Factory: new DAO Address    : ', `\x1b[35m${daoAddress}\x1b[0m`);
        return {
          address: daoAddress,
          keys: [PROPOSAL_CREATED, PROPOSAL_VOTED, PROPOSAL_CANCELED, PROPOSAL_RESOLVED],
        };
      });

      const daoCreationData = events.map((event) => {
        const daoAddress = event.keys[0];
        const creator = event.data[0];
        const tokenAddress = event.data[1];
        const starknetAddress = event.data[2];

        return {
          number: event.eventIndex,
          hash: event.address,
          contractAddress: daoAddress,
          creator,
          tokenAddress,
          starknetAddress,
        };
      });

      await db.insert(daoCreation).values(daoCreationData).onConflictDoNothing().execute();

      return {
        filter: {
          events: daoCreationEvents,
        },
      };
    },
    async transform({ block }) {
      const logger = useLogger();
      //const { db } = useDrizzleStorage();
      const { events, header } = block;
      logger.log(`Block number ${header?.blockNumber}`);

      if (events.length === 0) {
        logger.log(`No events found in block ${header?.blockNumber}`);
      }

      for (const event of events) {
        logger.log(`Event ${event.eventIndex} tx=${event.transactionHash}`);
      }
    },
  });
}
