import '../../../../../applyGlobalPolyfills';

import {MintQuoteState} from '@cashu/cashu-ts';
import {ICashuInvoice} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {useEffect, useState} from 'react';
import {FlatList, Modal, TouchableOpacity, View} from 'react-native';
import {Text} from 'react-native';

import {CopyIconStack, InfoIcon, ViewIcon} from '../../../../assets/icons';
import {Button, Divider} from '../../../../components';
import {useStyles, useTheme} from '../../../../hooks';
import {useToast} from '../../../../hooks/modals';
import {useTransactionsStorage} from '../../../../hooks/useStorageState';
import {getRelativeTime} from '../../../../utils/helpers';
import stylesheet from './styles';

export const History = () => {
  const styles = useStyles(stylesheet);
  const {theme} = useTheme();
  const {showToast} = useToast();

  const [txInvoices, setTxInvoices] = useState<ICashuInvoice[]>([]);
  const [selectedTx, setSelectedTx] = useState<string>('');

  const {value: transactions} = useTransactionsStorage();

  useEffect(() => {
    console.log(transactions);
    const handleGetInvoices = async () => {
      if (transactions) {
        const invoicesPaid = transactions.filter(
          (i) => i?.state === MintQuoteState?.ISSUED || i?.state === MintQuoteState.PAID,
        );
        const invoicesSorted = invoicesPaid
          .map((invoice) => ({...invoice} as ICashuInvoice))
          .reverse();
        setTxInvoices([...invoicesSorted]);
      }
    };
    handleGetInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

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
