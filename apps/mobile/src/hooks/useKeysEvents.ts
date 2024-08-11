import {useQuery} from '@tanstack/react-query';
import {uint256} from 'starknet';

import {ESCROW_ADDRESSES, KEYS_ADDRESS} from '../constants/contracts';
import {CHAIN_ID} from '../constants/env';
import {EventKey, EventKeyForKeysMarketplace} from '../constants/misc';
// import {useAuth} from '../store/auth';
import { useAuth } from 'afk_nostr_sdk';
import { parseCreatedKeyEvent} from '../utils/events';
import {useRpcProvider} from './useRpcProvider';

export const useKeysEvents = () => {
  const provider = useRpcProvider();
  const {publicKey} = useAuth();

  return useQuery({
    queryKey: ['keys', CHAIN_ID],
    queryFn: async () => {
      // if (!publicKey) return [];

      // const {low, high} = uint256.bnToUint256(`0x${publicKey}`);

      const getKeyEvents = async (
        continuationToken?: string,
      ): Promise<Awaited<ReturnType<typeof provider.getEvents>>['events']> => {
        const keysCreated = await provider.getEvents({
          address: KEYS_ADDRESS[CHAIN_ID],
          keys: [
            // [EventKey.DepositEvent, EventKey.TransferEvent],
            [EventKeyForKeysMarketplace.CreateKeys],
            [],
            [],
            // [low.toString(), high.toString()],
          ],
          to_block: 'pending',
          chunk_size: 1000,
          continuation_token: continuationToken,
        });
        console.log("keys created",keysCreated)
        if (keysCreated.continuation_token) {
          const next = await getKeyEvents(keysCreated.continuation_token);
          return [...keysCreated.events, ...next];
        }

        return keysCreated.events;
      };
      const keysEvents = (await getKeyEvents())
        .map((event) => parseCreatedKeyEvent(event))
        .filter((event): event is NonNullable<ReturnType<typeof parseCreatedKeyEvent>> => !!event);

      return keysEvents.map((key) => ({
        ...key,
      }));
    },
    placeholderData: [],
  });
};
