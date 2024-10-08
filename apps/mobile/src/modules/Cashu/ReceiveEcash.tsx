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
import {getDecodedToken, GetInfoResponse, MintQuoteResponse, MintQuoteState} from '@cashu/cashu-ts';
import {CopyIconStack} from '../../assets/icons';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import {
  retrieveAndDecryptCashuMnemonic,
  retrievePassword,
  storeCashuMnemonic,
} from '../../utils/storage';
import {SelectedTab, TABS_CASHU} from '../../types/tab';

import {getInvoices, storeInvoices} from '../../utils/storage_cashu';

export const ReceiveEcash = () => {
  const tabs = ['lightning', 'ecash'];

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
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
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
  useEffect(() => {}, []);

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

      const cashuInvoice: ICashuInvoice = {
        bolt11: quote?.request?.request,
        quote: quote?.request?.quote,
        state: quote?.request?.state ?? MintQuoteState.UNPAID,
        date: new Date().getTime(),
        amount: Number(invoiceAmount),
        mint: mintUrl,
        quoteResponse: quote?.request,
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

  const handleCopy = async (type: 'lnbc' | 'ecash') => {
    if (!quote?.request) return;
    if (type == 'lnbc') {
      await Clipboard.setStringAsync(
        type === 'lnbc' ? quote?.request?.toString() : quote?.request?.toString(),
      );
    } else if (type == 'ecash') {
      if (ecash) {
        await Clipboard.setStringAsync(ecash);
      }
    }
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

  const handleReceiveEcash = async () => {
    try {
      if (!ecash) {
        return;
      }
      const encoded = getDecodedToken(ecash);
      console.log('encoded', encoded);

      const response = await wallet?.receive(encoded);
      console.log('response', response);

      if (response) {
        showToast({title: 'ecash payment received', type: 'success'});
        await addProofs(response);
      }
    } catch (e) {
      console.log('handleReceiveEcash error', e);
    }
  };

  return (
    <SafeAreaView
    // style={styles.safeArea}
    >
      <View
      // style={styles.container}
      >
        <View
        //  style={styles.container}
        >
          {/* <View style={styles.content}>
            <TextInput
              placeholder="Mint URL"
              value={mintUrl}
              onChangeText={setMintUrl}
              style={styles.input}
            />
          </View> */}
          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => handleTabChange(tab)}
              >
                <Text style={styles.tabText}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab == 'ecash' && (
            <>
              <TextInput
                // className="bg-accent text-white rounded-lg px-4 py-2 hover:bg-opacity-90 transition-colors duration-150"
                // className="bg-black text-white rounded-lg px-4 py-2 hover:bg-opacity-90 transition-colors duration-150"
                placeholder="Enter token: cashuXYZ"
                // keyboardType=""
                value={ecash}
                onChangeText={setEcash}
                style={styles.input}
              ></TextInput>

              {ecash && (
                <View
                  style={{
                    marginVertical: 3,
                  }}
                >
                  <Text style={styles.text}>ecash token</Text>

                  <Input
                    value={ecash}
                    editable={false}
                    right={
                      <TouchableOpacity
                        onPress={() => handleCopy('ecash')}
                        style={{
                          marginRight: 10,
                        }}
                      >
                        <CopyIconStack color={theme.colors.primary} />
                      </TouchableOpacity>
                    }
                  />
                </View>
              )}

              <Button onPress={handleReceiveEcash}>Receive ecash</Button>
            </>
          )}

          {activeTab == 'lightning' && (
            <>
              <TextInput
                placeholder="Amount"
                keyboardType="numeric"
                value={invoiceAmount}
                onChangeText={setInvoiceAmount}
                style={styles.input}
              />

              <Button onPress={generateInvoice}>Generate invoice</Button>

              {quote?.request && (
                <View
                  style={{
                    marginVertical: 3,
                  }}
                >
                  <Text style={styles.text}>Invoice address</Text>

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
              )}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
