import '../../../applyGlobalPolyfills';

import {webln} from '@getalby/sdk';
import {useAuth, useCashu, useCashuStore, useSendZap} from 'afk_nostr_sdk';
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
import {MintQuoteResponse} from '@cashu/cashu-ts';
import {CopyIconStack} from '../../assets/icons';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import {
  retrieveAndDecryptCashuMnemonic,
  retrievePassword,
  storeCashuMnemonic,
} from '../../utils/storage';
import {SelectedTab, TABS_CASHU} from '../../types/tab';

export const MnemonicCashu = () => {
  const {
    wallet,
    connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
  } = useCashu();

  // const { isSeedCashuStorage, setIsSeedCashuStorage } = useAuth()
  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();

  useEffect(() => {
    (async () => {
      const biometrySupported = Platform.OS !== 'web' && canUseBiometricAuthentication?.();

      if (biometrySupported) {
        const password = await retrievePassword();
        console.log('password', password);

        if (!password) return;
        const storeMnemonic = await retrieveAndDecryptCashuMnemonic(password);
        console.log('storeMnemonic', storeMnemonic);

        const mnemonicHex = storeMnemonic.toString('hex');
        console.log('mnemonicHex', mnemonicHex);

        if (storeMnemonic) setHasSeedCashu(true);

        if (isSeedCashuStorage) setHasSeedCashu(true);
      } else {
        const password = await retrievePassword();
        console.log('password', password);

        if (!password) return;
        const storeMnemonic = await retrieveAndDecryptCashuMnemonic(password);
        console.log('storeMnemonic', storeMnemonic);

        const mnemonicHex = Buffer.from(storeMnemonic.toString()).toString('hex');
        console.log('mnemonicHex', mnemonicHex);
        if (storeMnemonic) setHasSeedCashu(true);

        if (isSeedCashuStorage) setHasSeedCashu(true);
      }
    })();
  }, []);

  const styles = useStyles(stylesheet);
  const [mintUrl, setMintUrl] = useState<string | undefined>('https://mint.minibits.cash/Bitcoin');

  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [mintsUrls, setMintUrls] = useState<string[]>(['https://mint.minibits.cash/Bitcoin']);
  const [hasSeedCashu, setHasSeedCashu] = useState(isSeedCashuStorage);

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);

  const [generatedInvoice, setGeneratedInvoice] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const {theme} = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const password = await retrievePassword();
      if (!password) return;
      const storeSeed = await retrieveAndDecryptCashuMnemonic(password);

      if (storeSeed) setHasSeedCashu(true);

      if (isSeedCashuStorage) setHasSeedCashu(true);
    })();
  }, [isSeedCashuStorage]);
  const {showDialog, hideDialog} = useDialog();

  const {showToast} = useToast();

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LIGHTNING_NETWORK_WALLET,
  );

  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      // navigation.navigate(screen as any);
    }
  };

  const handleCopy = async (type: 'lnbc' | 'seed') => {
    if (!quote?.request) return;
    if (type == 'lnbc') {
      await Clipboard.setStringAsync(
        type === 'lnbc' ? quote?.request?.toString() : quote?.request?.toString(),
      );
    } else if (type == 'seed') {
      if (newSeed) {
        await Clipboard.setStringAsync(newSeed);
      }
    }
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

  const handleGenerateAndSavedMnemonic = async () => {
    const password = await retrievePassword();
    console.log('password', password);

    if (!password) return;

    const storeSeed = await retrieveAndDecryptCashuMnemonic(password);
    console.log('storeSeed', storeSeed);

    if (storeSeed) {
      showDialog({
        title: 'Generate a new Cashu Seed',
        description:
          'Take care. You already have a Cashu Seed integrated. Please saved before generate another',
        buttons: [
          {
            type: 'primary',
            label: 'Yes',
            onPress: async () => {
              const mnemonic = await generateMnemonic();
              console.log('mnemonic', mnemonic);

              const seedSaved = await storeCashuMnemonic(mnemonic, password);
              console.log('seedSaved', seedSaved);

              setNewSeed(seedSaved);
              setIsSeedCashuStorage(true);
              setHasSeedCashu(true);
              showToast({title: 'Seed generate for Cashu Wallet', type: 'success'});
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
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {!hasSeedCashu && (
          <View style={styles.container}>
            <Text>You don't have a Cashu Seed setup to secure your wallet</Text>
            <Button onPress={handleGenerateAndSavedMnemonic}>Generate seed</Button>
          </View>
        )}

        {hasSeedCashu && (
          <Input
            value={newSeed}
            editable={false}
            right={
              <TouchableOpacity
                onPress={() => handleCopy('seed')}
                // style={{
                //   marginRight: 10,
                // }}
              >
                <CopyIconStack color={theme.colors.primary} />
              </TouchableOpacity>
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
