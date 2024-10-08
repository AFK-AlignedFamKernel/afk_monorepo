import '../../../applyGlobalPolyfills';

import {webln} from '@getalby/sdk';
import {
  addProofsSpent,
  getProofs,
  useAuth,
  useCashu,
  useCashuStore,
  useNostrContext,
  useSendZap,
} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {SetStateAction, useEffect, useState} from 'react';
import {Platform, Pressable, SafeAreaView, ScrollView, TouchableOpacity, View} from 'react-native';
import {ActivityIndicator, Modal, Text, TextInput} from 'react-native';
import {WebView} from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import {Button, IconButton, Input} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import stylesheet from './styles';
import {CashuMint, MintQuoteResponse, Proof} from '@cashu/cashu-ts';
import {CopyIconStack} from '../../assets/icons';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import {
  retrieveAndDecryptCashuMnemonic,
  retrievePassword,
  storeCashuMnemonic,
} from '../../utils/storage';
import {SelectedTab, TABS_CASHU} from '../../types/tab';
import {useCashuBalance, useGetCashuWalletsInfo} from 'afk_nostr_sdk/src/hooks/cashu';
import {useCashuContext} from '../../providers/CashuProvider';

export const BalanceCashu = () => {
  const {
    wallet,
    connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
    activeMintIndex,
    mintUrls,
  } = useCashuContext()!;

  const {ndkCashuWallet, ndkWallet} = useNostrContext();

  const {balance, setBalance, getProofsWalletAndBalance} = useCashuBalance();

  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();
  const styles = useStyles(stylesheet);
  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [hasSeedCashu, setHasSeedCashu] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const {theme} = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();
  const {showToast} = useToast();

  useEffect(() => {
    (async () => {
      const biometrySupported = Platform.OS !== 'web' && canUseBiometricAuthentication?.();

      if (biometrySupported) {
        const password = await retrievePassword();
        if (!password) return;
        const storeSeed = await retrieveAndDecryptCashuMnemonic(password);

        if (storeSeed) setHasSeedCashu(true);

        if (isSeedCashuStorage) setHasSeedCashu(true);
      }
    })();

    // (async () => {

    //   console.log("ndkCashuWallet", ndkCashuWallet)
    //   console.log("ndkWallet", ndkWallet)

    //   const availableTokens = await ndkCashuWallet?.availableTokens;
    //   console.log("availableTokens", availableTokens)

    //   const mintBalances = await ndkCashuWallet?.mintBalances;
    //   console.log("mintBalances", mintBalances)

    //   console.log("mintBalances", mintBalances)
    //   const wallets = await ndkWallet?.wallets;
    //   console.log("wallets", wallets)

    //   const balance = await ndkCashuWallet?.balance;

    //   console.log("balance", balance)

    //   if (mint) {
    //     const mintBalance = await ndkCashuWallet?.mintBalance(mint?.mintUrl);
    //     console.log("mintBalance", mintBalance)

    //   }

    // })();

    getProofsWalletAndBalance();
  }, []);

  return (
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceTitle}>Your balance</Text>
      <Text style={styles.balance}>{balance}</Text>
      <Text style={styles.activeMintText}>
        Connected to: <b>{mintUrls?.[activeMintIndex]?.alias}</b>
      </Text>
    </View>
  );
};
