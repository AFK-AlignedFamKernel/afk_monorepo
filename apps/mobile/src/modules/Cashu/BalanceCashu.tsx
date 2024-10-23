import '../../../applyGlobalPolyfills';

import {MintQuoteResponse} from '@cashu/cashu-ts';
import {useCashuStore, useNostrContext} from 'afk_nostr_sdk';
import {useCashuBalance} from 'afk_nostr_sdk/src/hooks/cashu';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import React, {useEffect, useState} from 'react';
import {Platform, View} from 'react-native';
import {Text} from 'react-native';

import {useStyles, useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {useCashuContext} from '../../providers/CashuProvider';
import {retrieveAndDecryptCashuMnemonic, retrievePassword} from '../../utils/storage';
import stylesheet from './styles';

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
