import '../../../applyGlobalPolyfills';

import {webln} from '@getalby/sdk';
import {useSendZap} from 'afk_nostr_sdk';
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

export const LightningNetworkWallet = () => {
  const styles = useStyles(stylesheet);
  const [nwcUrl, setNwcUrl] = useState('');
  const {showToast} = useToast();
  const [pendingNwcUrl, setPendingNwcUrl] = useState('');
  const [nwcAuthUrl, setNwcAuthUrl] = useState('');
  const [paymentRequest, setPaymentRequest] = useState('');
  const [preimage, setPreimage] = useState('');
  const [nostrWebLN, setNostrWebLN] = useState<webln.NostrWebLNProvider | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);
  const [balance, setBalance] = useState<number | undefined>();
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState('');
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const {mutate: mutateSendZap} = useSendZap();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webln) {
      setIsExtensionAvailable(true);
    }
  }, []);

  useEffect(() => {
    if (!nostrWebLN) return;

    const fetchData = async () => {
      try {
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

    fetchData();
  }, [nostrWebLN]);

  async function payInvoice() {
    try {
      if (!nostrWebLN) throw new Error('No WebLN provider');
      const result = await nostrWebLN.sendPayment(paymentRequest);
      setPreimage(result.preimage);
    } catch (error) {
      console.error(error);
    }
  }
  const generateInvoice = async () => {
    if (!nostrWebLN || !invoiceAmount) return;
    try {
      setIsLoading(true);
      const invoice = await nostrWebLN.makeInvoice({
        amount: parseInt(invoiceAmount, 10),
        defaultMemo: invoiceMemo,
      });
      setGeneratedInvoice(invoice.paymentRequest);
      setIsInvoiceModalVisible(false);
    } catch (error) {
      console.error('Error generating invoice:', error);
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
      const authUrl = nwc.client.getAuthorizationUrl({name: 'React Native NWC demo'});
      setPendingNwcUrl(nwc.client.getNostrWalletConnectUrl(true));
      setNwcAuthUrl(authUrl.toString());

      if (Platform.OS === 'web') {
        window.addEventListener('message', (event) => {
          if (event.data?.type === 'nwc:success') {
            setNwcAuthUrl('');
            setNwcUrl(pendingNwcUrl);
            setNostrWebLN(new webln.NostrWebLNProvider({nostrWalletConnectUrl: pendingNwcUrl}));
          }
        });
      }
    }
    setIsLoading(false);
  }

  const handleConnectWithUrl = () => {
    if (nwcUrl) {
      setNostrWebLN(new webln.NostrWebLNProvider({nostrWalletConnectUrl: nwcUrl}));
    }
  };

  const handleZap = async () => {
    if (!nostrWebLN || !zapAmount || !zapRecipient) return;
    //Implement zap user
    try {
      setIsLoading(true);
      // Here you would implement the actual zap functionality
      // This is a placeholder for the actual implementation
      console.log(`Zapping ${zapAmount} sats to ${zapRecipient}`);
      // Simulating a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsZapModalVisible(false);
    } catch (error) {
      console.error('Failed to zap:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
              {isExtensionAvailable ? (
                <Text style={styles.infoValue}>Alby extension detected!</Text>
              ) : (
                <>
                  <View style={styles.content}>
                    <TextInput
                      placeholder="Paste NWC URL"
                      value={nwcUrl}
                      onChangeText={setNwcUrl}
                      style={styles.input}
                    />
                  </View>
                  <TouchableOpacity style={styles.button} onPress={handleConnectWithUrl}>
                    <Text style={styles.buttonText}>Connect with URL</Text>
                  </TouchableOpacity>
                  <Text style={styles.orText}>or</Text>
                </>
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
            <WalletInfo
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
              isLoading={isLoading}
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
            <PayInfo
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

function WalletInfo({
  connectionData,
  balance,
  paymentRequest,
  preimage,
  payInvoice,
  handleCopyInvoice,
  setIsZapModalVisible,
  setIsInvoiceModalVisible,
  isLoading,
}: {
  connectionData: any;
  balance: any;
  paymentRequest: any;
  handleCopyInvoice: () => void;
  preimage: any;
  payInvoice: any;
  setIsZapModalVisible: any;
  setIsInvoiceModalVisible: any;
  isLoading: boolean;
}) {
  const styles = useStyles(stylesheet);

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }
  return (
    <View style={styles.walletcontainer}>
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Wallet Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Connected to:</Text>
          <Text style={styles.infoValue}>{connectionData?.node?.alias || 'Unknown'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Network:</Text>
          <Text style={styles.infoValue}>{connectionData?.node?.network || 'Unknown'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Balance:</Text>
          <Text style={styles.infoValue}>{balance ?? 'Loading...'} sats</Text>
        </View>
      </View>

      {paymentRequest ? (
        <View style={styles.paymentSection}>
          <View style={styles.paymentRequest}>
            <Text style={{...styles.paymentRequestLabel, fontWeight: 'bold'}}>
              Payment Request:
            </Text>

            <Pressable>
              <Text style={styles.paymentRequestValue} numberOfLines={1} ellipsizeMode="middle">
                {paymentRequest ?? 'Loading...'}
              </Text>
              <Text>
                <IconButton
                  onPress={handleCopyInvoice}
                  size={16}
                  icon="CopyIconStack"
                  color="primary"
                />
              </Text>
            </Pressable>
          </View>
          <Text style={styles.paymentStatus}>
            {preimage ? `PAID: ${preimage}` : 'Not paid yet'}
          </Text>
        </View>
      ) : (
        <Text></Text>
      )}
      <Pressable style={styles.button} onPress={() => setIsInvoiceModalVisible(true)}>
        <Text style={styles.buttonText}>Receive Payment</Text>
      </Pressable>

      <View style={{marginTop: 10, ...styles.zapSection}}>
        <Pressable style={styles.zapButton} onPress={() => setIsZapModalVisible(true)}>
          <Text style={styles.buttonText}>Zap a User</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PayInfo({
  setIsInvoiceModalVisible,
  setInvoiceAmount,
  setInvoiceMemo,
  invoiceAmount,
  invoiceMemo,
  isLoading,
  generateInvoice,
}: {
  setIsInvoiceModalVisible: any;
  invoiceMemo: string;
  setInvoiceMemo: any;
  setInvoiceAmount: any;
  invoiceAmount: string;
  isLoading?: boolean;
  generateInvoice: () => void;
}) {
  const styles = useStyles(stylesheet);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Receive Satoshi</Text>
        <View style={styles.content}>
          <TextInput
            placeholder="Amount (sats)"
            value={invoiceAmount}
            keyboardType="numeric"
            onChangeText={setInvoiceAmount}
            style={styles.input}
          />
        </View>
        <View style={styles.content}>
          <TextInput
            placeholder="Notes"
            value={invoiceMemo}
            onChangeText={setInvoiceMemo}
            style={styles.input}
          />
        </View>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabledButton]}
          onPress={generateInvoice}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Processing...' : 'Generate Invoice'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsInvoiceModalVisible(false)}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ZapUserView({
  isLoading,
  setIsZapModalVisible,
  setZapAmount,
  setZapRecipient,
  zapAmount,
  zapRecipient,
  handleZap,
}: {
  zapRecipient: any;
  setZapRecipient: React.Dispatch<SetStateAction<any>>;
  zapAmount: string;
  setZapAmount: React.Dispatch<SetStateAction<any>>;
  handleZap: () => void;
  setIsZapModalVisible: React.Dispatch<SetStateAction<any>>;
  isLoading: boolean;
}) {
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Zap a User</Text>
        <View style={styles.content}>
          <TextInput
            placeholder="Recipient (Nostr address)"
            value={zapRecipient}
            onChangeText={setZapRecipient}
            style={styles.input}
          />
        </View>
        <View style={styles.content}>
          <TextInput
            placeholder="Amount (sats)"
            value={zapAmount}
            onChangeText={setZapAmount}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabledButton]}
          onPress={handleZap}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Processing...' : 'Send Zap'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={() => setIsZapModalVisible(false)}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
