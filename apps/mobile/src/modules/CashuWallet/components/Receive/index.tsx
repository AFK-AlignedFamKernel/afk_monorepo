/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import { MintQuoteResponse, MintQuoteState } from '@cashu/cashu-ts';
import { ICashuInvoice } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import { randomUUID } from 'expo-crypto';
import React, { useState } from 'react';
import { Modal, SafeAreaView, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from 'react-native';

import { CloseIcon, CopyIconStack, ScanQrIcon } from '../../../../assets/icons';
import { Button, GenerateQRCode, Input, ScanQRCode } from '../../../../components';
import { AnimatedToast } from '../../../../context/Toast/AnimatedToast';
import { ToastConfig } from '../../../../context/Toast/ToastContext';
import { useStyles, useTheme } from '../../../../hooks';
import { usePayment } from '../../../../hooks/usePayment';
import {
  useActiveMintStorage,
  useActiveUnitStorage,
  useInvoicesStorage,
} from '../../../../hooks/useStorageState';
import { useCashuContext } from '../../../../providers/CashuProvider';
import stylesheet from './styles';
import { useToast } from '../../../../hooks/modals';

interface ReceiveProps {
  onClose: () => void;
}

export const Receive: React.FC<ReceiveProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const { showToast } = useToast();
  const { handleReceiveEcash } = usePayment();
  const { requestMintQuote } = useCashuContext()!;

  type TabType = 'lightning' | 'ecash' | 'none';
  const tabs = ['lightning', 'ecash'] as const;

  const [activeTab, setActiveTab] = useState<TabType>('none');
  const [ecash, setEcash] = useState<string | undefined>();
  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<boolean>(false);
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [modalToast, setModalToast] = useState<ToastConfig | undefined>(undefined);
  const [showModalToast, setShowModalToast] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { value: activeMint } = useActiveMintStorage();
  const { value: invoices, setValue: setInvoices } = useInvoicesStorage();
  const { value: activeUnit } = useActiveUnitStorage();

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const generateInvoice = async () => {
    setIsGeneratingInvoice(true);
    if (!activeMint || !invoiceAmount) {
      throw new Error('Active mint or invoice amount is not available.');
    }
    try {
      const quote = await requestMintQuote(Number(invoiceAmount));
      setQuote(quote?.request);

      const cashuInvoice: ICashuInvoice = {
        bolt11: quote?.request?.request,
        quote: quote?.request?.quote,
        state: quote?.request?.state ?? MintQuoteState.UNPAID,
        date: new Date().getTime(),
        amount: Number(invoiceAmount),
        mint: activeMint,
        quoteResponse: quote?.request,
        unit: activeUnit,
      };

      if (invoices) {
        setInvoices([...invoices, cashuInvoice]);
      } else {
        setInvoices([cashuInvoice]);
      }
      setIsInvoiceGenerated(true);
    } catch (error) {
      setShowModalToast(true);
      const key = randomUUID();
      setModalToast({ type: 'error', title: 'Error generating invoice.', key });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleReset = () => {
    setInvoiceAmount('');
    setIsInvoiceGenerated(false);
    setIsGeneratingInvoice(false);
  };

  const handleCopy = async (type: 'lnbc' | 'ecash') => {
    if (!quote?.request) return;
    if (type == 'lnbc') {
      await Clipboard.setStringAsync(
        type === 'lnbc' ? quote?.request?.toString() : quote?.request?.toString(),
      );
    } else if (type == 'ecash') {
      if (ecash) {
        await Clipboard.setStringAsync(ecash);
      }
    }
    setShowModalToast(true);
    const key = randomUUID();
    setModalToast({ type: 'info', title: 'Copied to clipboard', key });
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setEcash(text);
      }
    } catch (error) {
      console.error('Failed to paste content:', error);
    }
  };

  const handleQRCodeClick = () => {
    setIsScannerVisible(true);
  };

  const handleCloseScanner = () => {
    setIsScannerVisible(false);
  };

  const handleEcashPayment = async (ecash?: string) => {
    setIsProcessing(true);
    console.log('handleEcashPayment', ecash);
    showToast({ title: 'Handle receive ecash', type: 'info' });

    const response = await handleReceiveEcash(ecash);
    console.log('response', response);
    setIsProcessing(false);
    if (!response) {
      const key = randomUUID();
      setModalToast({ type: 'error', title: 'Error processing payment.', key });
      setShowModalToast(true);
      return;
    } else {
      showToast({ title: 'Handle receive ecash', type: 'info' });

    }
    onClose();
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
              <Text style={styles.modalTabsTitle}>Receive</Text>
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
                style={{ position: 'absolute', top: 15, right: 15, zIndex: 2000 }}
              >
                <CloseIcon width={30} height={30} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTabContentTitle}>Create Invoice</Text>
              <>
                {!isInvoiceGenerated ? (
                  <>
                    <TextInput
                      placeholder="Amount"
                      keyboardType="numeric"
                      value={invoiceAmount}
                      onChangeText={setInvoiceAmount}
                      style={styles.input}
                    />

                    <Button
                      onPress={generateInvoice}
                      style={styles.modalActionButton}
                      disabled={isGeneratingInvoice}
                      textStyle={styles.modalActionButtonText}
                    >
                      {isGeneratingInvoice ? 'Generating...' : 'Generate invoice'}
                    </Button>
                  </>
                ) : null}

                {quote?.request && isInvoiceGenerated ? (
                  <View
                    style={{ marginVertical: 3, display: 'flex', flexDirection: 'column', gap: 20 }}
                  >
                    <Text style={styles.text}>Invoice address</Text>

                    <Input
                      value={quote?.request}
                      editable={false}
                      right={
                        <TouchableOpacity
                          onPress={() => handleCopy('lnbc')}
                          style={{ marginRight: 10 }}
                        >
                          <CopyIconStack color={theme.colors.primary} />
                        </TouchableOpacity>
                      }
                    />
                    <GenerateQRCode data={quote?.request} size={200} />
                    <Button
                      onPress={handleReset}
                      style={styles.modalActionButton}
                      textStyle={styles.modalActionButtonText}
                    >
                      Create another invoice
                    </Button>
                  </View>
                ) : null}
              </>
            </View>
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
              <Text style={styles.modalTabContentTitle}>Receive Ecash</Text>
              <>
                <TextInput
                  placeholder="Enter token: cashuXYZ"
                  value={ecash}
                  onChangeText={setEcash}
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
                <Button
                  onPress={() => handleEcashPayment(ecash)}
                  style={styles.modalActionButton}
                  textStyle={styles.modalActionButtonText}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Receive ecash'}
                </Button>
              </>
              <Modal visible={isScannerVisible} onRequestClose={handleCloseScanner}>
                <ScanQRCode onClose={handleCloseScanner} onSuccess={onClose} />
              </Modal>
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
