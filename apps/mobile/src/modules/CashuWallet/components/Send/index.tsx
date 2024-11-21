/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import {Picker} from '@react-native-picker/picker';
import {MintData} from 'afk_nostr_sdk/src/hooks/cashu/useCashu';
import * as Clipboard from 'expo-clipboard';
import {randomUUID} from 'expo-crypto';
import React, {useEffect, useState} from 'react';
import {Modal, SafeAreaView, TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from 'react-native';

import {CloseIcon, CopyIconStack, ScanQrIcon} from '../../../../assets/icons';
import {Button, GenerateQRCode, Input, ScanQRCode} from '../../../../components';
import {AnimatedToast} from '../../../../context/Toast/AnimatedToast';
import {ToastConfig} from '../../../../context/Toast/ToastContext';
import {useStyles, useTheme} from '../../../../hooks';
import {useToast} from '../../../../hooks/modals';
import {usePayment} from '../../../../hooks/usePayment';
import {
  useActiveMintStorage,
  useMintStorage,
  useProofsStorage,
} from '../../../../hooks/useStorageState';
import {useCashuContext} from '../../../../providers/CashuProvider';
import {UnitInfo} from '../../../Cashu/MintListCashu';
import SendNostrContact from '../../../Cashu/SendContact';
import stylesheet from './styles';

interface SendProps {
  onClose: () => void;
}

export const Send: React.FC<SendProps> = ({onClose}) => {
  type TabType = 'lightning' | 'ecash' | 'contact' | 'none';
  const tabs = ['lightning', 'ecash', 'contact'] as const;

  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const {showToast} = useToast();
  const {handleGenerateEcash, handlePayInvoice} = usePayment();

  const {getUnitBalance} = useCashuContext()!;

  const {value: activeMint} = useActiveMintStorage();
  const {value: mints} = useMintStorage();
  const {value: proofs} = useProofsStorage();

  const [activeTab, setActiveTab] = useState<TabType>('none');
  const [invoice, setInvoice] = useState<string | undefined>();
  const [generatedEcash, setGenerateEcash] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<string>(String(0));
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [mintUnitsMap, setMintUnitsMap] = useState<Map<string, UnitInfo[]>>(new Map());
  const [selectedMint, setSelectedMint] = useState<MintData>();
  const [selectedCurrency, setSelectedCurrency] = useState('sat');
  const [modalToast, setModalToast] = useState<ToastConfig | undefined>(undefined);
  const [showModalToast, setShowModalToast] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleEcash = async () => {
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
    setGenerateEcash(ecash);
    return ecash;
  };

  const handleCopy = async (type: 'ecash') => {
    if (!generatedEcash) return;
    if (type == 'ecash') {
      await Clipboard.setStringAsync(generatedEcash);
    }
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

  const handleLightningPayment = async () => {
    setIsPaymentProcessing(true);
    const key = randomUUID();
    if (!invoice) {
      setModalToast({
        title: 'Invoice not found.',
        type: 'error',
        key,
      });
      setShowModalToast(true);
      setIsPaymentProcessing(false);
      return;
    }
    const tokens = await handlePayInvoice(invoice);
    setIsPaymentProcessing(false);
    if (!tokens) {
      setModalToast({
        title: 'Error processing payment.',
        type: 'error',
        key,
      });
      setShowModalToast(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const mint = mints.filter((mint) => mint.url === activeMint)[0];
    setSelectedMint(mint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMint]);

  // Load units and their balances for each mint
  useEffect(() => {
    const loadMintUnits = async () => {
      const newMintUnitsMap = new Map<string, UnitInfo[]>();

      for (const mint of mints) {
        try {
          // Get balance for each unit
          const unitsWithBalance = await Promise.all(
            mint.units.map(async (unit) => {
              const balance = await getUnitBalance(unit, mint, proofs);
              return {
                unit,
                balance,
              };
            }),
          );

          newMintUnitsMap.set(mint.url, unitsWithBalance);
        } catch (error) {
          console.error(`Error loading units for mint ${mint.url}:`, error);
          newMintUnitsMap.set(mint.url, []);
        }
      }

      setMintUnitsMap(newMintUnitsMap);
    };

    loadMintUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mints, proofs]);

  const handleOnChangeSelectedMint = (newSelection: string) => {
    const newSelectedMint = mints.find((mint) => mint.url === newSelection);
    if (newSelectedMint) setSelectedMint(newSelectedMint);
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setInvoice(text);
      }
    } catch (error) {
      setShowModalToast(true);
      const key = randomUUID();
      setModalToast({type: 'error', title: 'Failed to paste content.', key});
    }
  };

  const handleQRCodeClick = () => {
    setIsScannerVisible(true);
  };

  const handleCloseScanner = () => {
    setIsScannerVisible(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'none':
        return (
          <SafeAreaView style={styles.modalTabsMainContainer}>
            <TouchableOpacity
              onPress={onClose}
              style={{position: 'absolute', top: 15, right: 15, zIndex: 2000}}
            >
              <CloseIcon width={30} height={30} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.tabContainer}>
              <Text style={styles.modalTabsTitle}>Send</Text>
              {tabs.map((tab) => (
                <TouchableOpacity key={tab} style={styles.tab} onPress={() => handleTabChange(tab)}>
                  <Text style={styles.tabText}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        );
      case 'lightning':
        return (
          <>
            <View style={styles.modalTabContentContainer}>
              <TouchableOpacity
                onPress={onClose}
                style={{position: 'absolute', top: 15, right: 15, zIndex: 2000}}
              >
                <CloseIcon width={30} height={30} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTabContentTitle}>Pay Lightning</Text>
              <>
                <TextInput
                  placeholder="Invoice to paid"
                  value={invoice}
                  onChangeText={setInvoice}
                  style={styles.input}
                />
                <View
                  style={{display: 'flex', gap: 10, flexDirection: 'row', alignItems: 'center'}}
                >
                  <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
                    <Text style={styles.pasteButtonText}>PASTE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleQRCodeClick} style={styles.qrButton}>
                    <ScanQrIcon width={40} height={40} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>

                <Button
                  onPress={handleLightningPayment}
                  style={styles.modalActionButton}
                  textStyle={styles.modalActionButtonText}
                  disabled={isPaymentProcessing}
                >
                  {isPaymentProcessing ? 'Processing...' : 'Pay invoice'}
                </Button>
              </>
            </View>
            <Modal visible={isScannerVisible} onRequestClose={handleCloseScanner}>
              <ScanQRCode onClose={handleCloseScanner} onSuccess={onClose} />
            </Modal>
          </>
        );
      case 'ecash':
        return (
          <>
            <View style={styles.modalTabContentContainer}>
              <TouchableOpacity
                onPress={onClose}
                style={{position: 'absolute', top: 15, right: 15, zIndex: 2000}}
              >
                <CloseIcon width={30} height={30} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTabContentTitle}>Send Ecash</Text>
              <>
                <Text style={styles.modalTabLabel}>Select Mint</Text>
                <Picker
                  selectedValue={selectedMint?.url}
                  style={[
                    styles.picker,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.inputText,
                      paddingVertical: 5,
                      paddingHorizontal: 8,
                      width: '80%',
                    },
                  ]}
                  onValueChange={(newSelectedMint) => handleOnChangeSelectedMint(newSelectedMint)}
                >
                  {mints.map((mint) => (
                    <Picker.Item
                      key={mint.url}
                      label={mint.url}
                      value={mint.url}
                      color={theme.colors.inputText}
                    />
                  ))}
                </Picker>
                <Text style={styles.modalTabLabel}>Select Currency</Text>
                <Picker
                  selectedValue={selectedCurrency}
                  style={[
                    styles.picker,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.inputText,
                      paddingVertical: 5,
                      paddingHorizontal: 8,
                      width: '80%',
                    },
                  ]}
                  onValueChange={setSelectedCurrency}
                >
                  {selectedMint
                    ? mintUnitsMap
                        .get(selectedMint?.url)
                        ?.map((unitInfo) => (
                          <Picker.Item
                            key={unitInfo.unit}
                            label={unitInfo.unit.toUpperCase()}
                            value={unitInfo.unit}
                            color={theme.colors.inputText}
                          />
                        ))
                    : null}
                </Picker>
                <Text style={styles.modalTabLabel}>Amount</Text>
                <TextInput
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={invoiceAmount}
                  onChangeText={setInvoiceAmount}
                  style={styles.input}
                />
                <Button
                  onPress={handleEcash}
                  style={styles.modalActionButton}
                  textStyle={styles.modalActionButtonText}
                >
                  Generate eCash
                </Button>

                {generatedEcash && (
                  <View
                    style={{
                      marginVertical: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 15,
                    }}
                  >
                    <Text style={styles.text}>eCash token</Text>
                    <Input
                      value={generatedEcash}
                      editable={false}
                      right={
                        <TouchableOpacity onPress={() => handleCopy('ecash')}>
                          <CopyIconStack color={theme.colors.primary} />
                        </TouchableOpacity>
                      }
                    />
                    <GenerateQRCode data={generatedEcash} size={200} />
                  </View>
                )}
              </>
            </View>
          </>
        );
      case 'contact':
        return (
          <>
            <View style={styles.modalTabContentContainer}>
              <TouchableOpacity
                onPress={onClose}
                style={{position: 'absolute', top: 15, right: 15, zIndex: 2000}}
              >
                <CloseIcon width={30} height={30} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTabContentTitle}>Send Contact</Text>
              {/* todo */}
              <SendNostrContact />
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderTabContent()}
      {showModalToast && modalToast ? (
        <View style={styles.toastContainer}>
          <AnimatedToast
            key={modalToast.key}
            toast={modalToast}
            hide={() => setShowModalToast(false)}
          />
        </View>
      ) : null}
    </>
  );
};
