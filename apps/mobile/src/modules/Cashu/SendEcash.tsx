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
import {usePayment} from '../../hooks/usePayment';
import TabSelector from '../../components/TabSelector';

export const SendEcash = () => {
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
  const [invoice, setInvoice] = useState<string | undefined>();
  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();
  const tabs = ['lightning', 'ecash'];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
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
  const [generatedEcash, setGenerateEcash] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<string>(String(0));
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const {theme} = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();

  const {showDialog, hideDialog} = useDialog();
  const {handleGenerateEcash, handlePayInvoice} = usePayment();

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
  }, []);

  const handleEcash = async () => {
    console.log('handleEcash');

    if (!invoiceAmount) {
      return showToast({
        title: 'Please enter an amount',
        type: 'error',
      });
    }
    const ecash = await handleGenerateEcash(Number(invoiceAmount));

    if (!ecash) {
      return showToast({
        title: "Ecash token can't be generated",
        type: 'error',
      });
    }
    console.log('ecash', ecash);
    setGeneratedInvoice(ecash);
    setGenerateEcash(ecash);
    return ecash;
  };

  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      // navigation.navigate(screen as any);
    }
  };

  const handleCopy = async (type: 'ecash') => {
    if (!generatedEcash) return;
    if (type == 'ecash') {
      await Clipboard.setStringAsync(generatedEcash);
    }
    //  else if (type == "seed") {
    //   if (newSeed) {
    //     await Clipboard.setStringAsync(newSeed);
    //   }

    // }
    showToast({type: 'info', title: 'Copied to clipboard'});
  };
  return (
    <SafeAreaView
    // style={styles.safeArea}
    >
      <View
      // style={styles.container}
      >
        {/* 
        <TabSelector
          activeTab={selectedTab}
          handleActiveTab={handleTabSelected}
          buttons={[
            {
              title: "Lightning",
              tab: undefined
            }
          ]}
          addScreenNavigation={false}
        ></TabSelector> */}

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

          <View
          // style={styles.text}
          >
            <Text style={styles.text}>Name: {infoMint?.name}</Text>
            <Text style={styles.text}>Description: {infoMint?.description}</Text>
            <Text style={styles.text}>MOTD: {infoMint?.motd}</Text>
          </View>

          {activeTab == 'lightning' && (
            <>
              <TextInput
                placeholder="Invoice to paid"
                value={invoice}
                onChangeText={setInvoice}
                style={styles.input}
              ></TextInput>

              <Button onPress={() => handlePayInvoice(invoice)}>Pay invoice</Button>
            </>
          )}

          {activeTab == 'ecash' && (
            <>
              <TextInput
                placeholder="Amount"
                keyboardType="numeric"
                value={invoiceAmount}
                onChangeText={setInvoiceAmount}
                style={styles.input}
              />
              <Button
                onPress={handleEcash}
                // onPress={() =>  handleEcash}
              >
                Generate eCash
              </Button>

              {generatedEcash && (
                <View
                  style={{
                    marginVertical: 3,
                  }}
                >
                  <Text style={styles.text}>eCash token</Text>

                  <Input
                    value={generatedEcash}
                    editable={false}
                    right={
                      <TouchableOpacity
                        onPress={() => handleCopy('ecash')}
                        style={
                          {
                            // marginRight: 10,
                          }
                        }
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
