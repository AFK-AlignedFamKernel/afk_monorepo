/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import {MintQuoteResponse, MintQuoteState} from '@cashu/cashu-ts';
import {ICashuInvoice, useAuth, useCreateSpendingEvent, useCreateTokenEvent} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {useState} from 'react';
import {FlatList, Modal, TouchableOpacity, View} from 'react-native';
import {Text} from 'react-native';

import {CopyIconStack, InfoIcon, RefreshIcon, ViewIcon} from '../../../../assets/icons';
import {Button, Divider} from '../../../../components';
import {useStyles, useTheme} from '../../../../hooks';
import {useToast} from '../../../../hooks/modals';
import {
  useActiveMintStorage,
  useActiveUnitStorage,
  useInvoicesStorage,
  useProofsStorage,
  useTransactionsStorage,
  useWalletIdStorage,
} from '../../../../hooks/useStorageState';
import {useCashuContext} from '../../../../providers/CashuProvider';
import {getRelativeTime} from '../../../../utils/helpers';
import stylesheet from './styles';

export const Invoices = () => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const {showToast} = useToast();

  const {checkMintQuote, mintTokens, proofs, setProofs} = useCashuContext()!;
  const {publicKey, privateKey} = useAuth();

  const {value: invoices, setValue: setInvoices} = useInvoicesStorage();
  const {value: transactions, setValue: setTransactions} = useTransactionsStorage();
  const {value: proofsStorage, setValue: setProofsStorage} = useProofsStorage();
  const {value: activeMint} = useActiveMintStorage();
  const {value: walletId} = useWalletIdStorage();
  const {value: activeUnit} = useActiveUnitStorage();

  const [selectedInvoice, setSelectedInvoice] = useState<string>('');

  const {mutateAsync: createTokenEvent} = useCreateTokenEvent();
  const {mutateAsync: createSpendingEvent} = useCreateSpendingEvent();

  const handleVerify = async (quote?: string) => {
    try {
      if (!quote) return;
      console.log('[VERIFY] quote', quote);
      const check = await checkMintQuote(quote);
      if (check?.state === MintQuoteState.UNPAID) {
        showToast({title: 'Unpaid', type: 'success'});
        return;
      } else if (check?.state === MintQuoteState.PAID) {
        showToast({title: 'Invoice is paid. Receiving payment...', type: 'success'});
        const invoice = invoices?.find((i) => i?.quote == quote);

        const invoicesUpdated = invoices.map((i) => {
          if (i?.quote === quote) {
            i.state = MintQuoteState.PAID;
            return i;
          }
          return i;
        });

        setInvoices(invoicesUpdated);
        if (transactions) {
          setTransactions([
            ...transactions,
            {...invoice, direction: 'in', state: MintQuoteState.PAID} as ICashuInvoice,
          ]);
        } else {
          setTransactions([
            {
              ...invoice,
              direction: 'in',
              state: MintQuoteState.PAID,
            } as ICashuInvoice,
          ]);
        }

        if (invoice && invoice?.quote) {
          const received = await handleReceivePaymentPaid(invoice);

          if (received) {
            showToast({title: 'Payment received', type: 'success'});
          } else {
            showToast({title: 'Error receiving payment.', type: 'error'});
          }
        } else {
          showToast({title: 'Error receiving payment.', type: 'error'});
        }
      } else if (check?.state === MintQuoteState.ISSUED) {
        showToast({title: 'Invoice is paid.', type: 'success'});
        const invoicesUpdated = invoices.map((i) => {
          if (i?.quote === quote) {
            i.state = MintQuoteState.ISSUED;
            return i;
          }
          return i;
        });
        setInvoices(invoicesUpdated);
        const txUpdated = transactions.map((i) => {
          if (i?.quote === quote) {
            i.state = MintQuoteState.ISSUED;
            return i;
          }
          return i;
        });
        setTransactions(txUpdated);
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
        if (privateKey && publicKey) {
          const tokenEvent = await createTokenEvent({
            walletId,
            mint: activeMint,
            proofs: receive,
          });
          await createSpendingEvent({
            walletId,
            direction: 'in',
            amount: invoice.amount.toString(),
            unit: activeUnit,
            events: [{id: tokenEvent.id, marker: 'created'}],
          });
        }
        if (!proofsStorage && !proofs) {
          setProofsStorage([...receive]);
          setProofs([...receive]);
        } else {
          setProofsStorage([...proofs, ...receive]);
          setProofs([...proofs, ...receive]);
        }
        return receive;
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
                  <View style={styles.invoiceContainer}>
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
                  </View>
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
