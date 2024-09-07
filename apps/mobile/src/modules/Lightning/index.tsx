import '../../../applyGlobalPolyfills';

import { webln } from '@getalby/sdk';
import { useAuth, useConnectNWC, useLN, useNostrContext, useSendZap } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, { SetStateAction, useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Modal, Text, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import { Button, IconButton } from '../../components';
import { useStyles } from '../../hooks';
import { useToast } from '../../hooks/modals';
import stylesheet from './styles';
import { SendPaymentResponse } from '@webbtc/webln-types';
import { ZapUserView } from './ZapUserView';
import { LNWalletInfo } from './LNWalletInfo';
import { LNPayInfo } from './LNPayInfo';

// Get Lighting Address:
// const lightningAddress = new LightningAddress('hello@getalby.com');
// await lightningAddress.fetch();
// const invoice = await lightningAddress.requestInvoice({
//           satoshi: 1,
//  });
// setPaymentRequest(invoice.paymentRequest);
// } catch (error) {
// console.error(error);
//  }
//  })();

export const LightningNetworkWalletView: React.FC = () => {
  return (
    <ScrollView>
      <PolyfillCrypto />
      <LightningNetworkWallet />
    </ScrollView>
  );
};

export enum ZAPType {
  INVOICE,
  NOSTR
}

export const LightningNetworkWallet = () => {
  const { publicKey } = useAuth()
  // const [nostrWebLN, setNostrWebLN] = useState<webln.NostrWebLNProvider | undefined>(undefined);
  // const [nwcUrl, setNwcUrl] = useState('');
  // const [balance, setBalance] = useState<number | undefined>();
  // const [generatedInvoice, setGeneratedInvoice] = useState('');
  // const [nwcAuthUrl, setNwcAuthUrl] = useState('');

  const styles = useStyles(stylesheet);
  const { showToast } = useToast();
  const [pendingNwcUrl, setPendingNwcUrl] = useState('');
  const [paymentRequest, setPaymentRequest] = useState('');
  const [resultPayment, setResultPayment] = useState<SendPaymentResponse | undefined>();
  // const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);

  // const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState<string | undefined>();
  const [nostrLnRecipient, setNostrLnRecipient] = useState<string | undefined>();
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  // const [invoiceAmount, setInvoiceAmount] = useState('');
  // const [invoiceMemo, setInvoiceMemo] = useState(publicKey);
  const { mutate: mutateSendZap } = useSendZap();
  const { mutate: mutateConnectNDK } = useConnectNWC();

  const { ndk } = useNostrContext()
  const {
    nostrWebLN,
    balance,
    invoiceAmount,
    setInvoiceAmount,
    invoiceMemo,
    setInvoiceMemo,
    preimage,
    nwcUrl,
    nwcAuthUrl,
    generatedInvoice,
    handleConnectWithUrl,
    payInvoice,
    handleZap,
    connectWithAlby,
    generateInvoice,
    connectionStatus,
    fetchData,
    setNwcUrl,
    setNwcAuthUrl,
    setNostrWebLN,
    setBalance,
    setConnectionStatus,
    isExtensionAvailable,
    setIsExtensionAvailable
  
  } = useLN()

  // console.log("nwcUrl", nwcUrl)
  // console.log("nostrWebLN", nostrWebLN)
  // console.log("balance", balance)
  const [zapType, setZapType] = useState<ZAPType>(ZAPType.INVOICE)

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webln) {
      setIsExtensionAvailable(true);
    }
  }, []);

  const handleCopyInvoice = async () => {
    await Clipboard.setStringAsync(generatedInvoice);
    showToast({ type: 'info', title: 'Invoice copied to the clipboard' });
  };


  // const handleGenerateNWCUrl = async () => {
  //   const nwc = webln.NostrWebLNProvider.withNewSecret();

  //   await nwc.initNWC({
  //     name: "<Your service name here>",
  //   });
  //   const url = nwc.getNostrWalletConnectUrl(true);

  //   console.log("nwc", nwc)
  // }


  // useEffect(() => {
  //   if (!nostrWebLN) return;

  //   const fetchData = async () => {
  //     try {
  //       setIsLoading(true);
  //       await nostrWebLN.enable();
  //       const response = await nostrWebLN.getBalance();
  //       setBalance(response.balance);
  //       setConnectionStatus('connected');

  //       const info = await nostrWebLN.getInfo();
  //       setConnectionData(info);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, [nostrWebLN]);

  // async function payInvoice(): Promise<SendPaymentResponse | undefined> {
  //   try {
  //     if (!nostrWebLN) {
  //       showToast({ title: "No WebLN provider", type: "error" })
  //       return undefined
  //     };


  //     if (zapRecipient) {

  //       const isValid = validateInvoice(zapRecipient)

  //       if (!isValid) {
  //         showToast({ title: "Invoice is not valid", type: "error" })
  //       }
  //       // const result = await nostrWebLN.sendPayment(paymentRequest);
  //       const result = await nostrWebLN.sendPayment(zapRecipient);

  //       if (result) {
  //         console.log("result", result);
  //         setPreimage(result.preimage);
  //         setResultPayment(result)
  //         showToast({ title: "Zap payment success", type: "success" })
  //         return result;
  //       }

  //     }

  //     return undefined;
  //   } catch (error) {
  //     console.error(error);
  //     return undefined;
  //   }
  // }
  // function validateInvoice(invoice: string): boolean {
  //   // A basic check to see if the invoice is too short or doesn't start with 'ln'
  //   return invoice.length > 50 && invoice.startsWith('ln');
  // }

  // const generateInvoice = async () => {
  //   if (!nostrWebLN || !invoiceAmount) return;
  //   try {
  //     setIsLoading(true);
  //     // const invoice = await nostrWebLN.makeInvoice({
  //     //   amount: parseInt(invoiceAmount, 10),
  //     //   defaultMemo: invoiceMemo,
  //     // });
  //     const invoice = await nostrWebLN.makeInvoice({
  //       amount: parseInt(invoiceAmount, 10),
  //       // amount: parseInt(invoiceAmount),
  //       defaultMemo: invoiceMemo,
  //     });
  //     setGeneratedInvoice(invoice.paymentRequest);
  //     setIsInvoiceModalVisible(false);
  //   } catch (error) {
  //     console.error('Error generating invoice:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // async function connectWithAlby() {
  //   setConnectionStatus('connecting');
  //   setIsLoading(true);
  //   if (isExtensionAvailable) {
  //     try {
  //       await (window as any)?.webln.enable();
  //       setNostrWebLN((window as any)?.webln);
  //     } catch (error) {
  //       console.error('Failed to connect to Alby extension:', error);
  //     }
  //   } else {
  //     const nwc = webln.NostrWebLNProvider.withNewSecret({});
  //     const authUrl = nwc.client.getAuthorizationUrl({ name: 'React Native NWC demo' });
  //     setPendingNwcUrl(nwc.client.getNostrWalletConnectUrl(true));
  //     setNwcAuthUrl(authUrl.toString());

  //     if (Platform.OS === 'web') {
  //       window.addEventListener('message', (event) => {
  //         if (event.data?.type === 'nwc:success') {
  //           setNwcAuthUrl('');
  //           setNwcUrl(pendingNwcUrl);
  //           setNostrWebLN(new webln.NostrWebLNProvider({ nostrWalletConnectUrl: pendingNwcUrl }));
  //         }
  //       });
  //     }
  //   }
  //   setIsLoading(false);
  // }

  // const handleConnectWithUrl = async () => {
  //   if (nwcUrl) {
  //     const nwc = new webln.NostrWebLNProvider({
  //       nostrWalletConnectUrl: nwcUrl,
  //     });
  //     await nwc.enable();
  //     setNostrWebLN(nwc);

  //     mutateConnectNDK(nwcUrl, {
  //       onSuccess: () => {

  //       }
  //     })
  //   }
  // };

  // const handleZap = async () => {
  //   if (!nostrWebLN || !zapAmount || !zapRecipient) return;
  //   //Implement zap user
  //   try {
  //     setIsLoading(true);
  //     // Here you would implement the actual zap functionality
  //     // This is a placeholder for the actual implementation
  //     console.log(`Zapping ${zapAmount} sats to ${zapRecipient}`);

  //     const result = await payInvoice(zapRecipient)
  //     console.log("result invoice pay", result)

  //     // Simulating a delay
  //     // await new Promise((resolve) => setTimeout(resolve, 2000));
  //     // setIsZapModalVisible(false);
  //   } catch (error) {
  //     console.error('Failed to zap:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const renderAuthView = () => {
    if (Platform.OS === 'web') {
      return (
        <Button
          style={styles.button}
          onPress={() => window.open(nwcAuthUrl, '_blank', 'width=600,height=400')}
        >
          <Text style={styles.buttonText}>Authorize with Alby</Text>
        </Button>
      );
    } else if (WebView) {
      return (
        <WebView
          source={{ uri: nwcAuthUrl }}
          injectedJavaScriptBeforeContentLoaded={`
            window.opener = window;
            window.addEventListener("message", (event) => {
              window.ReactNativeWebView.postMessage(event.data?.type);
            });
          `}
          onMessage={(event) => {
            if (event.nativeEvent.data === 'nwc:success') {
              setNwcAuthUrl('');
              setNwcUrl(pendingNwcUrl);
            }
          }}
        />
      );
    }
    return null;
  };

  if (nwcAuthUrl) {
    return renderAuthView();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.container}>
          {connectionStatus !== 'connected' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Connect to Lightning Wallet</Text>
              <>
                <View style={styles.content}>
                  <TextInput
                    placeholder="Paste NWC URL"
                    value={nwcUrl}
                    onChangeText={setNwcUrl}
                    style={styles.input}
                  />
                </View>
                <TouchableOpacity style={styles.button} onPress={() => handleConnectWithUrl(nwcUrl)}>
                {/* <TouchableOpacity style={styles.button} onPress={handleConnectWithUrl}> */}
                  <Text style={styles.buttonText}>Connect with URL</Text>
                </TouchableOpacity>
                <Text style={styles.orText}>or</Text>
              </>
              {isExtensionAvailable && (
                <Text style={styles.infoValue}>Alby extension detected!</Text>
              )}
              <Button
                style={[styles.button, isLoading && styles.disabledButton]}
                onPress={connectWithAlby}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading
                    ? 'Connecting...'
                    : isExtensionAvailable
                      ? 'Connect with Alby Extension'
                      : 'Connect with Alby NWC'}
                </Text>
              </Button>
            </View>
          ) : (
            <LNWalletInfo
              setIsInvoiceModalVisible={setIsInvoiceModalVisible}
              balance={balance}
              connectionData={connectionData}
              payInvoice={payInvoice}
              handleCopyInvoice={handleCopyInvoice}
              paymentRequest={generatedInvoice}
              preimage={preimage}
              setIsZapModalVisible={setIsZapModalVisible}
              isLoading={isLoading}
            />
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={isZapModalVisible}
            onRequestClose={() => setIsZapModalVisible(false)}
          >
            <ZapUserView

              zapType={zapType}
              setZapType={setZapType}
              isLoading={isLoading}
              setNostrLnRecipient={setNostrLnRecipient}
              nostrLnRecipient={nostrLnRecipient}
              setIsZapModalVisible={setIsZapModalVisible}
              setZapAmount={setZapAmount}
              setZapRecipient={setZapRecipient}
              zapAmount={zapAmount}
              zapRecipient={zapRecipient}
              handleZap={handleZap}
            />
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isInvoiceModalVisible}
            onRequestClose={() => setIsInvoiceModalVisible(false)}
          >
            <LNPayInfo
              setInvoiceMemo={setInvoiceMemo}
              setInvoiceAmount={setInvoiceAmount}
              invoiceMemo={invoiceMemo}
              invoiceAmount={invoiceAmount}
              setIsInvoiceModalVisible={setIsInvoiceModalVisible}
              generateInvoice={generateInvoice}
              isLoading={isLoading}
            />
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
