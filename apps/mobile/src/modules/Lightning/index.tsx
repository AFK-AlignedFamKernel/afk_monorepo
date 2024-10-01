import '../../../applyGlobalPolyfills';

import {webln} from '@getalby/sdk';
import {useAuth, useConnectNWC, useLN, useNostrContext, useSendZap} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {SetStateAction, useEffect, useState} from 'react';
import {Platform, Pressable, SafeAreaView, ScrollView, TouchableOpacity, View} from 'react-native';
import {ActivityIndicator, Modal, Text, TextInput} from 'react-native';
import {WebView} from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import {Button, IconButton} from '../../components';
import {useStyles} from '../../hooks';
import {useToast} from '../../hooks/modals';
import stylesheet from './styles';
import {SendPaymentResponse} from '@webbtc/webln-types';
import {ZapUserView} from './ZapUserView';
import {LNWalletInfo} from './LNWalletInfo';
import {LNPayInfo} from './LNPayInfo';

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
  NOSTR,
}

export const LightningNetworkWallet = () => {
  const {publicKey} = useAuth();
  const styles = useStyles(stylesheet);
  const {showToast} = useToast();
  const [pendingNwcUrl, setPendingNwcUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState<string | undefined>();
  const [nostrLnRecipient, setNostrLnRecipient] = useState<string | undefined>();
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isViewNewConnection, setIsViewNewConnection] = useState(true);

  const {ndk} = useNostrContext();
  const {
    nostrWebLN,
    balance,
    invoiceAmount,
    setInvoiceAmount,
    invoiceMemo,
    setInvoiceMemo,
    preimage,
    connectionData,
    setConnectionData,
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
    setIsExtensionAvailable,
  } = useLN();

  async function connectWithAlbyPlatform() {
    setConnectionStatus('connecting');
    setIsLoading(true);
    if (isExtensionAvailable) {
      try {
        await (window as any)?.webln.enable();
        setNostrWebLN((window as any)?.webln);
        return (window as any)?.webln;
      } catch (error) {
        console.error('Failed to connect to Alby extension:', error);
      }
    } else {
      const nwc = webln.NostrWebLNProvider.withNewSecret({});
      const authUrl = nwc.client.getAuthorizationUrl({name: 'React Native NWC demo'});
      setPendingNwcUrl(nwc.client.getNostrWalletConnectUrl(true));
      setNwcAuthUrl(authUrl.toString());

      if (Platform.OS === 'web') {
        window.addEventListener('message', (event) => {
          if (event.data?.type === 'nwc:success') {
            setNwcAuthUrl('');
            setNwcUrl(pendingNwcUrl);

            const webLn = new webln.NostrWebLNProvider({nostrWalletConnectUrl: pendingNwcUrl});
            setNostrWebLN(webLn);
            return (window as any)?.webln;
          }
        });
      }
    }
    setIsLoading(false);
  }

  const handleConnectGetAlby = async () => {
    // const webLn = await connectWithAlbyPlatform()
    const webLn = await connectWithAlby();

    if (webLn) {
      showToast({title: 'WebLN Connected to ZAP with BTC', type: 'success'});
    }
  };

  const [zapType, setZapType] = useState<ZAPType>(ZAPType.INVOICE);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webln) {
      setIsExtensionAvailable(true);
    }
  }, []);

  const handleCopyInvoice = async () => {
    await Clipboard.setStringAsync(generatedInvoice);
    showToast({type: 'info', title: 'Invoice copied to the clipboard'});
  };

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
          source={{uri: nwcAuthUrl}}
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

  // if (nwcAuthUrl) {
  //   return renderAuthView();
  // }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.container}>
          {nwcAuthUrl && renderAuthView()}

          {connectionStatus === 'connected' && (
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

          {/* <TouchableOpacity style={styles.button} onPress={() => {
            setIsViewNewConnection(!isViewNewConnection)
          }
          }>
            <Text style={styles.buttonText}>New connection NWC</Text>
          </TouchableOpacity> */}

          {isViewNewConnection && (
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
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    if (nwcUrl) {
                      handleConnectWithUrl(nwcUrl);
                    }
                  }}
                >
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
                onPress={handleConnectGetAlby}
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
              generatedInvoice={generatedInvoice}
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
              invoiceGenerated={generatedInvoice}
            />
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
