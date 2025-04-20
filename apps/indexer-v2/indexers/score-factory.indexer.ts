import { defineIndexer } from '@apibara/indexer';
import { useLogger } from '@apibara/indexer/plugins';
import { drizzleStorage } from '@apibara/plugin-drizzle';
import { decodeEvent, StarknetStream } from '@apibara/starknet';
import { encode, hash } from 'starknet';
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
} from './db/score.db';

const SUB_CREATED = hash.getSelectorFromName('TopicEvent') as `0x${string}`;
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
          keys: [SUB_CREATED],
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
        const subAddress = event.keys[1];

        logger.log('Factory: new Sub Address    : ', `\x1b[35m${subAddress}\x1b[0m`);
        return {
          address: subAddress,
        };
      });

      const daoCreationData = events.map((event) => {
        const decodedEvent = decodeEvent({
          abi: daoFactoryABI,
          event,
          eventName: 'afk::dao::dao_factory::DaoFactory::DaoAACreated',
        });

        const subAddress = decodedEvent.args.contract_address;
        const creator = decodedEvent.args.creator;
        const tokenAddress = decodedEvent.args.token_contract_address;
        const starknetAddress = decodedEvent.args.starknet_address.toString();

        return {
          number: event.eventIndex,
          hash: event.transactionHash,
          contractAddress: subAddress,
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

      if (events.length === 0) {
        return;
      }

      for (const event of events) {
        logger.log(`Found event ${event.keys[0]}`);
        if (event.keys[0] == encode.sanitizeHex(PROPOSAL_CREATED)) {
          logger.log(`Event ProposalCreated in dao ${event.address}`);

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
        } else if (event.keys[0] == encode.sanitizeHex(PROPOSAL_CANCELED)) {
          logger.log(`Event ProposalCanceled in dao ${event.address}`);

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
        } else if (event.keys[0] == encode.sanitizeHex(PROPOSAL_RESOLVED)) {
          logger.log(`Event ProposalResolved in dao ${event.address}`);

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
        } else if (event.keys[0] == encode.sanitizeHex(PROPOSAL_VOTED)) {
          logger.log(`Event ProposalVoted in dao ${event.address}`);

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
