import '../../../applyGlobalPolyfills';

import { webln } from '@getalby/sdk';
import { useAuth, useCashu, useCashuStore, useNostrContext, useSendZap } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, { SetStateAction, useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Modal, Text, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import { Button, Divider, IconButton, Input } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import { useDialog, useToast } from '../../hooks/modals';
import stylesheet from './styles';
import { CashuMint, MintQuoteResponse } from '@cashu/cashu-ts';
import { CopyIconStack } from '../../assets/icons';
import { canUseBiometricAuthentication } from 'expo-secure-store';
import { retrieveAndDecryptCashuMnemonic, retrievePassword, storeCashuMnemonic } from '../../utils/storage';
import { SelectedTab, TABS_CASHU } from '../../types/tab';
import { getInvoices } from '../../utils/storage_cashu';
import { ICashuInvoice } from '../../types/wallet';


export const InvoicesListCashu = () => {

  const { wallet, connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
    getKeySets,
    getKeys

  } = useCashu()
  const { ndkCashuWallet, ndkWallet } = useNostrContext()

  const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")
  const [mint, setMint] = useState<CashuMint | undefined>(mintUrl ? new CashuMint(mintUrl) : undefined)

  const { isSeedCashuStorage, setIsSeedCashuStorage } = useCashuStore()
  const [invoices, setInvoices] = useState<ICashuInvoice[] | undefined>([])

  useEffect(() => {


    (async () => {

      const invoicesLocal = await getInvoices()


      if (invoicesLocal) {
        const invoices: ICashuInvoice[] = JSON.parse(invoicesLocal)
        console.log("invoices", invoices)
        setInvoices(invoices)


      }
    })();



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

      // const keysSet = await getKeySets()
      // const keys = await getKeys()
      // console.log("keysSet", keysSet)
      // console.log("keys", keys)

      // const mintBalances = await ndkCashuWallet?.mintBalances;

      // console.log("mintBalances", mintBalances)

      // const availableTokens = await ndkCashuWallet?.availableTokens;
      // console.log("availableTokens", availableTokens)

      // const wallets = await ndkWallet?.wallets;

      // console.log("wallets", wallets)
      // const balance = await ndkCashuWallet?.balance;

      // console.log("balance", balance)

      // if (mint) {
      //   const mintBalance = await ndkCashuWallet?.mintBalance(mint?.mintUrl);
      //   console.log("mintBalance", mintBalance)

      // }




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


  const handleVerifyQuote = () => {

    showToast({
      title: "Verify coming soon",
      type: "error"
    })
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>

        <View style={styles.container}>

          <FlatList
            ItemSeparatorComponent={() => <Divider></Divider>}

            // contentContainerStyle={styles.flatListContent}
            data={invoices?.flat()}
            keyExtractor={(item, i) => item?.bolt11 ?? i?.toString()}
            renderItem={({ item }) => {

              const date = item?.date && new Date(item?.date)?.toISOString()

              // setMintUrls(mintsUrls)
              return (<View style={styles.card}>
                <View>
                  <Text>Bolt11: {item?.bolt11}</Text>
                  <Text>Amount: {item?.amount}</Text>
                  <Text>Mint: {item?.mint}</Text>
                  <Text>Status: {item?.state}</Text>
                  {date &&
                    <Text>Date: {date}</Text>}

                </View>


                <View>
                  <Button
                    onPress={handleVerifyQuote}
                  >Verify</Button>

                </View>

              </View>)
            }}
          />



        </View>
      </ScrollView>
    </SafeAreaView >
  );
};
