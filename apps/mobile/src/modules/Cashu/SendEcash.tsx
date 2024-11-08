import '../../../applyGlobalPolyfills';

import {GetInfoResponse, MintQuoteResponse} from '@cashu/cashu-ts';
import {useCashu, useCashuStore, useNostrContext} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {ChangeEvent, useEffect, useState} from 'react';
import {SafeAreaView, TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from 'react-native';

import {CopyIconStack} from '../../assets/icons';
import {Button, Input} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import {usePayment} from '../../hooks/usePayment';
import {SelectedTab} from '../../types/tab';
import SendNostrContact from './SendContact';
import stylesheet from './styles';

interface SendEcashProps {
  onClose: () => void;
}

export const SendEcash: React.FC<SendEcashProps> = ({onClose}) => {
  type TabType = 'lightning' | 'ecash' | 'contact' | 'none';
  const tabs = ['lightning', 'ecash', 'contact'] as const;
  const [activeTab, setActiveTab] = useState<TabType>('none');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const {ndkCashuWallet, ndkWallet} = useNostrContext();
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
  } = useCashu();
  const [ecash, setEcash] = useState<string | undefined>();
  const [invoice, setInvoice] = useState<string | undefined>();
  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();

  const styles = useStyles(stylesheet);
  // const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")

  const [quote, setQuote] = useState<MintQuoteResponse | undefined>();
  const [infoMint, setMintInfo] = useState<GetInfoResponse | undefined>();
  const [mintsUrls, setMintUrls] = useState<string[]>(['https://mint.minibits.cash/Bitcoin']);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [zapAmount, setZapAmount] = useState('');
  const [zapRecipient, setZapRecipient] = useState('');

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);

  const [generatedInvoice, setGeneratedInvoice] = useState('');
  const [generatedEcash, setGenerateEcash] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<string>(String(0));
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const {theme} = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>();

  const {showDialog, hideDialog} = useDialog();
  const {handleGenerateEcash, handlePayInvoice} = usePayment();

  const {showToast} = useToast();

  const handleChangeEcash = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEcash(value);
  };
  useEffect(() => {
    (async () => {
      const mintUrl = mintUrls?.[activeMintIndex]?.url;
      if (!mintUrl) return;
      const info = await getMintInfo(mintUrl);
      setMintInfo(info);
    })();

    // (async () => {

    //   console.log("ndkCashuWallet", ndkCashuWallet)
    //   console.log("ndkWallet", ndkWallet)

    //   const availableTokens = await ndkCashuWallet?.availableTokens;
    //   console.log("availableTokens", availableTokens)

    //   const mintBalances = await ndkCashuWallet?.mintBalances;
    //   console.log("mintBalances", mintBalances)

    //   console.log("mintBalances", mintBalances)
    //   const wallets = await ndkWallet?.wallets;
    //   console.log("wallets", wallets)

    //   const balance = await ndkCashuWallet?.balance;

    //   console.log("balance", balance)

    //   if (mint) {
    //     const mintBalance = await ndkCashuWallet?.mintBalance(mint?.mintUrl);
    //     console.log("mintBalance", mintBalance)
    //   }

    // })();
  }, []);

  const handleEcash = async () => {
    console.log('handleEcash');

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
    console.log('ecash', ecash);
    setGeneratedInvoice(ecash);
    setGenerateEcash(ecash);
    return ecash;
  };

  const handleCopy = async (type: 'ecash') => {
    if (!generatedEcash) return;
    if (type == 'ecash') {
      await Clipboard.setStringAsync(generatedEcash);
    }
    //  else if (type == "seed") {
    //   if (newSeed) {
    //     await Clipboard.setStringAsync(newSeed);
    //   }

    // }
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'none':
        return (
          <SafeAreaView style={styles.modalTabsMainContainer}>
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
          <SafeAreaView style={styles.modalTabContentContainer}>
            <Text style={styles.modalTabContentTitle}>Pay Lightning</Text>
          </SafeAreaView>
        );
      case 'ecash':
        return (
          <SafeAreaView style={styles.modalTabContentContainer}>
            <Text style={styles.modalTabContentTitle}>Send Ecash</Text>
          </SafeAreaView>
        );
      case 'contact':
        return (
          <SafeAreaView style={styles.modalTabContentContainer}>
            <Text style={styles.modalTabContentTitle}>Send Contact</Text>
          </SafeAreaView>
        );
      default:
        return null;
    }
  };

  return renderTabContent();

  {
    /* <View>
          <View>
            <Text style={styles.text}>
              <span style={{fontWeight: 'bold'}}>Name:</span> {infoMint?.name}
            </Text>
            <Text style={styles.text}>
              <span style={{fontWeight: 'bold'}}>Description:</span> {infoMint?.description}
            </Text>
            <Text style={styles.text}>
              <span style={{fontWeight: 'bold'}}>MOTD:</span> {infoMint?.motd}
            </Text>
          </View>

          {activeTab == 'lightning' && (
            <>
              <TextInput
                placeholder="Invoice to paid"
                value={invoice}
                onChangeText={setInvoice}
                style={styles.input}
              ></TextInput>

              <Button onPress={() => handlePayInvoice(invoice)}>Pay invoice</Button>
            </>
          )}

          {activeTab == 'ecash' && (
            <>
              <TextInput
                placeholder="Amount"
                keyboardType="numeric"
                value={invoiceAmount}
                onChangeText={setInvoiceAmount}
                style={styles.input}
              />
              <Button
                onPress={handleEcash}
                // onPress={() =>  handleEcash}
              >
                Generate eCash
              </Button>

              {generatedEcash && (
                <View
                  style={{
                    marginVertical: 3,
                  }}
                >
                  <Text style={styles.text}>eCash token</Text>

                  <Input
                    value={generatedEcash}
                    editable={false}
                    right={
                      <TouchableOpacity
                        onPress={() => handleCopy('ecash')}
                        style={
                          {
                            // marginRight: 10,
                          }
                        }
                      >
                        <CopyIconStack color={theme.colors.primary} />
                      </TouchableOpacity>
                    }
                  />
                </View>
              )}
            </>
          )}

          {activeTab == 'contact' && (
            <>
              <SendNostrContact />
            </>
          )}
        </View> */
  }
};
