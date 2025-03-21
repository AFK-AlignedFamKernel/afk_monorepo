/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '../../../applyGlobalPolyfills';

import { NostrKeyManager, useAuth, useCashu, useCashuStore, useCreateWalletEvent, useGetCashuTokenEvents } from 'afk_nostr_sdk';
import { getRandomBytes, randomUUID } from 'expo-crypto';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { Modal, Text } from 'react-native';
import PolyfillCrypto from 'react-native-webview-crypto';

import { ChevronLeftIcon, ScanQrIcon, SettingsIcon } from '../../assets/icons';
import { Button, ScanQRCode } from '../../components';
import { ContactsRow } from '../../components/ContactsRow';
import TabSelector from '../../components/TabSelector';
import { useStyles, useTheme } from '../../hooks';
import {
  useActiveMintStorage,
  useActiveUnitStorage,
  useMintStorage,
  usePrivKeySignerStorage,
  useProofsStorage,
  useWalletIdStorage,
} from '../../hooks/useStorageState';
import { useCashuContext } from '../../providers/CashuProvider';
import { SelectedTab, TABS_CASHU } from '../../types/tab';
import { ContactList } from '../Contacts/ContactList';
import { Balance } from './components/Balance';
import { History } from './components/History';
import { Invoices } from './components/Invoices';
import { Mints } from './components/Mints';
import { NoMintBanner } from './components/NoMintBanner';
import { Receive } from './components/Receive';
import { Send } from './components/Send';
import { Settings } from './components/Settings';
import stylesheet from './styles';
import NfcPayment from '../NfcPayment';
import { NfcIcon } from 'src/assets/icons';

export const CashuWalletView: React.FC = () => {
  return (
    <ScrollView>
      <PolyfillCrypto />
      <CashuView />
    </ScrollView>
  );
};

