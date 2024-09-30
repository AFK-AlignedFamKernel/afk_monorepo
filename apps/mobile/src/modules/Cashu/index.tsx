import '../../../applyGlobalPolyfills';

import {MintQuoteResponse} from '@cashu/cashu-ts';
import {useCashu, useCashuStore} from 'afk_nostr_sdk';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import React, {SetStateAction, useEffect, useRef, useState} from 'react';
import {Platform, Pressable, SafeAreaView, ScrollView, TouchableOpacity, View} from 'react-native';
import {ActivityIndicator, Modal, Text, TextInput} from 'react-native';
import PolyfillCrypto from 'react-native-webview-crypto';

import {Button, IconButton, Modalize} from '../../components';
import TabSelector from '../../components/TabSelector';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import {useModal} from '../../hooks/modals/useModal';
import {SelectedTab, TABS_CASHU} from '../../types/tab';
import {retrieveAndDecryptCashuMnemonic, retrievePassword} from '../../utils/storage';
import {BalanceCashu} from './BalanceCashu';
import {HistoryTxCashu} from './HistoryTxCashu';
import {InvoicesListCashu} from './InvoicesListCashu';
import {MintListCashu} from './MintListCashu';
import {MnemonicCashu} from './MnemonicCashu';
import {ReceiveEcash} from './ReceiveEcash';
import {SendEcash} from './SendEcash';
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

export const CashuWalletView: React.FC = () => {
  return (
    <ScrollView>
      <PolyfillCrypto />
      <CashuView />
    </ScrollView>
  );
};

export const CashuView = () => {
  const {
    wallet,
    connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
    mint,
    mintUrl,
    setMintUrl,
    getMintInfo,
    setMintInfo,
  } = useCashu();

  const {setMnemonic} = useCashuStore();

  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();

  useEffect(() => {
    (async () => {
      const biometrySupported = Platform.OS !== 'web' && canUseBiometricAuthentication?.();

      if (biometrySupported) {
        const password = await retrievePassword();
        if (!password) return;
        const storeMnemonic = await retrieveAndDecryptCashuMnemonic(password);

        if (!storeMnemonic) {
          return;
        }
        if (storeMnemonic) setHasSeedCashu(true);

        const decoder = new TextDecoder();
        // const decryptedPrivateKey = decoder.decode(Buffer.from(storeMnemonic).toString("hex"));
        const decryptedPrivateKey = Buffer.from(storeMnemonic).toString('hex');
        setMnemonic(decryptedPrivateKey);

        if (isSeedCashuStorage) setHasSeedCashu(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!mintUrl) return;
      const info = await getMintInfo(mintUrl);
      setMintInfo(info);
    })();
  }, [mintUrl]);
  const styles = useStyles(stylesheet);
  // const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")
  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);
  const [hasSeedCashu, setHasSeedCashu] = useState(false);

  const {show} = useModal();

  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const {theme} = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();

  const {showDialog, hideDialog} = useDialog();
  const {showToast} = useToast();

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.CASHU_WALLET);

  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      // navigation.navigate(screen as any);
    }
  };

  const sendModalizeRef = useRef<Modalize>(null);

  const onOpenSendModal = () => {
    sendModalizeRef.current?.close();

    sendModalizeRef.current?.open();
    show(
      <>
        <SendEcash></SendEcash>
      </>,
    );
  };

  const onOpenReceiveModal = () => {
    sendModalizeRef.current?.close();

    sendModalizeRef.current?.open();
    show(
      <>
        <ReceiveEcash></ReceiveEcash>
      </>,
    );
  };
  const handleZap = async () => {
    if (!zapAmount || !zapRecipient) return;
    //Implement zap user
    try {
      setIsLoading(true);
      // Here you would implement the actual zap functionality
      // This is a placeholder for the actual implementation
      console.log(`Zapping ${zapAmount} sats to ${zapRecipient}`);
      // Simulating a delay
      setIsZapModalVisible(false);
    } catch (error) {
      console.error('Failed to zap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // const generateInvoice = async () => {
  //   if (!mintUrl || !invoiceAmount) return;
  //   try {

  //     // const cashuMint = await connectCashMint(mintUrl)
  //     // const wallet = await connectCashWallet(cashuMint?.mint)

  //     // const quote = await requestMintQuote(Number(invoiceAmount))
  //     // setQuote(quote?.request)
  //     console.log("quote", quote)
  //     setIsLoading(true);
  //     setIsInvoiceModalVisible(false);
  //   } catch (error) {
  //     console.error('Error generating invoice:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          {selectedTab == SelectedTab?.CASHU_WALLET && (
            <>{/* <GenerateInvoiceCashu></GenerateInvoiceCashu> */}</>
          )}
          <BalanceCashu></BalanceCashu>

          <View style={styles.tabSelector}>
            <Button onPress={onOpenSendModal}>Send</Button>

            <Button onPress={onOpenReceiveModal}>Receive</Button>
            {/* 
<Modalize ref={sendModalizeRef}>
  <Modal
  >
    <Text>LFG</Text>

  </Modal>


</Modalize> */}

            <Modal
              style={{zIndex: 10}}
              animationType="slide"
              transparent={true}
              visible={isZapModalVisible}
              onRequestClose={() => setIsZapModalVisible(false)}
            >
              {/* <ZapUserView
    isLoading={isLoading}
    setIsZapModalVisible={setIsZapModalVisible}
    setZapAmount={setZapAmount}
    setZapRecipient={setZapRecipient}
    zapAmount={zapAmount}
    zapRecipient={zapRecipient}
    handleZap={handleZap}
  /> */}
            </Modal>

            <Modal
              animationType="slide"
              transparent={true}
              visible={isInvoiceModalVisible}
              onRequestClose={() => setIsInvoiceModalVisible(false)}
              style={{zIndex: 10}}
            >
              {/* <PayInfo
    setInvoiceMemo={setInvoiceMemo}
    setInvoiceAmount={setInvoiceAmount}
    invoiceMemo={invoiceMemo}
    invoiceAmount={invoiceAmount}
    setIsInvoiceModalVisible={setIsInvoiceModalVisible}
    generateInvoice={generateInvoice}
    isLoading={isLoading}
  /> */}
            </Modal>
          </View>

          <TabSelector
            activeTab={selectedTab}
            handleActiveTab={handleTabSelected}
            buttons={TABS_CASHU}
            addScreenNavigation={false}
          ></TabSelector>

          {selectedTab == SelectedTab?.CASHU_INVOICES && (
            <View>
              <Text style={styles.text}>Invoices</Text>
              <InvoicesListCashu></InvoicesListCashu>
            </View>
          )}

          {selectedTab == SelectedTab?.CASHU_HISTORY && (
            <View>
              <Text>History</Text>
              <HistoryTxCashu></HistoryTxCashu>
            </View>
          )}

          {selectedTab == SelectedTab?.CASHU_MINT && (
            <View>
              <Text>Cashu mints</Text>
              <MintListCashu></MintListCashu>
            </View>
          )}

          {selectedTab == SelectedTab.CASHU_SETTINGS && (
            <View>
              <TouchableOpacity
                onPress={() => {
                  connectCashWallet(mint);
                }}
              >
                Connect Cashu
              </TouchableOpacity>

              <MnemonicCashu></MnemonicCashu>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
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
