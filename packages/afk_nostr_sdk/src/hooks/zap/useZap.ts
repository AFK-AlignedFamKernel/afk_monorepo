import {Invoice} from '@getalby/lightning-tools';
import NDK, {NDKEvent, NDKNwcResponse} from '@nostr-dev-kit/ndk';
import {useMutation, useQuery} from '@tanstack/react-query';
import {SendPaymentResponse} from '@webbtc/webln-types';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';
import {useWebLN} from '../shared/useWebLN';

export const useSendZapNote = () => {
  const {ndk, nwcNdk} = useNostrContext();
  const {nostrWebLNState} = useWebLN();

  return useMutation({
    mutationKey: ['useSendZapNote', ndk, nwcNdk],
    mutationFn: async ({event, amount, lud16, options}: ISendZapNote) => {
      // Your existing implementation but use nostrWebLNState instead of useLN
    },
  });
};

// Rest of your existing code