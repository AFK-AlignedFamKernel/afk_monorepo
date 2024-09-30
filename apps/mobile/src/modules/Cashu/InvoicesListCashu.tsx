import '../../../applyGlobalPolyfills';

import {getEncodedToken, MintQuoteResponse, MintQuoteState, Proof} from '@cashu/cashu-ts';
import {
  getProofs,
  ICashuInvoice,
  storeProofs,
  storeTransactions,
  useCashu,
  useCashuStore,
  useNostrContext,
} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import React, {useEffect, useState} from 'react';
import {FlatList, Platform, ScrollView, TouchableOpacity, View} from 'react-native';
import {Text} from 'react-native';

import {CopyIconStack} from '../../assets/icons';
import {Button, Divider, Input} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import {SelectedTab} from '../../types/tab';
import {retrieveAndDecryptCashuMnemonic, retrievePassword} from '../../utils/storage';
import {getInvoices, storeInvoices} from '../../utils/storage_cashu';
import stylesheet from './styles';

export const InvoicesListCashu = () => {
  const {
    wallet,
    connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
    getKeySets,
    getKeys,
    checkMeltQuote,
    checkMintQuote,
    checkProofSpent,
    receiveP2PK,
    mintTokens,
    mint,
    mintUrl,
  } = useCashu();
  const {ndkCashuWallet, ndkWallet} = useNostrContext();

  // const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")
  // const [mint, setMint] = useState<CashuMint | undefined>(mintUrl ? new CashuMint(mintUrl) : undefined)

  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();
  const [invoices, setInvoices] = useState<ICashuInvoice[] | undefined>([]);

  useEffect(() => {
    (async () => {
      const invoicesLocal = await getInvoices();

      if (invoicesLocal) {
        const invoices: ICashuInvoice[] = JSON.parse(invoicesLocal);
        console.log('invoices', invoices);
        setInvoices(invoices);
      }
    })();

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

  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [mintsUrls, setMintUrls] = useState<string[]>(['https://mint.minibits.cash/Bitcoin']);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);
  const [hasSeedCashu, setHasSeedCashu] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);

  const {theme} = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();

  const {showDialog, hideDialog} = useDialog();

  const {showToast} = useToast();

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LIGHTNING_NETWORK_WALLET,
  );

  const handleVerifyQuote = async (quote?: string) => {
    if (!quote) {
      return showToast({title: 'Use a valid quote string', type: 'info'});
    }
    const check = await checkMintQuote(quote);
    console.log('check', check);

    if (check) {
      if (check?.state == MintQuoteState.PAID) {
        return showToast({
          title: 'Quote paid',
          type: 'success',
        });
      } else if (check?.state == MintQuoteState.UNPAID) {
        return showToast({
          title: 'Quote unpaid',
          type: 'info',
        });
      } else if (check?.state == MintQuoteState.ISSUED) {
        return showToast({
          title: 'Quote issued',
          type: 'info',
        });
      }
    }
    return showToast({
      title: 'Verify coming soon',
      type: 'error',
    });
  };

  const handleVerify = async (quote?: string) => {
    try {
      console.log('handleVerify');
      if (!quote) return;
      console.log('quote', quote);
      const check = await checkMintQuote(quote);
      console.log('check', check);
      if (check?.state === MintQuoteState.UNPAID) {
        showToast({title: 'Unpaid', type: 'success'});
      } else if (check?.state === MintQuoteState.PAID) {
        showToast({title: 'Invoice is paid. Try to issued', type: 'success'});
        const invoice = invoices?.find((i) => i?.quote == quote);

        const invoicesUpdated =
          invoices?.map((i) => {
            if (i?.quote === quote) {
              i.state = MintQuoteState.PAID;

              return i;
            }
            return i;
          }) ?? [];

        storeInvoices(invoicesUpdated);
        storeTransactions(invoicesUpdated);

        if (invoice && invoice?.quote) {
          console.log('invoice', invoice);

          const received = await handleReceivePaymentPaid(invoice);
          console.log('received', received);

          if (received) {
            showToast({title: 'Payment received', type: 'success'});
          }
        }
      } else if (check?.state === MintQuoteState.ISSUED) {
        showToast({title: 'Invoice is paid', type: 'success'});
        const invoice = invoices?.find((i) => i?.quote == quote);
        const invoicesUpdated =
          invoices?.map((i) => {
            if (i?.quote === quote) {
              i.state = MintQuoteState.PAID;
              return i;
            }
            return i;
          }) ?? [];
        storeInvoices(invoicesUpdated);
        storeTransactions(invoicesUpdated);
        if (invoice && invoice?.quote) {
          const received = await handleReceivePaymentPaid(invoice);
          if (received) {
            showToast({title: 'Received', type: 'success'});
          }
        }
      }
    } catch (e) {
      console.log('handleVerify', e);
    }
  };

  const handleReceivePaymentPaid = async (invoice: ICashuInvoice) => {
    try {
      if (invoice?.amount) {
        const receive = await mintTokens(
          Number(invoice?.amount),
          invoice?.quoteResponse ?? (invoice as unknown as MintQuoteResponse),
        );
        console.log('receive', receive);

        const encoded = getEncodedToken({
          token: [{mint: mint?.mintUrl, proofs: receive?.proofs as Proof[]}],
        });
        // const response = await wallet?.receive(encoded);
        const response = await receiveP2PK(encoded);
        console.log('response', response);
        const proofsLocal = await getProofs();
        if (!proofsLocal) {
          setInvoices(invoices);
          await storeProofs([...(receive?.proofs as Proof[]), ...(response as Proof[])]);
          return response;
        } else {
          const proofs: Proof[] = JSON.parse(proofsLocal);
          console.log('invoices', invoices);
          setInvoices(invoices);
          console.log('receive', receive);
          await storeProofs([...proofs, ...(receive?.proofs as Proof[]), ...(response as Proof[])]);
          return response;
        }
      }

      return undefined;
    } catch (e) {
      console.log('Error handleReceivePaymentPaid', e);
      return undefined;
    }
  };

  const handleCopy = async (bolt11?: string) => {
    if (!bolt11) return;
    await Clipboard.setStringAsync(bolt11);

    showToast({
      title: 'Your invoice is copied',
      type: 'info',
    });
  };

  return (
    // <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.scrollView}>
      <View style={styles.container}>
        <FlatList
          ItemSeparatorComponent={() => <Divider></Divider>}
          data={invoices?.flat().reverse()}
          contentContainerStyle={styles.flatListContent}
          keyExtractor={(item, i) => item?.bolt11 ?? i?.toString()}
          renderItem={({item}) => {
            const date = item?.date && new Date(item?.date)?.toISOString();
            return (
              <View style={styles.card}>
                <View>
                  <Input
                    value={item?.bolt11}
                    editable={false}
                    right={
                      <TouchableOpacity
                        onPress={() => handleCopy(item?.bolt11)}
                        style={{
                          marginRight: 10,
                        }}
                      >
                        <CopyIconStack color={theme.colors.primary} />
                      </TouchableOpacity>
                    }
                  />
                  <Text style={styles.text}>Amount: {item?.amount}</Text>
                  <Text style={styles.text}>Mint: {item?.mint}</Text>
                  <Text style={styles.text}>Status: {item?.state}</Text>
                  {date && <Text style={styles.text}>Date: {date}</Text>}
                </View>

                <View>
                  <Button onPress={() => handleVerify(item?.quote)}>Verify</Button>
                </View>
              </View>
            );
          }}
        />
      </View>
    </ScrollView>
    // </SafeAreaView >
  );
};
