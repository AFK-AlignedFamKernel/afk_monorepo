import '../../../applyGlobalPolyfills';

import {GetInfoResponse} from '@cashu/cashu-ts';
import {NDKKind} from '@nostr-dev-kit/ndk';
import {
  countMintRecommenderMapping,
  useCashuMintList,
  useCashuStore,
  useNostrContext,
} from 'afk_nostr_sdk';
import {MintData} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {useEffect, useState} from 'react';
import {FlatList, Modal, TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from 'react-native';

import {CloseIcon, InfoIcon, ScanQrIcon, TrashIcon} from '../../assets/icons';
import {Button} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {useCashuContext} from '../../providers/CashuProvider';
import {formatCurrency} from '../../utils/helpers';
import stylesheet from './styles';

export interface UnitInfo {
  unit: string;
  balance: number;
}

export const MintListCashu = () => {
  const {
    mintUrls,
    activeMintIndex,
    setActiveMintIndex,
    setMintUrls,
    getMintInfo,
    getUnits,
    getUnitBalance,
    setActiveCurrency,
  } =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    useCashuContext()!;

  const [mintUnitsMap, setMintUnitsMap] = useState<Map<string, UnitInfo[]>>(new Map());

  // Load units and their balances for each mint
  useEffect(() => {
    const loadMintUnits = async () => {
      const newMintUnitsMap = new Map<string, UnitInfo[]>();

      for (const mint of mintUrls) {
        try {
          const units = await getUnits(mint);
          // Get balance for each unit
          const unitsWithBalance = await Promise.all(
            units.map(async (unit) => {
              const balance = await getUnitBalance(unit, mint);
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
  }, [getUnitBalance, getUnits, mintUrls]);

  const renderMintItem = ({item}: {item: MintData}) => {
    const isSelected = mintUrls[activeMintIndex].url === item.url;
    const unitsInfo = mintUnitsMap.get(item.url) || [];

    return (
      <TouchableOpacity style={styles.mint} onPress={() => handleSelectMint(item)}>
        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
        <View style={styles.mintContentContainer}>
          <View style={styles.textsContainer}>
            <Text style={styles.title}>{item.alias}</Text>
            <Text style={styles.title}>{item.url}</Text>
            <View style={styles.unitsContainer}>
              {unitsInfo.map((unitInfo) => (
                <View style={styles.unit} key={unitInfo.unit}>
                  <Text>{formatCurrency(unitInfo.balance, unitInfo.unit)}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.mintActionsContainer}>
            <TouchableOpacity onPress={() => handleGetInfo(item)}>
              <InfoIcon width={20} height={20} color={theme.colors.primary} />
            </TouchableOpacity>
            {item.alias !== 'Default Mint' && (
              <TouchableOpacity onPress={() => handleDeleteMint(item)}>
                <TrashIcon width={20} height={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const {ndkCashuWallet, ndkWallet, ndk} = useNostrContext();
  const mintList = useCashuMintList();

  const {showToast} = useToast();
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();
  const [mintSum, setMintSum] = useState<Map<string, number>>(new Map());
  const [newAlias, setNewAlias] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newMintError, setNewMintError] = useState<string>('');

  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getMintUrls = () => {
    if (isLoad) return;

    if (mintList?.data?.pages?.length == 0) return;
    try {
      const mintsUrlsMap: Map<string, number> = new Map();
      const mintsUrls: string[] = [];
      mintList?.data?.pages.forEach((e) => {
        e?.tags?.filter((tag: string[]) => {
          if (tag[0] === 'mint') {
            const isExist = mintsUrlsMap.has(tag[1]);
            if (isExist) {
              const counter = mintsUrlsMap.get(tag[1]) ?? 0;
              mintsUrlsMap.set(tag[1], counter + 1);
            } else {
              mintsUrlsMap.set(tag[1], 1);
            }
            mintsUrls.push(tag[1]);
          }
        });
      });
      console.log('mintUrlsMap', mintsUrlsMap);
      // setMintUrls(mintsUrlsMap)
      setIsLoad(true);
      return mintUrls;
    } catch (e) {
      console.log('Error get mint urls', e);
      return [];
    }
  };

  useEffect(() => {
    if (isLoad) return;
    if (mintList?.data?.pages?.length == 0) return;
    getMintUrls();
  }, [mintList, isLoad, getMintUrls]);

  const handleCopy = async (url: string) => {
    await Clipboard.setStringAsync(url);
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

  const handleSelectMint = (item: MintData) => {
    const index = mintUrls.findIndex((mint) => mint.url === item.url);
    if (index !== -1) {
      setActiveMintIndex(index);
      setActiveCurrency('sat');
    }
  };

  const handleAddMint = () => {
    setMintUrls((prevMintUrls) => [...prevMintUrls, {url: newUrl, alias: newAlias}]);
    setNewAlias('');
    setNewUrl('');
  };

  const [mintInfo, setMintInfo] = useState<GetInfoResponse | null>(null);

  const handleGetInfo = (item: MintData) => {
    getMintInfo(item.url).then((info) => {
      setMintInfo(info);
    });
  };

  const handleDeleteMint = (item: MintData) => {
    setMintUrls((prevMintUrls) => prevMintUrls.filter((mint) => mint.url !== item.url));
  };

  useEffect(() => {
    const isDuplicateAlias = mintUrls.some((mint) => mint.alias === newAlias);
    const isDuplicateUrl = mintUrls.some((mint) => mint.url === newUrl);

    if (isDuplicateAlias) {
      setNewMintError('Error: Duplicate alias');
      return;
    }

    if (isDuplicateUrl) {
      setNewMintError('Error: Duplicate URL');
      return;
    }

    setNewMintError('');
  }, [mintUrls, newAlias, newUrl]);

  useEffect(() => {
    const getMapping = async () => {
      if (isLoad) return;
      // if (mintList?.data?.pages?.length == 0) return;
      const mintList = await ndk.fetchEvents({
        kinds: [NDKKind.CashuMintList],
        limit: 100,
      });

      // const events = await getMintEvent(ndk)
      const map = countMintRecommenderMapping([...mintList]);
      // setMintUrls(map?.mintsUrlsMap)
      setIsLoad(true);
    };

    if (!isLoad) {
      getMapping();
    }
  }, [isLoad, mintList, ndk]);

  return (
    <View style={styles.tabContentContainer}>
      <View>
        <Text style={styles.tabTitle}>Cashu Mints</Text>
        <FlatList data={mintUrls} renderItem={renderMintItem} keyExtractor={(item) => item.url} />
      </View>
      <View>
        <Text style={[styles.tabTitle, styles.titleMargin]}>Add Cashu Mint</Text>
        <Text style={styles.tabSubtitle}>Enter the URL of a Cashu mint to connect to it.</Text>
        <TextInput
          placeholder="Mint URL"
          value={newUrl}
          onChangeText={setNewUrl}
          style={styles.addMintInput}
        />
        <TextInput
          placeholder="Alias"
          value={newAlias}
          onChangeText={setNewAlias}
          style={styles.addMintInput}
        />
        {newMintError != '' && <Text style={styles.newMintError}>{newMintError}</Text>}
        {newAlias != '' && newUrl != '' && newMintError == '' ? (
          <Button
            style={styles.addMintBtn}
            textStyle={styles.addMintBtnText}
            onPress={handleAddMint}
          >
            Add Mint
          </Button>
        ) : (
          <>
            <Text style={styles.orText}>or</Text>
            <TouchableOpacity
              onPress={() => console.log('todo: add scanner')}
              style={styles.qrButtonSmall}
            >
              <ScanQrIcon width={30} height={30} color={theme.colors.primary} />
            </TouchableOpacity>
          </>
        )}
      </View>
      <Modal animationType="fade" transparent={true} visible={mintInfo !== null}>
        <View style={styles.mintInfoModalMainContainer}>
          <View style={styles.mintInfoModalContent}>
            <TouchableOpacity
              onPress={() => setMintInfo(null)}
              style={{position: 'absolute', top: 15, right: 15, zIndex: 2000}}
            >
              <CloseIcon width={30} height={30} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalTitle]}>
              {mintInfo?.name}
            </Text>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalDescription]}>
              {mintInfo?.description}
            </Text>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalDescription]}>
              {mintInfo?.description_long}
            </Text>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalVersion]}>
              Version: {mintInfo?.version}
            </Text>
            <Text style={[styles.mintInfoModalText, styles.mintInfoModalNuts]}>
              Nuts: {Object.keys(mintInfo?.nuts || {}).join(', ')}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};
