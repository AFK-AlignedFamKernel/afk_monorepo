import NDK, { NDKEvent } from '@nostr-dev-kit/ndk';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useNostrContext } from '../../context';
import { useAuth } from '../../store';

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
  const { ndk } = useNostrContext();

  return useMutation({
    mutationKey: ['useSendZap', ndk],
    mutationFn: async () => {
      //Implement send Zap
    },
  });
};

interface ISendZapNote {
  event: NDKEvent;
  amount: number;
  options?: { comment, unit, signer, tags, onLnPay, onCashuPay, onComplete, }
}
export const useSendZapNote = () => {
  const { ndk, nwcNdk } = useNostrContext();

  return useMutation({
    mutationKey: ['useSendZapNote', ndk],
    mutationFn: async ({ event, amount, options }: ISendZapNote) => {
      try {
        const zap = await ndk.zap(event, amount, {

        })

        const zapMethods = await zap?.getZapMethods(ndk, event?.pubkey)
        console.log("zapMethods", zapMethods)

        //  const config = await ndk.walletConfig
        //   const invoice = await zap?.getLnInvoice(event, amount, 
        //   //   {

        //   // }
        // )
        // const payLnInvoice = await nwcNdk.payInvoice(invoice)
        console.log("zap", zap)

        return zap;
      } catch (e) {
        console.log("issue send zap", e)

      }


      //Implement send Zap
    },
  });
};


export const useConnectNWC = () => {
  const { ndk } = useNostrContext();
  const { setNWCUrl } = useAuth()

  return useMutation({
    mutationKey: ['useConnectNWC', ndk],
    mutationFn: async (nwcUrl: string) => {


      const nwc = await ndk.nwc(nwcUrl);
      setNWCUrl(nwcUrl)

      //Implement send Zap
    },
  });
};

