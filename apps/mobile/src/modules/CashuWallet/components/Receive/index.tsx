/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../../../applyGlobalPolyfills';

import {MintQuoteResponse, MintQuoteState} from '@cashu/cashu-ts';
import {ICashuInvoice} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {useState} from 'react';
import {Modal, SafeAreaView, TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from 'react-native';

import {CloseIcon, CopyIconStack, ScanQrIcon} from '../../../../assets/icons';
import {Button, Input} from '../../../../components';
import {useStyles, useTheme} from '../../../../hooks';
import {useToast} from '../../../../hooks/modals';
import {
  useActiveMintStorage,
  useActiveUnitStorage,
  useInvoicesStorage,
} from '../../../../hooks/useStorageState';
import {useCashuContext} from '../../../../providers/CashuProvider';
import GenerateQRCode from '../../../Cashu/qr/GenerateQRCode';
import ScanCashuQRCode from '../../../Cashu/qr/ScanCode';
import stylesheet from './styles';

interface ReceiveProps {
  onClose: () => void;
}

export const Receive: React.FC<ReceiveProps> = ({onClose}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const {showToast} = useToast();

  const {requestMintQuote} = useCashuContext()!;

  type TabType = 'lightning' | 'ecash' | 'none';
  const tabs = ['lightning', 'ecash'] as const;

  const [activeTab, setActiveTab] = useState<TabType>('none');
  const [ecash, setEcash] = useState<string | undefined>();
  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<boolean>(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const {value: activeMint} = useActiveMintStorage();
  const {value: invoices, setValue: setInvoices} = useInvoicesStorage();
  const {value: activeUnit} = useActiveUnitStorage();

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const generateInvoice = async () => {
    setIsGeneratingInvoice(true);
    if (!activeMint || !invoiceAmount) return;
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
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setIsGeneratingInvoice(false);
    }
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
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

  //   const handleReceiveEcash = async () => {
  //     try {
  //       if (!ecash) {
  //         return;
  //       }
  //       const encoded = getDecodedToken(ecash);
  //       console.log('encoded', encoded);

  //       const response = await wallet?.receive(encoded);
  //       console.log('response', response);

  //       if (response) {
  //         showToast({title: 'ecash payment received', type: 'success'});
  //         await addProofs(response);
  //       }
  //     } catch (e) {
  //       console.log('handleReceiveEcash error', e);
  //     }
  //   };

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
                style={{position: 'absolute', top: 15, right: 15, zIndex: 2000}}
              >
                <CloseIcon width={30} height={30} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTabContentTitle}>Create Invoice</Text>
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

                {quote?.request && (
                  <View
                    style={{marginVertical: 3, display: 'flex', flexDirection: 'column', gap: 20}}
                  >
                    <Text style={styles.text}>Invoice address</Text>

                    <Input
                      value={quote?.request}
                      editable={false}
                      right={
                        <TouchableOpacity
                          onPress={() => handleCopy('lnbc')}
                          style={{marginRight: 10}}
                        >
                          <CopyIconStack color={theme.colors.primary} />
                        </TouchableOpacity>
                      }
                    />
                    {/* todo */}
                    <GenerateQRCode data={quote?.request} size={200} />
                  </View>
                )}
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
                style={{position: 'absolute', top: 15, right: 15, zIndex: 2000}}
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
                  style={{display: 'flex', gap: 10, flexDirection: 'row', alignItems: 'center'}}
                >
                  <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
                    <Text style={styles.pasteButtonText}>PASTE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleQRCodeClick} style={styles.qrButton}>
                    <ScanQrIcon width={40} height={40} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                {ecash && (
                  <View
                    style={{
                      marginVertical: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 20,
                      marginBottom: 20,
                    }}
                  >
                    <Text style={styles.text}>TOKEN</Text>

                    <Input
                      value={ecash}
                      editable={false}
                      right={
                        <TouchableOpacity
                          onPress={() => handleCopy('ecash')}
                          style={{marginRight: 10}}
                        >
                          <CopyIconStack color={theme.colors.primary} />
                        </TouchableOpacity>
                      }
                    />
                    <GenerateQRCode data={ecash} size={200} />
                  </View>
                )}
                <Button
                  //   onPress={handleReceiveEcash}
                  style={styles.modalActionButton}
                  textStyle={styles.modalActionButtonText}
                >
                  Receive ecash
                </Button>
              </>
              <Modal visible={isScannerVisible} onRequestClose={handleCloseScanner}>
                {/* todo */}
                <ScanCashuQRCode onClose={handleCloseScanner} />
              </Modal>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return renderTabContent();
};
