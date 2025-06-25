// import '../../../../../applyGlobalPolyfills';

import { GetInfoResponse } from '@cashu/cashu-ts';
import { NDKKind } from '@nostr-dev-kit/ndk';
import {
  countMintRecommenderMapping,
  useCashuMintList,
  useCashuStore,
  useNostrContext,
} from 'afk_nostr_sdk';
import { MintData } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from 'react-native';

import { CloseIcon, InfoIcon, ScanQrIcon, TrashIcon } from 'src/assets/icons';
import { Button } from 'src/components';
import { useStyles, useTheme } from 'src/hooks';
import { useToast } from 'src/hooks/modals';
import { useCashuContext } from 'src/providers/CashuProvider';
import { formatCurrency } from 'src/utils/helpers';
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


  const { ndkCashuWallet, ndkWallet, ndk } = useNostrContext();
  const mintList = useCashuMintList();

  console.log("mintList", mintList)
  const { showToast } = useToast();
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const { isSeedCashuStorage, setIsSeedCashuStorage } = useCashuStore();
  const [mintSum, setMintSum] = useState<Map<string, number>>(new Map());
  const [newAlias, setNewAlias] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newMintError, setNewMintError] = useState<string>('');

  const { theme } = useTheme();
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
      setMintSum(mintsUrlsMap)
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
    showToast({ type: 'info', title: 'Copied to clipboard' });
  };

  const handleSelectMint = (item: MintData) => {
    const index = mintUrls.findIndex((mint) => mint.url === item.url);
    if (index !== -1) {
      setActiveMintIndex(index);
      setActiveCurrency('sat');
    }
  };

  const handleAddMint = () => {
    setMintUrls((prevMintUrls) => [...prevMintUrls, { url: newUrl, alias: newAlias }]);
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
      setMintSum(map?.mintsUrlsMap)
      setIsLoad(true);
    };

    if (!isLoad) {
      getMapping();
    }
  }, [isLoad, mintList, ndk]);


  return (
    <View style={styles.tabContentContainer}>
      <View>
        <Text style={styles.tabTitle}>Mint recommendations</Text>

        {Array.from(mintSum.entries()).length == 0 && <ActivityIndicator></ActivityIndicator>}
        <FlatList data={Array.from(mintSum.entries())} renderItem={({ item }) => {

          return (
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10}}>
              <View style={{flex: 1}}>
                <Text style={styles.mintInfoModalText} numberOfLines={1} ellipsizeMode="tail">
                  {item[0]}
                </Text>
                <Text style={[styles.mintInfoModalText, {color: '#666'}]}>
                  {item[1]} recommendations
                </Text>
              </View>
              {/* <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity 
                  style={{padding: 8, backgroundColor: '#4CAF50', borderRadius: 4}}
                  onPress={() => {}}>
                  <Text style={{color: '#fff'}}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{padding: 8, backgroundColor: '#f44336', borderRadius: 4}}
                  onPress={() => {}}>
                  <Text style={{color: '#fff'}}>Remove</Text>
                </TouchableOpacity>
              </View> */}
            </View>
          )

        }} keyExtractor={(item) => item[0]} />
      </View>
{/*     
      <Modal animationType="fade" transparent={true} visible={mintInfo !== null}>
        <View style={styles.mintInfoModalMainContainer}>
          <View style={styles.mintInfoModalContent}>
            <TouchableOpacity
              onPress={() => setMintInfo(null)}
              style={{ position: 'absolute', top: 15, right: 15, zIndex: 2000 }}
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
      </Modal> */}
    </View>
  );
};
