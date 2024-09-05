import NDK from '@nostr-dev-kit/ndk';
import {useMutation, useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../context';

export const useGetZapInfo = (relayUrl: string) => {
  const ndk = new NDK({
    explicitRelayUrls: [relayUrl], // Specify your relay URL(s) here
  });
  const KIND_ZAP_INFO = 13194;

  return useQuery({
    queryKey: ['getZapInfo'],
    queryFn: async () => {
      // Ensure the SDK connects to the relay before fetching the event
      await ndk.connect();

      // Fetch the event from the specified relay
      const event = await ndk.fetchEvent({
        kinds: [KIND_ZAP_INFO],
      });

      return event;
    },
  });
};

export const useSendZap = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['useSendZap', ndk],
    mutationFn: async () => {
      //Implement send Zap
    },
  });
};
