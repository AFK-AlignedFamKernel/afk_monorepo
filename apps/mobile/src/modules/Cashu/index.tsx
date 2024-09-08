import '../../../applyGlobalPolyfills';

import { webln } from '@getalby/sdk';
import { useAuth, useCashu, useSendZap } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, { SetStateAction, useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Modal, Text, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import { Button, IconButton, Input } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import { useDialog, useToast } from '../../hooks/modals';
import stylesheet from './styles';
import { MintQuoteResponse } from '@cashu/cashu-ts';
import { CopyIconStack } from '../../assets/icons';
import { canUseBiometricAuthentication } from 'expo-secure-store';
import { retrieveAndDecryptCashuMnemonic, retrievePassword, storeCashuMnemonic } from '../../utils/storage';
import TabSelector from '../../components/TabSelector';
import { SelectedTab, TABS_CASHU } from '../../types/tab';

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

  const { wallet, connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,



  } = useCashu()


  const { isSeedCashuStorage, setIsSeedCashuStorage } = useAuth()

  useEffect(() => {
    (async () => {
      const biometrySupported = Platform.OS !== 'web' && canUseBiometricAuthentication?.();

      if (biometrySupported) {
        const password = await retrievePassword()
        if (!password) return;
        const storeSeed = await retrieveAndDecryptCashuMnemonic(password);

        if (storeSeed) setHasSeedCashu(true)

        if (isSeedCashuStorage) setHasSeedCashu(true)
      }
    })();
  }, []);


  const styles = useStyles(stylesheet);
  const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")


  const [quote, setQuote] = useState<MintQuoteResponse | undefined>()
  const [mintsUrls, setMintUrls] = useState<string[]>(["https://mint.minibits.cash/Bitcoin"])
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);
  const [hasSeedCashu, setHasSeedCashu] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState('');

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);

  const [generatedInvoice, setGeneratedInvoice] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const { theme } = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>()

  const { showDialog, hideDialog } = useDialog()

  const { showToast } = useToast()

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.LIGHTNING_NETWORK_WALLET);

  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      // navigation.navigate(screen as any);
    }
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

  const generateInvoice = async () => {
    if (!mintUrl || !invoiceAmount) return;
    try {


      const cashuMint = await connectCashMint(mintUrl)
      const wallet = await connectCashWallet(cashuMint)

      const quote = await requestMintQuote(Number(invoiceAmount))
      setQuote(quote?.request)
      console.log("quote", quote)
      setIsLoading(true);
      setIsInvoiceModalVisible(false);
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (type: 'lnbc' | "seed") => {

    if (!quote?.request) return;
    if (type == "lnbc") {
      await Clipboard.setStringAsync(type === 'lnbc' ? quote?.request?.toString() : quote?.request?.toString());

    } else if (type == "seed") {
      if (newSeed) {
        await Clipboard.setStringAsync(newSeed);
      }

    }
    showToast({ type: 'info', title: 'Copied to clipboard' });
  };


  const handleGenerateAndSavedMnemonic = async () => {


    const password = await retrievePassword()
    console.log("password", password)

    if (!password) return;

    const storeSeed = await retrieveAndDecryptCashuMnemonic(password);
    console.log("storeSeed", storeSeed)

    if (storeSeed) {
      showDialog({
        title: 'Generate a new Cashu Seed',
        description: 'Take care. You already have a Cashu Seed integrated. Please saved before generate another',
        buttons: [
          {
            type: 'primary',
            label: 'Yes',
            onPress: async () => {
              const mnemonic = await generateMnemonic()
              console.log("mnemonic", mnemonic)


              const seedSaved = await storeCashuMnemonic(mnemonic, password)
              console.log("seedSaved", seedSaved)

              setNewSeed(seedSaved)
              setIsSeedCashuStorage(true)
              setHasSeedCashu(true)
              showToast({ title: "Seed generate for Cashu Wallet", type: "success" })
              hideDialog();
            },
          },
          {
            type: 'default',
            label: 'No',
            onPress: hideDialog,
          },
        ],
      });
    }




  }



  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>


        <TabSelector
          activeTab={selectedTab}
          handleActiveTab={handleTabSelected}
          buttons={TABS_CASHU}
          addScreenNavigation={false}
        ></TabSelector>


        {selectedTab == SelectedTab?.CASHU_HISTORY &&
          <View>
            <Text>History</Text>

          </View>
        }


        {selectedTab == SelectedTab?.CASHU_INVOICES &&
          <View>
            <Text>Invoices</Text>

          </View>
        }


        {selectedTab == SelectedTab?.CASHU_MINT &&
          <View>
            <Text>Cashu mints</Text>

          </View>
        }



        {!hasSeedCashu &&

          <View
            style={styles.container}
          >

            <Text>You don't have a Cashu Seed setup to secure your wallet</Text>
            <Button
              onPress={handleGenerateAndSavedMnemonic}

            >Generate seed</Button>



          </View>
        }

        {hasSeedCashu &&


          <Input
            value={newSeed}
            editable={false}
            right={
              <TouchableOpacity
                onPress={() => handleCopy('seed')}
                style={{
                  marginRight: 10,
                }}
              >
                <CopyIconStack color={theme.colors.primary} />
              </TouchableOpacity>
            }
          />

        }
        <View style={styles.container}>


          <View style={styles.content}>
            <TextInput
              placeholder="Mint URL"
              value={mintUrl}
              onChangeText={setMintUrl}
              style={styles.input}
            />

          </View>

          <View>

          </View>

          <TextInput
            placeholder="Amount"
            keyboardType="numeric"
            value={invoiceAmount}
            onChangeText={setInvoiceAmount}
            style={styles.input}
          />


          <Button
            onPress={generateInvoice}
          >

            Generate invoice

          </Button>

          {quote?.request &&

            <View
              style={{
                marginVertical: 3
              }}
            >

              <Text style={styles.content}>Invoice address</Text>

              <Input
                value={quote?.request}
                editable={false}
                right={
                  <TouchableOpacity
                    onPress={() => handleCopy('lnbc')}
                    style={{
                      marginRight: 10,
                    }}
                  >
                    <CopyIconStack color={theme.colors.primary} />
                  </TouchableOpacity>
                }
              />
            </View>

          }



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
            <Text style={{ ...styles.paymentRequestLabel, fontWeight: 'bold' }}>
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

      <View style={{ marginTop: 10, ...styles.zapSection }}>
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
