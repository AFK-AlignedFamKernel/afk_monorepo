import '../../../applyGlobalPolyfills';

import { webln } from '@getalby/sdk';
import { useAuth, useCashu, useCashuMintList, useCashuStore, useNostrContext, useSendZap } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, { SetStateAction, useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Modal, Text, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import { Button, IconButton, Input } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import { useDialog, useToast } from '../../hooks/modals';
import stylesheet from './styles';
import { CashuMint, MintQuoteResponse } from '@cashu/cashu-ts';
import { CopyIconStack } from '../../assets/icons';
import { canUseBiometricAuthentication } from 'expo-secure-store';
import { retrieveAndDecryptCashuMnemonic, retrievePassword, storeCashuMnemonic } from '../../utils/storage';
import { SelectedTab, TABS_CASHU } from '../../types/tab';


export const MintListCashu = () => {

  const {

    mintUrl,
    setMintUrl,
    mint,
    setMint
  } = useCashu()
  const { ndkCashuWallet, ndkWallet } = useNostrContext()
  const mintList = useCashuMintList()

  // const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")
  // const [mint, setMint] = useState<CashuMint | undefined>(mintUrl ? new CashuMint(mintUrl) : undefined)
  const [isLoad, setIsLoad] = useState<boolean>(false)

  const { isSeedCashuStorage, setIsSeedCashuStorage } = useCashuStore()

  // const [mintSum, setMintSum] = useState<{ mintUrl: string, count: number }[] | undefined>([])
  // const [mintSum, setMintSum] = useState<{ [key]: string, count: number } | undefined>([])
  const [mintUrls, setMintUrls] = useState<Set<string>>(new Set())
  const [mintSum, setMintSum] = useState<Map<string, number>>(new Map())
  console.log("mintSum", mintSum)

  const getMintUrls = () => {
    if(isLoad) return;

    if(mintList?.data?.pages?.length ==0) return;
    try  {
      const mintsUrlsUnset: string[] = []

      const mintMapCounter = new Map()
      console.log(" mintList?.data?.pages",  mintList?.data?.pages?.length)
  
      mintList?.data?.pages?.forEach((e) => {
        if (!e?.tags) return;
        e?.tags?.filter((tag: string[]) => {
          if (tag[0] === 'mint') {
            mintsUrlsUnset.push(tag[1])
            const counter = mintMapCounter.get(tag[1])
            console.log("counter", counter)
  
            mintMapCounter.set(tag[1], counter + 1)
          }
        });
      })
  
      setMintSum(mintMapCounter)
      console.log("mintMapCounter", mintMapCounter)
  
      setIsLoad(true)
      const mintsUrls = new Set(mintsUrlsUnset)
      setMintUrls(mintsUrls)
      return mintUrls;
    }catch(e) {
      console.log("Error get mint urls",e)
      return []
    }
 
  }
  useEffect(() => {

    if(isLoad) return;

    if(mintList?.data?.pages?.length ==0) return;
    getMintUrls();


  }, [mintList, isLoad]);


  const styles = useStyles(stylesheet);


  console.log("mintList", mintList?.data)

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={styles.container}
      // contentContainerStyle={styles.scrollView}
      >
        {/* <ScrollView contentContainerStyle={styles.scrollView}> */}

        {/* <View style={styles.container}>

          <FlatList

            // contentContainerStyle={styles.flatListContent}
            data={Array.from(mintUrls)}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              return <View>
                <Text> Mint url: {item}</Text>

              </View>
            }}

          />



        </View> */}

        <View
        // style={styles.container}
        >

          <FlatList

            // contentContainerStyle={styles.flatListContent}
            data={mintList?.data?.pages?.flat()}
            keyExtractor={(item) => item?.id}
            renderItem={({ item }) => {
              // console.log("item", item)
              const mintsUrlsUnset: string[] = []

              item?.tags?.filter((tag: string[]) => {
                if (tag[0] === 'mint') {
                  mintsUrlsUnset.push(tag[1])
                }
              });

              const mintsUrls = new Set(mintsUrlsUnset)
              // setMintUrls(mintsUrls)
              return <View>
                <Text
                  style={styles.text}
                > Mint event: {item?.pubkey}</Text>
                {Array.from(mintsUrls).map((url) => {
                  return (
                    <>
                      <Text
                        style={styles.text}
                      >Url: {url}</Text>
                    </>
                  )
                })}


              </View>
            }}
            refreshControl={
              <RefreshControl refreshing={mintList.isFetching} onRefresh={() => mintList.refetch()} />
            }
            onEndReached={() => mintList.fetchNextPage()}
          />



        </View>
      </View>
    </SafeAreaView>
  );
};
