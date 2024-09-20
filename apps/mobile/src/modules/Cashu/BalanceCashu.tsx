import '../../../applyGlobalPolyfills';

import { webln } from '@getalby/sdk';
import { useAuth, useCashu, useCashuStore, useNostrContext, useSendZap } from 'afk_nostr_sdk';
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
import { useGetCashuWalletsInfo } from 'afk_nostr_sdk/src/hooks/cashu';


export const BalanceCashu = () => {

  const { wallet,
    connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
    mintUrl, setMintUrl

  } = useCashu()
  const { ndkCashuWallet, ndkWallet } = useNostrContext()



  // const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")
  const [mint, setMint] = useState<CashuMint | undefined>(mintUrl ? new CashuMint(mintUrl) : undefined)

  const { isSeedCashuStorage, setIsSeedCashuStorage } = useCashuStore()
  const cashuWallets = useGetCashuWalletsInfo()
  console.log("cashuWallets", cashuWallets)
  const lenWallet = cashuWallets?.data?.pages?.length ?? 0;
  console.log("lenWallet", lenWallet)


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

  const { theme } = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>()

  const { showDialog, hideDialog } = useDialog()

  const { showToast } = useToast()



  const handleGenerateWallet = async () => {
    const wallet = await ndkWallet?.createCashuWallet()

    console.log('wallet', wallet)


  }

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




  return (
    // <SafeAreaView style={styles.safeArea}>
      <View
      // contentContainerStyle={styles.scrollView}
      >

        <View style={styles.container}>

          <View>
            <Text>Connect to</Text>

          </View>
          <View style={styles.content}>
            <TextInput
              placeholder="Mint URL"
              value={mintUrl}
              onChangeText={setMintUrl}
              style={styles.input}
            />

          </View>

          {/* 
          <View>
            <Text>You have {lenWallet} ecash wallets</Text>
            <Button 
            onPress={() => {
              // handleGenerateWallet()
            }}
            >Generate wallet</Button> 
          </View>
        */}
        </View>
      </View>
    // </SafeAreaView>
  );
};
