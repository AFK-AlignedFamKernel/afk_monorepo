import '../../../applyGlobalPolyfills';

import {GetInfoResponse, MintQuoteResponse} from '@cashu/cashu-ts';
import {ICashuInvoice, useCashu, useCashuStore, useNostrContext} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {useEffect, useState} from 'react';
import {SafeAreaView, TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from 'react-native';

import {CopyIconStack} from '../../assets/icons';
import {Button, Input} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import {SelectedTab} from '../../types/tab';
import {getInvoices, storeInvoices} from '../../utils/storage_cashu';
import stylesheet from './styles';

export const GenerateInvoiceCashu = () => {
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
    mintUrl,
    setMintUrl,
  } = useCashu();

  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();

  const styles = useStyles(stylesheet);
  // const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")

  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [infoMint, setMintInfo] = useState<GetInfoResponse | undefined>();
  const [mintsUrls, setMintUrls] = useState<string[]>(['https://mint.minibits.cash/Bitcoin']);
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
  const {theme} = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();

  const {showDialog, hideDialog} = useDialog();

  const {showToast} = useToast();

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LIGHTNING_NETWORK_WALLET,
  );

  useEffect(() => {
    (async () => {
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

  const generateInvoice = async (): Promise<void | any> => {
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
        // quote: quote?.request?.quote,
        // state: quote?.request?.state,
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

          <View
          // style={styles.text}
          >
            <Text style={styles.text}>Name: {infoMint?.name}</Text>
            <Text style={styles.text}>Description: {infoMint?.description}</Text>
            <Text style={styles.text}>MOTD: {infoMint?.motd}</Text>
          </View>

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
              {/* <Text style={styles.text}>Invoice address</Text> */}

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
        </View>
      </View>
    </SafeAreaView>
  );
};
