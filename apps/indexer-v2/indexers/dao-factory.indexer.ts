import { defineIndexer } from '@apibara/indexer';
import { useLogger } from '@apibara/indexer/plugins';
import { drizzleStorage } from '@apibara/plugin-drizzle';
import { decodeEvent, StarknetStream } from '@apibara/starknet';
import { hash } from 'starknet';
import { ApibaraRuntimeConfig } from 'apibara/types';
import { db } from 'indexer-v2-db';
import { ABI as daoAaABI } from './abi/daoAA.abi';
import { ABI as daoFactoryABI } from './abi/daoFactory.abi';
import {
  insertDaoCreation,
  insertProposal,
  updateProposalCancellation,
  updateProposalResult,
  upsertProposalVote,
} from './db/dao.db';

const DAO_AA_CREATED = hash.getSelectorFromName('DaoAACreated') as `0x${string}`;
const PROPOSAL_CREATED = hash.getSelectorFromName('ProposalCreated') as `0x${string}`;
const PROPOSAL_VOTED = hash.getSelectorFromName('ProposalVoted') as `0x${string}`;
const PROPOSAL_CANCELED = hash.getSelectorFromName('ProposalCanceled') as `0x${string}`;
const PROPOSAL_RESOLVED = hash.getSelectorFromName('ProposalResolved') as `0x${string}`;

export default function (config: ApibaraRuntimeConfig) {
  return defineIndexer(StarknetStream)({
    streamUrl: config.streamUrl,
    startingCursor: {
      orderKey: BigInt(config.startingCursor.orderKey),
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
    async factory({ block: { events } }) {
      const logger = useLogger();

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
        const decodedEvent = decodeEvent({
          abi: daoFactoryABI,
          event,
          eventName: 'afk::dao::dao_factory::DaoFactory::DaoAACreated',
        });

        const daoAddress = decodedEvent.args.contract_address;
        const creator = decodedEvent.args.creator;
        const tokenAddress = decodedEvent.args.token_contract_address;
        const starknetAddress = decodedEvent.args.starknet_address.toString();

        return {
          number: event.eventIndex,
          hash: event.transactionHash,
          contractAddress: daoAddress,
          creator,
          tokenAddress,
          starknetAddress,
        };
      });

      await insertDaoCreation(daoCreationData);

      return {
        filter: {
          events: daoCreationEvents,
        },
      };
    },
    async transform({ block }) {
      const logger = useLogger();
      const { events, header } = block;
      logger.log(`Block number ${header?.blockNumber}`);

      if (events.length === 0) {
        logger.log(`No events found in block ${header?.blockNumber}`);
      }

      for (const event of events) {
        logger.log(`Event ${event.eventIndex} tx=${event.transactionHash}`);

        if (event.keys[0] === PROPOSAL_CREATED) {
          const decodedEvent = decodeEvent({
            abi: daoAaABI,
            event,
            eventName: 'afk::interfaces::voting::ProposalCreated',
          });

          await insertProposal({
            contractAddress: decodedEvent.address,
            proposalId: decodedEvent.args.id,
            creator: decodedEvent.args.owner,
            createdAt: Number(decodedEvent.args.created_at),
            endAt: Number(decodedEvent.args.end_at),
          });
        } else if (event.keys[0] === PROPOSAL_CANCELED) {
          const decodedEvent = decodeEvent({
            abi: daoAaABI,
            event,
            eventName: 'afk::interfaces::voting::ProposalCanceled',
          });

          await updateProposalCancellation(
            decodedEvent.address,
            decodedEvent.args.owner,
            decodedEvent.args.id,
          );
        } else if (event.keys[0] === PROPOSAL_RESOLVED) {
          const decodedEvent = decodeEvent({
            abi: daoAaABI,
            event,
            eventName: 'afk::interfaces::voting::ProposalResolved',
          });

          await updateProposalResult(
            decodedEvent.address,
            decodedEvent.args.owner,
            decodedEvent.args.id,
            decodedEvent.args.result.toString(),
          );
        } else if (event.keys[0] === PROPOSAL_VOTED) {
          const decodedEvent = decodeEvent({
            abi: daoAaABI,
            event,
            eventName: 'afk::interfaces::voting::ProposalVoted',
          });

          await upsertProposalVote({
            contractAddress: decodedEvent.address,
            proposalId: decodedEvent.args.id,
            voter: decodedEvent.args.voter,
            totalVotes: decodedEvent.args.total_votes,
            votedAt: Number(decodedEvent.args.voted_at),
          });
        }
      }
    },
  });
}
