import '../../../applyGlobalPolyfills';

import { getDecodedToken, GetInfoResponse, MintQuoteResponse, MintQuoteState } from '@cashu/cashu-ts';
import { addProofs, ICashuInvoice, useCashuStore, useNostrContext } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, { ChangeEvent, useState } from 'react';
import { Modal, SafeAreaView, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from 'react-native';

import { CloseIcon, CopyIconStack, ScanQrIcon } from '../../assets/icons';
import { Button, GenerateQRCode, Input, ScanQRCode } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import { useDialog, useToast } from '../../hooks/modals';
import { useCashuContext } from '../../providers/CashuProvider';
import { SelectedTab } from '../../types/tab';
import { getInvoices, storeInvoices } from '../../utils/storage_cashu';
// import GenerateQRCode from './qr/GenerateQRCode'; // Import the QR code component
// import ScanCashuQRCode from './qr/ScanCode';
import stylesheet from './styles';

interface ReceiveEcashProps {
  onClose: () => void;
}

export const ReceiveEcash: React.FC<ReceiveEcashProps> = ({ onClose }) => {
  type TabType = 'lightning' | 'ecash' | 'none';
  const tabs = ['lightning', 'ecash'] as const;
  const [activeTab, setActiveTab] = useState<TabType>('none');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const { ndkCashuWallet, ndkWallet } = useNostrContext();
  const {
    wallet,
    connectCashMint,
    connectCashWallet,
    requestMintQuote,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
    getMintInfo,
    mint,
    mintTokens,
    mintUrls,
    activeMintIndex,
    activeCurrency,
  } = useCashuContext();
  const [ecash, setEcash] = useState<string | undefined>();
  const { isSeedCashuStorage, setIsSeedCashuStorage } = useCashuStore();

  const styles = useStyles(stylesheet);

  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [infoMint, setMintInfo] = useState<GetInfoResponse | undefined>();
  const [qrCodeUrl, setQRCodeUrl] = useState<string | undefined>();
  const [mintsUrls, setMintUrls] = useState<string[]>(['https://mint.minibits.cash/Bitcoin']);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);

  const [generatedInvoice, setGeneratedInvoice] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const { theme } = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();

  const { showDialog, hideDialog } = useDialog();

  const { showToast } = useToast();

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LIGHTNING_NETWORK_WALLET,
  );

  const handleChangeEcash = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEcash(value);
  };

  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<boolean>(false);

  const generateInvoice = async () => {
    setIsGeneratingInvoice(true);
    const mintUrl = mintUrls?.[activeMintIndex]?.url;
    if (!mintUrl || !invoiceAmount) return;
    try {
      const cashuMint = await connectCashMint(mintUrl);
      const wallet = await connectCashWallet(cashuMint?.mint);

      const quote = await requestMintQuote(Number(invoiceAmount));
      setQuote(quote?.request);
      console.log('quote', quote);
      setIsLoading(true);
      setIsInvoiceModalVisible(false);
      const invoicesLocal = await getInvoices();

      const cashuInvoice: ICashuInvoice = {
        bolt11: quote?.request?.request,
        quote: quote?.request?.quote,
        state: quote?.request?.state ?? MintQuoteState.UNPAID,
        date: new Date().getTime(),
        amount: Number(invoiceAmount),
        mint: mintUrl,
        quoteResponse: quote?.request,
        unit: activeCurrency,
      };

      if (invoicesLocal) {
        const invoices: ICashuInvoice[] = JSON.parse(invoicesLocal);
        console.log('invoices', invoices);
        storeInvoices([...invoices, cashuInvoice]);
      } else {
        console.log('no old invoicesLocal', invoicesLocal);
        storeInvoices([cashuInvoice]);
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setIsLoading(false);
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
    showToast({ type: 'info', title: 'Copied to clipboard' });
  };

  const handleReceiveEcash = async () => {
    console.log('handleReceiveEcash', ecash);
    showToast({ title: 'Handle receive ecash', type: 'info' });

    try {
      console.log('ecash', ecash);
      if (!ecash) {
        return;
      }
      const encoded = getDecodedToken(ecash);
      console.log('encoded', encoded);

      console.log('wallet', wallet);

      const response = await wallet?.receive(encoded);
      console.log('response', response);

      if (response) {
        showToast({ title: 'ecash payment received', type: 'success' });
        await addProofs(response);
      }
    } catch (e) {
      console.log('handleReceiveEcash error', e);
    }
  };


  const handleReceiveEcashWithLink = async () => {
    try {
      if (!ecash) {
        return;
      }
      const encoded = getDecodedToken(ecash);
      console.log('encoded', encoded);

      const response = await wallet?.receive(encoded);
      console.log('response', response);

      if (response) {
        showToast({ title: 'ecash payment received', type: 'success' });
        await addProofs(response);
      }
    } catch (e) {
      console.log('handleReceiveEcash error', e);
    }
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

  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const handleQRCodeClick = () => {
    setIsScannerVisible(true);
  };

  const handleCloseScanner = () => {
    setIsScannerVisible(false);
  };

  const handleScanSuccess = () => {
    // setEcash(data);
    showToast({ title: 'Success', type: 'success' });
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
                    style={{ marginVertical: 3, display: 'flex', flexDirection: 'column', gap: 20 }}
                  >
                    <Text style={styles.text}>Invoice address</Text>


                    <Input
                      style={{width: '80%'}}
                      numberOfLines={1}
                      // ellipsizeMode="middle"
                      value={quote?.request ? `${quote.request.slice(0,15)}...${quote.request.slice(-15)}` : ''}
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
                          style={{ marginRight: 10 }}
                        >
                          <CopyIconStack color={theme.colors.primary} />
                        </TouchableOpacity>
                      }
                    />
                    <GenerateQRCode data={ecash} size={200} />
                  </View>
                )}
                <Button
                  onPress={handleReceiveEcash}
                  style={styles.modalActionButton}
                  textStyle={styles.modalActionButtonText}
                >
                  Receive ecash
                </Button>
              </>
              <Modal visible={isScannerVisible} onRequestClose={handleCloseScanner}>
                <ScanQRCode
                  onClose={handleCloseScanner}
                  onSuccess={handleScanSuccess}
                />
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
