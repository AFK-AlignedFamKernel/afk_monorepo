import '../../../applyGlobalPolyfills';

import {webln} from '@getalby/sdk';
import {
  getProofs,
  getProofsSpent,
  ICashuInvoice,
  ProofInvoice,
  storeProofs,
  storeTransactions,
  useAuth,
  useCashu,
  useCashuStore,
  useNostrContext,
  useSendZap,
} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {SetStateAction, useEffect, useState} from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import {ActivityIndicator, Modal, Text, TextInput} from 'react-native';
import {WebView} from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import {Button, Divider, IconButton, Input} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import stylesheet from './styles';
import {
  CashuMint,
  getEncodedToken,
  MintQuoteResponse,
  MintQuoteState,
  Proof,
} from '@cashu/cashu-ts';
import {CopyIconStack, InfoIcon} from '../../assets/icons';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import {
  retrieveAndDecryptCashuMnemonic,
  retrievePassword,
  storeCashuMnemonic,
} from '../../utils/storage';
import {SelectedTab, TABS_CASHU} from '../../types/tab';
import {getInvoices, storeInvoices} from '../../utils/storage_cashu';
import {TypeToast} from '../../context/Toast/ToastContext';
import {useCashuContext} from '../../providers/CashuProvider';

export const HistoryTxCashu = () => {
  const styles = useStyles(stylesheet);
  const {theme} = useTheme();

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
  } = useCashuContext()!;

  const {ndkCashuWallet, ndkWallet} = useNostrContext();
  const [txInvoices, setTxInvoices] = useState<ICashuInvoice[]>([]);

  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();
  const [invoices, setInvoices] = useState<ICashuInvoice[] | undefined>([]);

  useEffect(() => {
    const handleGetInvoices = async () => {
      const invoicesLocal = await getInvoices();
      let invoicesIn: ICashuInvoice[] = [];

      if (invoicesLocal) {
        const invoices: ICashuInvoice[] = JSON.parse(invoicesLocal);
        const invoicesPaid = invoices.filter(
          (i) => i?.state === MintQuoteState?.ISSUED || i?.state === MintQuoteState.PAID,
        );
        const invoicesSorted = invoicesPaid
          // .sort((a, b) => Number(a?.date) - Number(b?.date))
          .reverse();

        invoicesIn = invoicesSorted;
        setTxInvoices([...invoicesSorted]);
      }

      const proofsLocal = getProofsSpent();

      if (proofsLocal) {
        const proofsSpent: ProofInvoice[] = JSON.parse(proofsLocal);
        const proofsSpentSorted = proofsSpent
          .map((c) => {
            return c;
          })
          .reverse();
        console.log('proofsSpentSorted', proofsSpentSorted);
        setTxInvoices([...invoicesIn, ...proofsSpentSorted]);
      }
    };
    handleGetInvoices();

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
  }, []);

  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);
  const [hasSeedCashu, setHasSeedCashu] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);

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
      if (invoice?.amount && invoice?.quoteResponse) {
        const receive = await mintTokens(Number(invoice?.amount), invoice?.quoteResponse);
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
    <View style={styles.tabContentContainer}>
      <Text style={styles.tabTitle}>Cashu History</Text>
      {txInvoices?.length > 0 ? (
        <FlatList
          ItemSeparatorComponent={() => <Divider></Divider>}
          data={txInvoices?.flat().reverse()}
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
      ) : (
        <View style={styles.noDataContainer}>
          <InfoIcon width={30} height={30} color={theme.colors.primary} />
          <Text style={styles.noDataText}>No history data found.</Text>
        </View>
      )}
    </View>
  );
};
