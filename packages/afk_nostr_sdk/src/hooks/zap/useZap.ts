import NDK, {NDKEvent, NDKNwcResponse} from '@nostr-dev-kit/ndk';
import {useMutation, useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../context';
import {useAuth} from '../../store';
import {useLN} from '../ln';
import {Invoice} from '@getalby/lightning-tools';
import {SendPaymentResponse} from '@webbtc/webln-types';

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

interface ISendZapNote {
  event: NDKEvent;
  amount: number;
  lud16?: string;
  options?: {comment; unit; signer; tags; onLnPay; onCashuPay; onComplete};
}
export const useSendZapNote = () => {
  const {ndk, nwcNdk} = useNostrContext();
  const {getInvoiceFromLnAddress, payInvoice, nostrWebLN} = useLN();

  return useMutation({
    mutationKey: ['useSendZapNote', ndk, nwcNdk],
    mutationFn: async ({event, amount, lud16, options}: ISendZapNote) => {
      try {
        const zap = await ndk.zap(event, amount, {});

        console.log('zap', zap);

        let invoiceFromLn: undefined | string;
        let invoice: undefined | Invoice;
        if (lud16) {
          invoice = await getInvoiceFromLnAddress(lud16, amount);
        }

        const zapMethods = await zap?.getZapMethods(ndk, event?.pubkey);
        console.log('zapMethods', zapMethods);

        //  const config = await ndk.walletConfig
        //   const invoice = await zap?.getLnInvoice(event, amount,
        //   //   {

        //   // }
        // )
        let payLnInvoice:
          | NDKNwcResponse<{
              preimage?: string;
            }>
          | undefined;
        console.log('nwcNdk', nwcNdk);

        let paymentResponse: undefined | SendPaymentResponse;
        console.log('nostrWebLN', nostrWebLN);
        if (nostrWebLN && invoice?.paymentRequest) {
          console.log('nostrWebLN', nostrWebLN);

          paymentResponse = await payInvoice(invoice?.paymentRequest);
          console.log('paymentResponse', paymentResponse);
        } else if (nwcNdk && invoice?.paymentRequest) {
          payLnInvoice = await nwcNdk.payInvoice(invoice?.paymentRequest);
          console.log('payLnInvoice', payLnInvoice);
        }

        return {zap, invoice, preimage: payLnInvoice?.result?.preimage, paymentResponse};
      } catch (e) {
        console.log('issue send zap', e);
      }

      //Implement send Zap
    },
  });
};

export const useConnectNWC = () => {
  const {ndk} = useNostrContext();
  const {setNWCUrl} = useAuth();

  return useMutation({
    mutationKey: ['useConnectNWC', ndk],
    mutationFn: async (nwcUrl: string) => {
      const nwc = await ndk.nwc(nwcUrl);
      setNWCUrl(nwcUrl);

      //Implement send Zap
    },
  });
};
