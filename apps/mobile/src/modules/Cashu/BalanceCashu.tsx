import '../../../applyGlobalPolyfills';

import { webln } from '@getalby/sdk';
import { useAuth, useCashu, useNostrContext, useSendZap } from 'afk_nostr_sdk';
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
import { CashuMint, MintQuoteResponse } from '@cashu/cashu-ts';
import { CopyIconStack } from '../../assets/icons';
import { canUseBiometricAuthentication } from 'expo-secure-store';
import { retrieveAndDecryptCashuMnemonic, retrievePassword, storeCashuMnemonic } from '../../utils/storage';
import { SelectedTab, TABS_CASHU } from '../../types/tab';


export const BalanceCashu = () => {

  const { wallet, connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,

  } = useCashu()
  const { ndkCashuWallet, ndkWallet } = useNostrContext()

  const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")
  const [mint, setMint] = useState<CashuMint | undefined>(mintUrl ? new CashuMint(mintUrl) : undefined)

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

    (async () => {

      console.log("ndkCashuWallet", ndkCashuWallet)
      console.log("ndkWallet", ndkWallet)


      const availableTokens = await ndkCashuWallet?.availableTokens;
      console.log("availableTokens", availableTokens)

      const mintBalances = await ndkCashuWallet?.mintBalances;
      console.log("mintBalances", mintBalances)

      console.log("mintBalances", mintBalances)
      const wallets = await ndkWallet?.wallets;
      console.log("wallets", wallets)

      const balance = await ndkCashuWallet?.balance;

      console.log("balance", balance)

      if (mint) {
        const mintBalance = await ndkCashuWallet?.mintBalance(mint?.mintUrl);
        console.log("mintBalance", mintBalance)

      }




    })();
  }, []);


  const styles = useStyles(stylesheet);


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



        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
