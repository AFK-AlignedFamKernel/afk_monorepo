/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../applyGlobalPolyfills';

import {getEncodedToken, MintQuoteResponse, MintQuoteState, Proof} from '@cashu/cashu-ts';
import {
  getProofs,
  getProofsSpent,
  ICashuInvoice,
  ProofInvoice,
  storeProofs,
  storeTransactions,
  useCashuStore,
  useNostrContext,
} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import React, {useEffect, useState} from 'react';
import {FlatList, Modal, Platform, TouchableOpacity, View} from 'react-native';
import {Text} from 'react-native';

import {CopyIconStack, InfoIcon, ViewIcon} from '../../assets/icons';
import {Button, Divider} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import {useCashuContext} from '../../providers/CashuProvider';
import {SelectedTab} from '../../types/tab';
import {getRelativeTime} from '../../utils/helpers';
import {retrieveAndDecryptCashuMnemonic, retrievePassword} from '../../utils/storage';
import {getInvoices, storeInvoices} from '../../utils/storage_cashu';
import stylesheet from './styles';

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

      if (invoicesLocal) {
        const invoices: ICashuInvoice[] = JSON.parse(invoicesLocal);
        const invoicesPaid = invoices.filter(
          (i) => i?.state === MintQuoteState?.ISSUED || i?.state === MintQuoteState.PAID,
        );
        const invoicesSorted = invoicesPaid
          .map((invoice) => ({...invoice, direction: 'in'} as ICashuInvoice))
          .reverse();
        setTxInvoices([...invoicesSorted]);
      }

      const proofsLocal = getProofsSpent();

      if (proofsLocal) {
        const proofsSpent: ProofInvoice[] = JSON.parse(proofsLocal);
        const proofsSpentSorted = proofsSpent
          .map((proof) => ({...proof, direction: 'out'} as ProofInvoice))
          .reverse();
        console.log('proofsSpentSorted', proofsSpentSorted);
        setTxInvoices((invoices) => [...invoices, ...proofsSpentSorted]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const [selectedTx, setSelectedTx] = useState<string>('');

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
      if (!quote) return;
      const check = await checkMintQuote(quote);
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
    <View style={styles.tabContentContainer}>
      <Text style={styles.tabTitle}>Cashu History</Text>
      {txInvoices?.length > 0 ? (
        <>
          <View style={styles.tableHeadersContainer}>
            <View style={styles.txDirectionColumn}>
              <Text style={styles.tableHeading}>DIR</Text>
            </View>
            <View style={styles.txAmountColumn}>
              <Text style={styles.tableHeading}>AMOUNT</Text>
            </View>
            <View style={styles.txActionsColumn}>
              <Text style={styles.tableHeading}>ACTIONS</Text>
            </View>
          </View>
          <FlatList
            ItemSeparatorComponent={() => <Divider></Divider>}
            data={txInvoices
              .filter((invoice) => invoice.bolt11)
              ?.flat()
              .reverse()}
            contentContainerStyle={styles.txListContainer}
            keyExtractor={(item, i) => item?.bolt11 ?? i?.toString()}
            renderItem={({item}) => {
              return (
                <>
                  <TouchableOpacity style={styles.txContainer}>
                    <View style={styles.txDirectionColumn}>
                      <Text
                        style={[
                          styles.dirText,
                          item.direction === 'out'
                            ? styles.dirOutText
                            : item.direction === 'in'
                            ? styles.dirInText
                            : null,
                        ]}
                      >
                        {item?.direction}
                      </Text>
                    </View>
                    <View style={styles.txAmountColumn}>
                      <Text style={styles.amountText}>{item?.amount} sat</Text>
                    </View>
                    <View style={styles.txActionsColumn}>
                      <TouchableOpacity
                        onPress={() => handleCopy(item.bolt11)}
                        style={styles.txActionButton}
                      >
                        <CopyIconStack width={20} height={20} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedTx(item.bolt11 || '');
                        }}
                        style={styles.txActionButton}
                      >
                        <ViewIcon width={20} height={20} color="transparent" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  <Modal
                    animationType="fade"
                    transparent={true}
                    visible={selectedTx === item.bolt11}
                  >
                    <View style={styles.txModalContainer}>
                      <View style={styles.txModalContent}>
                        <Text style={styles.txModalTitle}>Transaction Details</Text>
                        <Text style={styles.txModalTextAmount}>
                          <b>Amount:</b> {item.amount} sat
                        </Text>
                        <Text style={styles.txModalTextTime}>
                          {getRelativeTime(item.date || '')}
                        </Text>
                        <Text style={styles.txModalTextState}>{item.state}</Text>
                        <View style={styles.txModalActionsContainer}>
                          <Button
                            onPress={() => handleCopy(item.bolt11)}
                            style={styles.txModalActionButton}
                            textStyle={styles.txModalActionButtonText}
                          >
                            Copy
                          </Button>
                          <Button
                            onPress={() => setSelectedTx('')}
                            style={styles.txModalActionButton}
                            textStyle={styles.txModalActionButtonText}
                          >
                            Close
                          </Button>
                        </View>
                      </View>
                    </View>
                  </Modal>
                </>
              );
            }}
          />
        </>
      ) : (
        <View style={styles.noDataContainer}>
          <InfoIcon width={30} height={30} color={theme.colors.primary} />
          <Text style={styles.noDataText}>No history data found.</Text>
        </View>
      )}
    </View>
  );
};