export const CashuView = () => {
  // styles
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);

  const { seed, setSeed } = useCashuStore();

  // states
  const [isOpenContactManagement, setIsOpenContactManagement] = useState(false);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.CASHU_MINT);
  const [showMore, setShowMore] = useState<boolean>(true);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState<boolean>(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [addingMint, setAddingMint] = useState<boolean>(false);
  const [nfcModalOpen, setNfcModalOpen] = useState<boolean>(false);
  const [nfcMode, setNfcMode] = useState<'send' | 'receive'>('send');

  const { value: mints, setValue: setMintsStorage } = useMintStorage();
  const { value: activeMint, setValue: setActiveMintStorage } = useActiveMintStorage();
  const { value: activeUnit, setValue: setActiveUnitStorage } = useActiveUnitStorage();
  const { value: proofs } = useProofsStorage();
  const { setValue: setPrivKey } = usePrivKeySignerStorage();
  const { setValue: setWalletId } = useWalletIdStorage();

  //context
  const { buildMintData, setMints, setActiveMint, setActiveUnit, setProofs } = useCashuContext()!;
  const { publicKey, privateKey } = useAuth();

  const { mutateAsync: createWalletEvent } = useCreateWalletEvent();

  useEffect(() => {
    setMints(mints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mints]);

  useEffect(() => {
    setActiveMint(activeMint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMint]);

  useEffect(() => {
    setActiveUnit(activeUnit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUnit]);

  useEffect(() => {
    setProofs(proofs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proofs]);

  const tokenCashuEvents = useGetCashuTokenEvents()

  console.log("cashuView")
  console.log('tokenCashuEvents', tokenCashuEvents);


  // functions
  const handleCloseContactManagement = () => {
    setIsOpenContactManagement(!isOpenContactManagement);
  };

  const handleQRCodeClick = () => {
    setIsScannerVisible(true);
  };

  const handleCloseScanner = () => {
    setIsScannerVisible(false);
  };

  const handleTabSelected = (tab: string | SelectedTab) => {
    setSelectedTab(tab as any);
  };

  const onOpenSendModal = () => {
    setSendModalOpen(true);
  };

  useEffect(() => {
    console.log("seed", seed)

    const handleSeed = async () => {
      const nostrAccountStr = await NostrKeyManager.getAccountConnected();
      const nostrAccount = JSON.parse(nostrAccountStr);
      console.log("nostrAccount", nostrAccount)

      if (nostrAccount && nostrAccount?.seed) {

        const seedUint = Buffer.from(nostrAccount?.seed, 'hex');
        setSeed(seedUint)
      }
    }

    if (!seed && publicKey && privateKey) {
      handleSeed()
    }
  }, [seed, publicKey, privateKey])

  const onOpenReceiveModal = () => {
    setReceiveModalOpen(true);
  };

  const handleAddDefaultMint = async () => {
    setAddingMint(true);
    const defaultMintUrl = 'https://mint.minibits.cash/Bitcoin';
    const defaultMintAlias = 'Default Mint (minibits)';
    setActiveMintStorage(defaultMintUrl);
    const data = await buildMintData(defaultMintUrl, defaultMintAlias);
    setActiveUnitStorage(data.units[0]);
    setMintsStorage([data]);
    setAddingMint(false);

    const nostrAccountStr = await NostrKeyManager.getAccountConnected();
    const nostrAccount = JSON.parse(nostrAccountStr);
    console.log("nostrAccount", nostrAccount)

    const id = randomUUID();
    setWalletId(id);
    if (nostrAccount && nostrAccount?.seed) {

      setSeed(Buffer.from(nostrAccount?.seed, 'hex'))
      // NostrKeyManager.setAccountConnected(nostrAccount)
      // nostr event
      await createWalletEvent({
        name: id,
        mints: mints.map((mint) => mint.url),
        privkey: nostrAccount?.seed,
      });
      return;
    }
    const privKey = getRandomBytes(32);
    const privateKeyHex = Buffer.from(privKey).toString('hex');
    setPrivKey(privateKeyHex);

    if (publicKey && privateKey) {
      // nostr event
      await createWalletEvent({
        name: id,
        mints: mints.map((mint) => mint.url),
        privkey: privateKeyHex,
      });
    }
  };

  const handleOpenNfcModal = (mode: 'send' | 'receive') => {
    setNfcMode(mode);
    setNfcModalOpen(true);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {mints.length > 0 ? (
            <>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setSettingsModalOpen(true)}
              >
                <SettingsIcon color={theme.colors.primary} width={20} height={20} />
              </TouchableOpacity>
              <Balance />
              <View style={styles.actionsContainer}>
                <View style={styles.actionButtonsContainer}>
                  <Button
                    onPress={onOpenSendModal}
                    style={styles.actionButton}
                    textStyle={styles.actionButtonText}
                  >
                    Send
                  </Button>
                    <View>
                    <Button onPress={handleQRCodeClick} style={styles.qrButton}>
                      <ScanQrIcon width={60} height={60} color={theme.colors.primary} />
                    </Button>
                    {/* <Button onPress={() => handleOpenNfcModal('send')} style={styles.qrButton}>
                      <NfcIcon width={60} height={60} color={theme.colors.primary} />
                    </Button> */}
                  </View>
                  <Button
                    onPress={onOpenReceiveModal}
                    style={styles.actionButton}
                    textStyle={styles.actionButtonText}
                  >
                    Receive
                  </Button>
                </View>
                {/* <View style={styles.nfcButtonsContainer}>
                  <Button 
                    onPress={() => handleOpenNfcModal('send')}
                    style={styles.nfcButton}
                    textStyle={styles.actionButtonText}
                  >
                    Send via NFC
                  </Button>
                  <Button 
                    onPress={() => handleOpenNfcModal('receive')}
                    style={styles.nfcButton}
                    textStyle={styles.actionButtonText}
                  >
                    Receive via NFC
                  </Button>
                </View> */}
              </View>
            </>
          ) : (
            <NoMintBanner onClick={handleAddDefaultMint} addingMint={addingMint} />
          )}

          <View>
            <Button
              style={styles.moreButton}
              textStyle={styles.moreButtonText}
              right={
                <ChevronLeftIcon
                  width={15}
                  height={15}
                  color={theme.colors.primary}
                  style={showMore ? styles.lessButtonIcon : styles.moreButtonIcon}
                />
              }
              onPress={() => {
                setShowMore((prev) => !prev);
                if (!showMore) {
                  setSelectedTab(SelectedTab?.CASHU_MINT);
                } else {
                  setSelectedTab(undefined);
                }
              }}
            >
              {showMore ? 'Show less' : 'Show more'}
            </Button>
          </View>

          {showMore ? (
            <TabSelector
              activeTab={selectedTab}
              handleActiveTab={handleTabSelected}
              buttons={TABS_CASHU}
              addScreenNavigation={false}
              containerStyle={styles.tabsContainer}
              tabStyle={styles.tabs}
              tabTextStyle={styles.tabText}
              activeTabStyle={styles.active}
              useDefaultStyles={false}
            />
          ) : null}

          {selectedTab == SelectedTab?.CONTACTS ? (
            <ContactsRow onAddContact={handleCloseContactManagement}></ContactsRow>
          ) : null}
          {selectedTab == SelectedTab?.CASHU_INVOICES ? <Invoices /> : null}
          {selectedTab == SelectedTab?.CASHU_HISTORY ? <History /> : null}
          {selectedTab == SelectedTab?.CASHU_MINT ? <Mints /> : null}
        </ScrollView>
      </SafeAreaView>
      <Modal visible={isScannerVisible} onRequestClose={handleCloseScanner}>
        <ScanQRCode onClose={handleCloseScanner} onSuccess={handleCloseScanner} />
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isOpenContactManagement}
        onRequestClose={handleCloseContactManagement}
      >
        <ContactList onClose={handleCloseContactManagement}></ContactList>
      </Modal>
      <Modal animationType="fade" transparent={true} visible={sendModalOpen}>
        <View style={styles.modalBackdrop}>
          <Send onClose={() => setSendModalOpen(false)}></Send>
        </View>
      </Modal>
      <Modal animationType="fade" transparent={true} visible={receiveModalOpen}>
        <View style={styles.modalBackdrop}>
          <Receive onClose={() => setReceiveModalOpen(false)}></Receive>
        </View>
      </Modal>
      <Modal animationType="fade" transparent={true} visible={settingsModalOpen}>
        <View style={styles.modalBackdrop}>
          <Settings onClose={() => setSettingsModalOpen(false)} />
        </View>
      </Modal>
      <NfcPayment 
        isVisible={nfcModalOpen}
        onClose={() => setNfcModalOpen(false)}
        setMode={setNfcMode}
        mode={nfcMode}
      />
    </View>
  );
};
