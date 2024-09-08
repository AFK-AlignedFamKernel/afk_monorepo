import { useEffect, useState } from "react";
import { webln } from '@getalby/sdk';
import { SendPaymentResponse } from "@webbtc/webln-types";
import { useConnectNWC } from "../zap/useZap";
import { useAuth } from "../../store";

export const useLN =  () => {

    const { publicKey, setNWCUrl, nwcUrl:nwlUrlProps} = useAuth()
    const [nwcUrl, setNwcUrl] = useState(nwlUrlProps);
    const [pendingNwcUrl, setPendingNwcUrl] = useState('');
    const [nwcAuthUrl, setNwcAuthUrl] = useState('');
    const [paymentRequest, setPaymentRequest] = useState('');
    const [preimage, setPreimage] = useState('');
    const [nostrWebLN, setNostrWebLN] = useState<webln.NostrWebLNProvider | undefined>(undefined);
    const [zapAmount, setZapAmount] = useState('');
    const [zapRecipient, setZapRecipient] = useState<string | undefined>();
    const [nostrLnRecipient, setNostrLnRecipient] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
    const [balance, setBalance] = useState<number | undefined>();
    const [connectionData, setConnectionData] = useState<any>(null);
    const { mutate: mutateConnectNDK } = useConnectNWC();
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [invoiceMemo, setInvoiceMemo] = useState(publicKey);
    const [generatedInvoice, setGeneratedInvoice] = useState('');
    const [resultPayment, setResultPayment] = useState<SendPaymentResponse | undefined>();

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
    async function payInvoice(zapRecipient:string): Promise<SendPaymentResponse | undefined> {
        try {
            if (!nostrWebLN) {
                return undefined
            };


            if (zapRecipient) {

                const isValid = validateInvoice(zapRecipient)

                if (!isValid) {
                }
                // const result = await nostrWebLN.sendPayment(paymentRequest);
                const result = await nostrWebLN.sendPayment(zapRecipient);

                if (result) {
                    console.log("result", result);
                    setPreimage(result.preimage);
                    setResultPayment(result)
                    return result;
                }

            }

            return undefined;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    const handleZap = async (zapAmount:string, zapRecipient:string) => {
        if (!nostrWebLN || !zapAmount || !zapRecipient) return;
        //Implement zap user
        try {
            setIsLoading(true);
            // Here you would implement the actual zap functionality
            // This is a placeholder for the actual implementation
            console.log(`Zapping ${zapAmount} sats to ${zapRecipient}`);

            const result = await payInvoice(zapRecipient)
            console.log("result invoice pay", result)

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
        setConnectionStatus('connecting');
        setIsLoading(true);
        if (isExtensionAvailable) {
            try {
                await (window as any)?.webln.enable();
                setNostrWebLN((window as any)?.webln);
            } catch (error) {
                console.error('Failed to connect to Alby extension:', error);
            }
        } else {
            const nwc = webln.NostrWebLNProvider.withNewSecret({});
            const authUrl = nwc.client.getAuthorizationUrl({ name: 'React Native NWC demo' });
            setPendingNwcUrl(nwc.client.getNostrWalletConnectUrl(true));
            setNwcAuthUrl(authUrl.toString());

            if (typeof window != "undefined") {
                window.addEventListener('message', (event) => {
                    if (event.data?.type === 'nwc:success') {
                        setNwcAuthUrl('');
                        setNwcUrl(pendingNwcUrl);
                        setNostrWebLN(new webln.NostrWebLNProvider({ nostrWalletConnectUrl: pendingNwcUrl }));
                    }
                });
            }
        }
        setIsLoading(false);
    }

    const handleConnectWithUrl = async (nwcUrl:string) => {
        if (nwcUrl) {
            const nwc = new webln.NostrWebLNProvider({
                nostrWalletConnectUrl: nwcUrl,
            });
            await nwc.enable();
            setNostrWebLN(nwc);

            setNWCUrl(nwcUrl);

            mutateConnectNDK(nwcUrl, {
                onSuccess: () => {

                }
            })
        }
    };


    const generateInvoice = async (invoiceAmount?:string) => {
        if (!nostrWebLN || !invoiceAmount) return;
        try {
            setIsLoading(true);
            // const invoice = await nostrWebLN.makeInvoice({
            //   amount: parseInt(invoiceAmount, 10),
            //   defaultMemo: invoiceMemo,
            // });
            const invoice = await nostrWebLN.makeInvoice({
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
        setConnectionData,
        isExtensionAvailable,
        setIsExtensionAvailable




    }

}