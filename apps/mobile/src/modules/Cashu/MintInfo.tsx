import '../../../applyGlobalPolyfills';

import {webln} from '@getalby/sdk';
import {
  addProofs,
  ICashuInvoice,
  useAuth,
  useCashu,
  useCashuStore,
  useNostrContext,
  useSendZap,
} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {ChangeEvent, SetStateAction, useEffect, useState} from 'react';
import {Platform, Pressable, SafeAreaView, ScrollView, TouchableOpacity, View} from 'react-native';
import {ActivityIndicator, Modal, Text, TextInput} from 'react-native';
import {WebView} from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import {Button, IconButton, Input} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import stylesheet from './styles';
import {getDecodedToken, GetInfoResponse, MintQuoteResponse} from '@cashu/cashu-ts';
import {CopyIconStack} from '../../assets/icons';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import {
  retrieveAndDecryptCashuMnemonic,
  retrievePassword,
  storeCashuMnemonic,
} from '../../utils/storage';
import {SelectedTab, TABS_CASHU} from '../../types/tab';

import {getInvoices, storeInvoices} from '../../utils/storage_cashu';

export const MintInfo = () => {
  const {ndkCashuWallet, ndkWallet} = useNostrContext();
  const {
    wallet,
    connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
    getMintInfo,
    mint,
    mintTokens,
    mintUrls,
    activeMintIndex,
  } = useCashu();
  const [ecash, setEcash] = useState<string | undefined>();
  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();

  const styles = useStyles(stylesheet);
  // const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")

  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [infoMint, setMintInfo] = useState<GetInfoResponse | undefined>();
  const [mintsUrls, setMintUrls] = useState<string[]>(['https://mint.minibits.cash/Bitcoin']);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState('');

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);

  const [generatedInvoice, setGeneratedInvoice] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const {theme} = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();

  const {showDialog, hideDialog} = useDialog();

  const {showToast} = useToast();

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LIGHTNING_NETWORK_WALLET,
  );

  const handleChangeEcash = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEcash(value);
  };
  useEffect(() => {
    (async () => {
      const mintUrl = mintUrls?.[activeMintIndex]?.url;
      if (!mintUrl) return;
      const info = await getMintInfo(mintUrl);
      setMintInfo(info);
    })();
  }, []);

  const generateInvoice = async () => {
    const mintUrl = mintUrls?.[activeMintIndex]?.url;
    if (!mintUrl || !invoiceAmount) return;
    try {
      const cashuMint = await connectCashMint(mintUrl);
      const wallet = await connectCashWallet(cashuMint?.mint);

      const quote = await requestMintQuote(Number(invoiceAmount));
      setQuote(quote?.request);
      console.log('quote', quote);
      setIsLoading(true);
      setIsInvoiceModalVisible(false);

      const invoicesLocal = await getInvoices();

      if (!quote?.request) {
        return showToast({
          title: 'Quote not created',
          type: 'error',
        });
      }

      const cashuInvoice: ICashuInvoice = {
        bolt11: quote?.request?.request,
        date: new Date().getTime(),
        amount: Number(invoiceAmount),
        mint: mintUrl,
        quoteResponse: quote?.request,
        ...quote?.request,
      };

      if (invoicesLocal) {
        const invoices: ICashuInvoice[] = JSON.parse(invoicesLocal);
        console.log('invoices', invoices);
        storeInvoices([...invoices, cashuInvoice]);
      } else {
        console.log('no old invoicesLocal', invoicesLocal);
        storeInvoices([cashuInvoice]);
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <SafeAreaView
    // style={styles.safeArea}
    >
      <View
      // style={styles.text}
      >
        <Text style={styles.text}>Name: {infoMint?.name}</Text>
        <Text style={styles.text}>Description: {infoMint?.description}</Text>
        <Text style={styles.text}>MOTD: {infoMint?.motd}</Text>
      </View>
    </SafeAreaView>
  );
};
