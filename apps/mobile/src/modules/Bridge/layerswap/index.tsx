import '../../../../applyGlobalPolyfills';
import React, { SetStateAction, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
// import { ActivityIndicator, Modal, Text, TextInput } from 'react-native';
import PolyfillCrypto from 'react-native-webview-crypto';
import { useStyles } from '../../../hooks';
import stylesheet from "./styles"
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsDesktop } from '../../../hooks/useIsDesktop';

export const CashuWalletView: React.FC = () => {
  return (
    <ScrollView>
      <PolyfillCrypto />
      <LayerswapView />
    </ScrollView>
  );
};

export const LayerswapView = () => {


  const styles = useStyles(stylesheet);
  const isDesktop = useIsDesktop()
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>

        <ScrollView>
          {Platform.OS == "web" ?

            <View style={{
              minHeight: isDesktop ? 650 : 450
            }}>
              {/* <a href={`https://www.layerswap.io/app/?to=STARKNET_MAINNET&clientId=${process.env.EXPO_PUBLIC_LAYERSWAP_CLIENT_ID}`}>
                Deposit funds
              </a> */}
              {/* <iframe src={`https://layerswap.io/app/?
                      clientId=${process.env.EXPO_PUBLIC_LAYERSWAP_CLIENT_ID}
                      &to=STARKNET_MAINNET
                      &from=ETHEREUM_MAINNET
                      &amount=27
                      &asset=IMX
                      &actionButtonText=Deposit`
              } */}
              <iframe src={`https://layerswap.io/app/?
                      clientId=${process.env.EXPO_PUBLIC_LAYERSWAP_CLIENT_ID}
                      &to=STARKNET_MAINNET
                      &from=ARBITRUM_MAINNET
                      &amount=50
                      &asset=USDC
                      &actionButtonText=Deposit`
              }
                height={"100%"}
                width={"100%"}
              >
              </iframe>
            </View>
            :
            <>
            </>
          }
        </ScrollView>
      </SafeAreaView>
    </View >
  );
};
