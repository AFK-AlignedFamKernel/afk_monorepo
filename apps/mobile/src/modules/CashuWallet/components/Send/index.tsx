/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import { Picker } from '@react-native-picker/picker';
import { MintData, useGetCashuTokenEvents } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import { randomUUID } from 'expo-crypto';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { CloseIcon, CopyIconStack, ScanQrIcon, ShareIcon } from '../../../../assets/icons';
import { Button, GenerateQRCode, Input, ScanQRCode } from '../../../../components';
import { AnimatedToast } from '../../../../context/Toast/AnimatedToast';
import { ToastConfig } from '../../../../context/Toast/ToastContext';
import { useAtomiqLab, useStyles, useTheme } from '../../../../hooks';
import { usePayment } from '../../../../hooks/usePayment';
import {
  useActiveMintStorage,
  useActiveUnitStorage,
  useMintStorage,
  useProofsStorage,
} from '../../../../hooks/useStorageState';
import { useCashuContext } from '../../../../providers/CashuProvider';
import { UnitInfo } from '../Mints/MintListCashu';
import SendNostrContact from './SendContact';
import stylesheet from './styles';
import { useToast } from 'src/hooks/modals';
import { Proof } from '@cashu/cashu-ts';
import { proofsSpentsApi } from 'src/utils/database';

interface SendProps {
  onClose: () => void;
}

