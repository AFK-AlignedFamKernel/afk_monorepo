/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../applyGlobalPolyfills';

import {MintQuoteResponse} from '@cashu/cashu-ts';
import {useCashuStore, useNostrContext} from 'afk_nostr_sdk';
import {useCashuBalance} from 'afk_nostr_sdk/src/hooks/cashu';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import React, {useEffect, useState} from 'react';
import {Platform, View} from 'react-native';
import {Text} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';

import {useStyles, useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {useCashuContext} from '../../providers/CashuProvider';
import {formatCurrency} from '../../utils/helpers';
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
    activeCurrency,
    getUnits,
    setActiveCurrency,
    getUnitBalance,
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

  const [mintUnits, setMintUnits] = useState<string[]>([]);

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

    getProofsWalletAndBalance();
  }, [getProofsWalletAndBalance, isSeedCashuStorage]);

  // Load units and their balances for each mint
  useEffect(() => {
    const loadMintUnits = async () => {
      const mint = mintUrls[activeMintIndex];
      try {
        const units = await getUnits(mint);
        setMintUnits(units);
      } catch (error) {
        console.error(`Error loading units for mint ${mint.url}:`, error);
      }
    };

    loadMintUnits();
  }, [activeMintIndex, getUnits, mintUrls]);

  const handleCurrencyChange = () => {
    const currentIndex = mintUnits.indexOf(activeCurrency);
    const nextIndex = (currentIndex + 1) % mintUnits.length;
    setActiveCurrency(mintUnits[nextIndex]);
  };

  const [currentUnitBalance, setCurrentUnitBalance] = useState<number>(0);

  useEffect(() => {
    const fetchBalanceData = async () => {
      const balance = await getUnitBalance(activeCurrency, mintUrls[activeMintIndex]);
      setCurrentUnitBalance(balance);
    };
    fetchBalanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCurrency]);

  return (
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceTitle}>Your balance</Text>
      <TouchableOpacity style={styles.currencyButton} onPress={handleCurrencyChange}>
        <Text style={styles.currencyButtonText}>{activeCurrency.toUpperCase()}</Text>
      </TouchableOpacity>
      <Text style={styles.balance}>{formatCurrency(currentUnitBalance, activeCurrency)}</Text>
      <Text style={styles.activeMintText}>
        Connected to: <b>{mintUrls?.[activeMintIndex]?.alias}</b>
      </Text>
    </View>
  );
};
