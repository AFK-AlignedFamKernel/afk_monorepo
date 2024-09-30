import '../../../applyGlobalPolyfills';

import {NDKKind} from '@nostr-dev-kit/ndk';
import {
  countMintRecommenderMapping,
  useCashu,
  useCashuMintList,
  useCashuStore,
  useNostrContext,
} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, {useEffect, useState} from 'react';
import {FlatList, SafeAreaView, TouchableOpacity, View} from 'react-native';
import {Text} from 'react-native';

import {CopyIconStack} from '../../assets/icons';
import {Input} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useToast} from '../../hooks/modals';
import stylesheet from './styles';

export const MintListCashu = () => {
  const tabs = ['Lightning', 'Ecash'];

  const {
    mintUrl,
    setMintUrl,
    mint,
    // setMint
  } = useCashu();
  const {ndkCashuWallet, ndkWallet, ndk} = useNostrContext();
  const mintList = useCashuMintList();

  const {showToast} = useToast();
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const {isSeedCashuStorage, setIsSeedCashuStorage} = useCashuStore();
  const [mintUrls, setMintUrls] = useState<Map<string, number>>(new Map());
  const [mintSum, setMintSum] = useState<Map<string, number>>(new Map());
  console.log('mintSum', mintSum);
  console.log('mintUrls', mintUrls);
  const {theme} = useTheme();

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
      setMintUrls(mintsUrlsMap);
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
  }, [mintList, isLoad]);

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
      setMintUrls(map?.mintsUrlsMap);
      setIsLoad(true);
    };

    if (!isLoad) {
      getMapping();
    }
  }, [isLoad, mintList]);

  const styles = useStyles(stylesheet);
  const handleCopy = async (url: string) => {
    await Clipboard.setStringAsync(url);
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

  console.log('mintList', mintList?.data);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <ScrollView contentContainerStyle={styles.scrollView}> */}

      <View style={styles.container}>
        <FlatList
          // contentContainerStyle={styles.flatListContent}
          data={Array.from(mintUrls)}
          keyExtractor={(item) => item?.[0]}
          renderItem={({item}) => {
            return (
              <View
              // style={{ flex: 1, flexDirection: "row" }}
              >
                <Input
                  value={item?.[0]}
                  editable={false}
                  right={
                    <TouchableOpacity
                      onPress={() => handleCopy(item?.[0])}
                      style={{
                        marginRight: 10,
                      }}
                    >
                      <CopyIconStack color={theme.colors.primary} />
                    </TouchableOpacity>
                  }
                />
                <Text style={styles.text}> Mint url: {item?.[0]}</Text>
                <Text style={styles.text}> Count: {item?.[1]}</Text>
              </View>
            );
          }}
        />
      </View>
      {/* 
        <View
        // style={styles.container}
        >
          <FlatList
            // contentContainerStyle={styles.flatListContent}
            data={mintList?.data?.pages?.flat()}
            keyExtractor={(item) => item?.id}
            renderItem={({item}) => {
              // console.log("item", item)
              const mintsUrlsUnset: string[] = [];

              item?.tags?.filter((tag: string[]) => {
                if (tag[0] === 'mint') {
                  mintsUrlsUnset.push(tag[1]);
                }
              });

              const mintsUrls = new Set(mintsUrlsUnset);
              // setMintUrls(mintsUrls)
              return (
                <View>
                  <Text style={styles.text}> Mint event: {item?.pubkey}</Text>
                  {Array.from(mintsUrls).map((url) => {
                    return (
                      <>
                        <Text style={styles.text}>Url: {url}</Text>
                      </>
                    );
                  })}
                </View>
              );
            }}
            refreshControl={
              <RefreshControl
                refreshing={mintList.isFetching}
                onRefresh={() => mintList.refetch()}
              />
            }
            onEndReached={() => mintList.fetchNextPage()}
          />

        </View> */}
    </SafeAreaView>
  );
};
