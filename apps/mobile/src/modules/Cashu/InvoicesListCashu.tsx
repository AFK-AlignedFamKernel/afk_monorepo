/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../applyGlobalPolyfills';

import {CheckStateEnum, MintQuoteResponse, MintQuoteState, Proof} from '@cashu/cashu-ts';
import {
  getProofs,
  ICashuInvoice,
  storeProofs,
  storeProofsSpent,
  storeTransactions,
  useCashuStore,
} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import React, {useEffect, useState} from 'react';
import {FlatList, Modal, Platform, TouchableOpacity, View} from 'react-native';
import {Text} from 'react-native';

import {CopyIconStack, InfoIcon, RefreshIcon, ViewIcon} from '../../assets/icons';
import {Button, Divider} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import {useCashuContext} from '../../providers/CashuProvider';
import {SelectedTab} from '../../types/tab';
import {getRelativeTime} from '../../utils/helpers';
import {retrieveAndDecryptCashuMnemonic, retrievePassword} from '../../utils/storage';
import {getInvoices, storeInvoices} from '../../utils/storage_cashu';
import stylesheet from './styles';

export const InvoicesListCashu = () => {
  const styles = useStyles(stylesheet);

  const {checkMintQuote, receiveP2PK, mintTokens, mint, activeCurrency, setProofs, wallet} =
    useCashuContext()!;

  const {isSeedCashuStorage} = useCashuStore();
  const [invoices, setInvoices] = useState<ICashuInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');

  useEffect(() => {
    (async () => {
      const invoicesLocal = await getInvoices();
      if (invoicesLocal) {
        setInvoices(invoicesLocal);
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
          const received = await handleReceivePaymentPaid(invoice);

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
      if (invoice?.amount) {
        const receive = await mintTokens(
          Number(invoice?.amount),
          invoice?.quoteResponse ?? (invoice as unknown as MintQuoteResponse),
        );
        // let encoded: string;
        // const token = {
        //   token: [{mint: mint?.mintUrl, proofs: receive?.proofs as Proof[]}],
        //   unit: activeCurrency,
        // } as Token;
        // try {
        //   encoded = getEncodedTokenV4(token);
        // } catch (error) {
        //   encoded = getEncodedToken(token);
        // }

        // const response = await wallet?.receive(encoded);
        // const response = await receiveP2PK(encoded);
        // console.log('response', response);
        const proofsLocal = await getProofs();
        if (!proofsLocal) {
          storeProofs([...(receive as Proof[])]);
          setProofs([...(receive as Proof[])]);

          const proofsSpentLocal = await wallet?.checkProofsStates([...(receive as Proof[])]);

          proofsSpentLocal?.map((p) => {
            if (p.state === CheckStateEnum.SPENT) {
              storeProofsSpent([p as unknown as Proof]);
            }
          });
          return '';
        } else {
          const proofs: Proof[] = JSON.parse(proofsLocal);
          console.log('invoices', invoices);
          setInvoices(invoices);
          console.log('receive', receive);
          storeProofs([...proofs, ...(receive as Proof[])]);
          setProofs([...proofs, ...(receive as Proof[])]);
          return '';
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
      <Text style={styles.tabTitle}>Cashu Invoices</Text>
      {invoices?.length > 0 ? (
        <>
          <View style={styles.tableHeadersContainer}>
            <View style={styles.amountColumn}>
              <Text style={styles.tableHeading}>AMOUNT</Text>
            </View>
            <View style={styles.actionsColumn}>
              <Text style={styles.tableHeading}>ACTIONS</Text>
            </View>
          </View>
          <FlatList
            ItemSeparatorComponent={() => <Divider></Divider>}
            data={invoices
              .filter((invoice) => invoice.bolt11)
              ?.flat()
              .reverse()}
            contentContainerStyle={styles.invoicesListContainer}
            keyExtractor={(item, i) => item?.bolt11 ?? i?.toString()}
            renderItem={({item}) => {
              return (
                <>
                  <TouchableOpacity style={styles.invoiceContainer}>
                    <View style={styles.amountColumn}>
                      <Text style={styles.amountText}>{item?.amount} sat</Text>
                    </View>
                    <View style={styles.actionsColumn}>
                      <TouchableOpacity
                        onPress={() => handleCopy(item.bolt11)}
                        style={styles.invoicesActionButton}
                      >
                        <CopyIconStack width={20} height={20} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedInvoice(item.bolt11 || '');
                        }}
                        style={styles.invoicesActionButton}
                      >
                        <ViewIcon width={20} height={20} color="transparent" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleVerify(item?.quote)}
                        style={styles.invoicesActionButton}
                      >
                        <RefreshIcon width={20} height={20} color="transparent" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  <Modal
                    animationType="fade"
                    transparent={true}
                    visible={selectedInvoice === item.bolt11}
                  >
                    <View style={styles.invoiceModalContainer}>
                      <View style={styles.invoiceModalContent}>
                        <Text style={styles.invoiceModalTitle}>Lightning invoice</Text>
                        <Text style={styles.invoiceModalTextAmount}>
                          <b>Amount:</b> {item.amount} sat
                        </Text>
                        <Text style={styles.invoiceModalTextTime}>
                          {getRelativeTime(item.date || '')}
                        </Text>
                        <Text style={styles.invoiceModalTextState}>{item.state}</Text>
                        <View style={styles.invoiceModalActionsContainer}>
                          <Button
                            onPress={() => handleCopy(item.bolt11)}
                            style={styles.invoiceModalActionButton}
                            textStyle={styles.invoiceModalActionButtonText}
                          >
                            Copy
                          </Button>
                          <Button
                            onPress={() => setSelectedInvoice('')}
                            style={styles.invoiceModalActionButton}
                            textStyle={styles.invoiceModalActionButtonText}
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
          <Text style={styles.noDataText}>No invoices data found.</Text>
        </View>
      )}
    </View>
  );
};
