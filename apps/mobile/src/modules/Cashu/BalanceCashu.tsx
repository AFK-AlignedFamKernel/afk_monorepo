import '../../../applyGlobalPolyfills';

import {CashuMint, MintQuoteResponse} from '@cashu/cashu-ts';
import {useCashu, useCashuStore, useNostrContext} from 'afk_nostr_sdk';
import {useCashuBalance} from 'afk_nostr_sdk/src/hooks/cashu';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import React, {useEffect, useState} from 'react';
import {Platform, View} from 'react-native';
import {Text, TextInput} from 'react-native';

import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
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
    mintUrl,
    setMintUrl,
  } = useCashu();
  const {ndkCashuWallet, ndkWallet} = useNostrContext();

  const {balance, setBalance, getProofsWalletAndBalance} = useCashuBalance();
  const [mint, setMint] = useState<CashuMint | undefined>(
    mintUrl ? new CashuMint(mintUrl) : undefined,
  );

  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();
  const styles = useStyles(stylesheet);
  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [mintsUrls, setMintUrls] = useState<string[]>(['https://mint.minibits.cash/Bitcoin']);
  const [hasSeedCashu, setHasSeedCashu] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const {theme} = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();
  const {showToast} = useToast();

  const {showDialog, hideDialog} = useDialog();

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
    // <SafeAreaView style={styles.safeArea}>
    <View
    // contentContainerStyle={styles.scrollView}
    >
      <View style={styles.container}>
        <View>
          <Text style={styles.text}>Your balance</Text>

          <Text style={styles.text}>{balance}</Text>
        </View>

        <View>
          <Text style={styles.text}>Connect to</Text>
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