export const Send: React.FC<SendProps> = ({ onClose }) => {
  type TabType = 'lightning' | 'ecash' | 'contact' | 'none';
  const tabs = ['lightning', 'ecash', 'contact'] as const;

  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const { handleGenerateEcash, handlePayInvoice } = usePayment();

  const { getUnitBalance, setActiveMint, setActiveUnit } = useCashuContext()!;
  const { data: tokensEvents } = useGetCashuTokenEvents();

  const { value: activeMint, setValue: setActiveMintStorage } = useActiveMintStorage();
  const { value: mints } = useMintStorage();
  const { value: proofs } = useProofsStorage();
  const { setValue: setActiveUnitStorage } = useActiveUnitStorage();

  const { handlePayInvoice:handlePayInvoiceAtomiq } = useAtomiqLab();
  const { showToast } = useToast();
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
  const [isGeneratingEcash, setIsGeneratingEcash] = useState(false);
  const [type, setType] = useState<"CASHU" | "STRK">("CASHU")

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleEcash = async () => {
    setIsGeneratingEcash(true);
    const key = randomUUID();
    if (!invoiceAmount) {
      setModalToast({
        title: 'Enter amount.',
        type: 'error',
        key,
      });
      setShowModalToast(true);
      setIsGeneratingEcash(false);
      return;
    }

    console.log("try generate ecash");


    const proofsMap: Proof[] = proofs || [];
    let eventsProofs = tokensEvents?.pages[0]?.map((event:any) => {
      // let eventContent = JSON.parse(event.content);
      let eventContent = event.content;
      eventContent?.proofs?.map((proof: any) => {
        proofsMap.push(proof);
        return proof;
      })
    })

    
    console.log("handle parents proofsMap", proofsMap)
    const {cashuToken, proofsToSend} = await handleGenerateEcash(Number(invoiceAmount), proofsMap);
    console.log("ecash generated", cashuToken)

    proofsToSend.map((proof) => {
      proofsSpentsApi.add(proof)
    })
    if (!cashuToken) {
      setModalToast({
        title: 'Error generating ecash token.',
        type: 'error',
        key,
      });
      setShowModalToast(true);
      setIsGeneratingEcash(false);
      return;
    }
    setGenerateEcash(cashuToken);
    setIsGeneratingEcash(false);
    return cashuToken;
  };

  const handleCopy = async (type: 'ecash' | 'link') => {
    if (!generatedEcash) return;
    if (type == 'ecash') {
      await Clipboard.setStringAsync(generatedEcash);
    } else if (type === 'link') {
      const baseUrl = window.location.origin;
      await Clipboard.setStringAsync(`${baseUrl}/app/receive/ecash/${generatedEcash}`);
    }
    const key = randomUUID();
    setModalToast({
      title: 'Copied to clipboard.',
      type: 'info',
      key,
    });
    setShowModalToast(true);
  };

  const handleLightningPayment = async () => {
    setIsPaymentProcessing(true);
    try {

      if (type == "STRK") {
        const res = await handlePayInvoiceAtomiq(invoice)
        console.log("res", res)
        setIsPaymentProcessing(false);
        if (res) {
          showToast({ title: 'Payment sent', type: 'success' });
        } else {
          
        }
      } else {
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
        const { meltResponse } = await handlePayInvoice(invoice);
        setIsPaymentProcessing(false);
        if (!meltResponse) {
          setModalToast({
            title: 'Error processing payment.',
            type: 'error',
            key,
          });
          setShowModalToast(true);
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.log("handleLightningPayment error", error)
      showToast({ title: 'Error processing payment.', type: 'error' });
    } finally {
      setIsPaymentProcessing(false);
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
    if (newSelectedMint) {
      setSelectedMint(newSelectedMint);
      setActiveMint(newSelectedMint.url);
      setActiveMintStorage(newSelectedMint.url);
    }
  };

  const handleOnChangeSelectedUnit = (newUnit: string) => {
    setSelectedCurrency(newUnit);
    setActiveUnitStorage(newUnit);
    setActiveUnit(newUnit);
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
      setModalToast({ type: 'error', title: 'Failed to paste content.', key });
    }
  };

  const handleQRCodeClick = () => {
    setIsScannerVisible(true);
  };

  const handleCloseScanner = () => {
    setIsScannerVisible(false);
  };

  const handleReset = () => {
    setGenerateEcash('');
    setIsGeneratingEcash(false);
    setInvoiceAmount('0');
  };

  const shareLink = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web sharing for link
        if (navigator.share) {
          await navigator.share({
            title: 'Share AFK Gift Link',
            url: `/app/receive/ecash/${generatedEcash}`,
          });
        } else {
          // Fallback for browsers that don't support Web Share API
          const baseUrl = window.location.origin;
          await navigator.clipboard.writeText(`${baseUrl}/app/receive/ecash/${generatedEcash}`);
          const key = randomUUID();
          setShowModalToast(true);
          setModalToast({ type: 'success', title: 'Link copied to clipboard.,', key });
        }
      } else {
        // Mobile sharing for link
        const baseUrl = window.location.origin;
        await Share.share({
          title: 'Share AFK Gift Link',
          message: `${baseUrl}/receive/ecash/${generatedEcash}`,
          url: `/receive/ecash/${generatedEcash}`, // iOS only
        });
      }
    } catch (error) {
      console.error('Error sharing link:', error);
      const key = randomUUID();
      setShowModalToast(true);
      setModalToast({ type: 'error', title: 'Error sharing.', key });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'none':
        return (
          <SafeAreaView style={styles.modalTabsMainContainer}>
            <TouchableOpacity
              onPress={onClose}
              style={{ position: 'absolute', top: 15, right: 15, zIndex: 2000 }}
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
            <ScrollView style={styles.modalTabContentContainer}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modalTabContentContainerChildren}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{ position: 'absolute', top: 15, right: 15, zIndex: 2000 }}
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
                  style={{ display: 'flex', gap: 10, flexDirection: 'row', alignItems: 'center' }}
                >
                  <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
                    <Text style={styles.pasteButtonText}>PASTE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleQRCodeClick} style={styles.qrButton}>
                    <ScanQrIcon width={40} height={40} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.text}>{type}</Text>

                <Switch value={type == "STRK"} onValueChange={() => {
                  if (type == "CASHU") {
                    setType("STRK")
                  } else {
                    setType("CASHU")
                  }
                }} > {type}</Switch>


                <Button
                  onPress={handleLightningPayment}
                  style={styles.modalActionButton}
                  textStyle={styles.modalActionButtonText}
                  disabled={isPaymentProcessing}
                >
                  {isPaymentProcessing ? 'Processing...' : 'Pay invoice'}
                </Button>
              </>
            </ScrollView>
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
                style={{ position: 'absolute', top: 15, right: 15, zIndex: 2000 }}
              >
                <CloseIcon width={30} height={30} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTabContentTitle}>Send Ecash</Text>
              <>
                {!generatedEcash ? (
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
                      onValueChange={(newSelectedMint) =>
                        handleOnChangeSelectedMint(newSelectedMint)
                      }
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
                      onValueChange={(newSelectedUnit) =>
                        handleOnChangeSelectedUnit(newSelectedUnit)
                      }
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
                      disabled={isGeneratingEcash}
                    >
                      {isGeneratingEcash ? 'Generating...' : 'Generate eCash'}
                    </Button>
                  </>
                ) : (
                  <View
                    style={{
                      marginVertical: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 15,
                      width: '70%',
                    }}
                  >
                    <Text style={styles.text}>eCash token</Text>
                    <Input
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.inputText,
                      paddingVertical: 5,
                      paddingHorizontal: 8,
                      width: '100%',
                    }}
                      value={generatedEcash}
                      editable={false}
                      right={
                        <TouchableOpacity onPress={() => handleCopy('ecash')}>
                          <CopyIconStack color={theme.colors.primary} />
                        </TouchableOpacity>
                      }
                    />
                    <GenerateQRCode data={generatedEcash} size={200} />
                    <View style={styles.shareContainer}>
                      <Text style={styles.giftLinkText}>Gift this ecash?</Text>
                      <View style={styles.shareLinkButtons}>
                        <Button
                          onPress={shareLink}
                          style={styles.modalShareButton}
                          textStyle={styles.modalShareButtonText}
                        >
                          Share Link
                          <ShareIcon
                            width={20}
                            height={20}
                            color={theme.colors.primary}
                            style={styles.shareIcon}
                          />
                        </Button>
                        <Button
                          onPress={() => handleCopy('link')}
                          style={styles.modalShareButton}
                          textStyle={styles.modalShareButtonText}
                        >
                          Copy link
                          <CopyIconStack
                            width={20}
                            height={20}
                            color={theme.colors.primary}
                            style={styles.shareIcon}
                          />
                        </Button>
                      </View>
                    </View>
                    <Button
                      onPress={handleReset}
                      style={styles.modalActionButton}
                      textStyle={styles.modalActionButtonText}
                    >
                      New Amount
                    </Button>
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
                style={{ position: 'absolute', top: 15, right: 15, zIndex: 2000 }}
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
