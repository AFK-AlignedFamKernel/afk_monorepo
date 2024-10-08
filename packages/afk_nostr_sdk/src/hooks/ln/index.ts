import {useEffect, useMemo, useState} from 'react';
import {webln} from '@getalby/sdk';
import {SendPaymentResponse} from '@webbtc/webln-types';
import {useConnectNWC} from '../zap/useZap';
import {useAuth} from '../../store';
import {Invoice, LightningAddress} from '@getalby/lightning-tools';

export const useLN = () => {
  const {publicKey, setNWCUrl: setNwcUrlStore, nwcUrl: nwcUrlProps} = useAuth();
  const [nwcUrl, setNwcUrl] = useState(nwcUrlProps);
  const [pendingNwcUrl, setPendingNwcUrl] = useState('');
  const [nwcAuthUrl, setNwcAuthUrl] = useState('');
  const [paymentRequest, setPaymentRequest] = useState('');
  const [preimage, setPreimage] = useState('');
  const [nostrWebLNState, setNostrWebLN] = useState<webln.NostrWebLNProvider | undefined>(
    undefined,
  );
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState<string | undefined>();
  const [nostrLnRecipient, setNostrLnRecipient] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
  const [balance, setBalance] = useState<number | undefined>();
  const [connectionData, setConnectionData] = useState<any>(null);
  const {mutate: mutateConnectNDK} = useConnectNWC();
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState(publicKey);
  const [generatedInvoice, setGeneratedInvoice] = useState('');
  const [resultPayment, setResultPayment] = useState<SendPaymentResponse | undefined>();

  const nostrWebLN = useMemo(() => {
    return nostrWebLNState;
    // return nostrWebLNState ?? new webln.NostrWebLNProvider({
    // return nwcUrlProps && new webln.NostrWebLNProvider({
    //     nostrWalletConnectUrl: nwcUrlProps
    // })
  }, [nwcUrl, nwcUrlProps, nostrWebLNState]);
  useEffect(() => {
    if (!nostrWebLN) return;

    fetchData();
  }, [nostrWebLN]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webln) {
      setIsExtensionAvailable(true);
    }
  }, [window]);

  const fetchData = async () => {
    try {
      if (!nostrWebLN) return;

      setIsLoading(true);
      await nostrWebLN.enable();
      const response = await nostrWebLN.getBalance();
      setBalance(response.balance);
      setConnectionStatus('connected');

      const info = await nostrWebLN.getInfo();
      setConnectionData(info);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  function validateInvoice(invoice: string): boolean {
    // A basic check to see if the invoice is too short or doesn't start with 'ln'
    return invoice.length > 50 && invoice.startsWith('ln');
  }
  async function payInvoice(zapRecipient: string): Promise<SendPaymentResponse | undefined> {
    try {
      if (!nostrWebLN) {
        return undefined;
      }

      if (zapRecipient) {
        const isValid = validateInvoice(zapRecipient);

        if (!isValid) {
          return;
        }
        // const result = await nostrWebLN.sendPayment(paymentRequest);
        const result = await nostrWebLN?.sendPayment(zapRecipient);

        if (result) {
          console.log('result', result);
          setPreimage(result.preimage);
          setResultPayment(result);
          return result;
        }
      }

      return undefined;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  const handleZap = async (zapAmount: string, zapRecipient: string) => {
    if (!nostrWebLN || !zapAmount || !zapRecipient) return;
    //Implement zap user
    try {
      setIsLoading(true);
      // Here you would implement the actual zap functionality
      // This is a placeholder for the actual implementation
      console.log(`Zapping ${zapAmount} sats to ${zapRecipient}`);

      const result = await payInvoice(zapRecipient);
      console.log('result invoice pay', result);

      return result;

      // Simulating a delay
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      // setIsZapModalVisible(false);
    } catch (error) {
      console.error('Failed to zap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  async function connectWithAlby() {
    try {
      setConnectionStatus('connecting');
      setIsLoading(true);
      console.log('isExtensionAvailable', isExtensionAvailable);

      if (isExtensionAvailable) {
        try {
          console.log('isExtensionAvailable', isExtensionAvailable);
          await (window as any)?.webln.enable();
          setNostrWebLN((window as any)?.webln);
          setConnectionStatus('connected');
          return (window as any)?.webln;
        } catch (error) {
          console.error('Failed to connect to Alby extension:', error);
        }
      } else {
        // const nwc = webln.NostrWebLNProvider.withNewSecret({});
        const nwc = webln.NostrWebLNProvider.withNewSecret();
        const authUrl = nwc.client.getAuthorizationUrl({name: 'React Native NWC demo'});
        const pendingNwc = nwc.client.getNostrWalletConnectUrl(true);
        console.log('pendingNwc', pendingNwc);
        setPendingNwcUrl(pendingNwc);
        setNwcAuthUrl(authUrl.toString());
        setNwcUrlStore(nwcUrl);
        setNwcUrl(nwcUrl);
        console.log('authUrl', authUrl);
        console.log('nwc', nwc);

        if (typeof window != 'undefined') {
          window.addEventListener('message', async (event) => {
            if (event.data?.type === 'nwc:success') {
              // const url= webLn.client.getNostrWalletConnectUrl(true);
              const webLn = new webln.NostrWebLNProvider({nostrWalletConnectUrl: pendingNwcUrl});
              await (window as any)?.webln.enable();
              // webLn.client.secret= nwc.client.secret;
              await webLn.enable();
              setNostrWebLN(webLn);
              setConnectionStatus('connected');
              setNwcAuthUrl(pendingNwcUrl.toString());

              await handleConnectWithUrl(pendingNwcUrl);
              setNwcUrlStore(nwcUrl);
              setNwcUrl(nwcUrl);
              setNwcUrl(pendingNwcUrl);
              return webLn;
            }
          });
        }
      }
      setIsLoading(false);
    } catch (e) {
      console.log('Error connectWithAlby', e);
    }
  }

  const handleConnectWithUrl = async (nwcUrl: string) => {
    try {
      if (nwcUrl) {
        const nwc = new webln.NostrWebLNProvider({
          nostrWalletConnectUrl: nwcUrl,
        });
        await nwc.enable();
        setNostrWebLN(nwc);

        setNwcUrl(nwcUrl);

        mutateConnectNDK(nwcUrl, {
          onSuccess: () => {},
        });
      }
    } catch (e) {
      console.log('handleConnectWithUrl', e);
    }
  };

  const generateInvoice = async (invoiceAmount?: string) => {
    if (!nostrWebLN || !invoiceAmount) return;
    try {
      setIsLoading(true);
      // const invoice = await nostrWebLN.makeInvoice({
      //   amount: parseInt(invoiceAmount, 10),
      //   defaultMemo: invoiceMemo,
      // });

      const invoice = await nostrWebLN?.makeInvoice({
        amount: parseInt(invoiceAmount, 10),
        // amount: parseInt(invoiceAmount),
        defaultMemo: invoiceMemo,
      });
      setGeneratedInvoice(invoice.paymentRequest);
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  async function getInvoiceFromLnAddress(lnAddress: string, satoshiAmount: number) {
    try {
      const ln = new LightningAddress(lnAddress);

      await ln.fetch();
      // request an invoice for X satoshis
      // this returns a new `Invoice` class that can also be used to validate the payment
      const invoice = await ln.requestInvoice({satoshi: satoshiAmount});

      console.log(invoice.paymentRequest); // print the payment request
      console.log(invoice.paymentHash); // print the payment hash

      return invoice;
    } catch (e) {
      console.log('Error getInvoiceFromLnAddress', e);
    }
  }

  async function verifyPayment(invoice: Invoice) {
    try {
      // if the LNURL providers supports LNURL-verify:
      const paidVerify = await invoice.verifyPayment(); // returns true of false
      if (paidVerify) {
        console.log(invoice.preimage);
      }

      // if you have the preimage for example in a WebLN context
      const response = await nostrWebLN.sendPayment(invoice.paymentRequest);
      const paid = invoice.validatePreimage(response.preimage); // returns true or false
      if (paid) {
        console.log('paid');
      }

      // or use the convenenice method:
      await invoice.isPaid();
    } catch (e) {
      console.log('verifyPayment', e);
    }
  }

  async function generateZap() {
    // const ln = new LightningAddress("hello@getalby.com");
    // await ln.fetch();
    // const zapArgs = {
    //     satoshi: 1000,
    //     comment: "Awesome post",
    //     relays: ["wss://relay.damus.io"],
    //     e: "44e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
    // };
    // const response = await ln.zap(zapArgs, { nostr: nostrProvider }); // generates a zap invoice
    // console.log("Preimage", response.preimage); // print the preimage
  }

  return {
    nostrWebLN,
    connectionStatus,
    balance,
    nwcUrl,
    nwcAuthUrl,
    generatedInvoice,
    invoiceAmount,
    setInvoiceAmount,
    invoiceMemo,
    setInvoiceMemo,
    preimage,
    handleConnectWithUrl,
    handleZap,
    payInvoice,
    connectWithAlby,
    generateInvoice,
    fetchData,
    setNwcUrl,
    setNwcAuthUrl,
    setNostrWebLN,
    setBalance,
    setConnectionStatus,
    connectionData,
    setConnectionData,
    isExtensionAvailable,
    setIsExtensionAvailable,
    getInvoiceFromLnAddress,
    verifyPayment,
  };
};
