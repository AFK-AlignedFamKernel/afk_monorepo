import '@walletconnect/react-native-compat';
import { Platform, StyleSheet } from 'react-native';

import {starknetChainId, useAccount} from '@starknet-react/core';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';

import {useTips} from '../hooks/api/indexer/useTips';
import {useDialog, useToast} from '../hooks/modals';
import {Router} from './Router';
import { useCashu, useCashuStore } from 'afk_nostr_sdk';
import { retrieveAndDecryptCashuMnemonic, retrievePassword } from 'src/utils/storage';
import { canUseBiometricAuthentication } from 'expo-secure-store';
// import '../styles/index.css'; 
// import '../styles/global.css';

// import { withExpoSnack } from 'nativewind';

SplashScreen.preventAutoHideAsync();

// const StyledView = styled(View);

export default function App() {
// export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [sentTipNotification, setSentTipNotification] = useState(false);

  const tips = useTips();
  const {showToast} = useToast();

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          'Poppins-Light': require('../../assets/fonts/Poppins/Poppins-Light.ttf'),
          'Poppins-Regular': require('../../assets/fonts/Poppins/Poppins-Regular.ttf'),
          'Poppins-Italic': require('../../assets/fonts/Poppins/Poppins-Italic.ttf'),
          'Poppins-Medium': require('../../assets/fonts/Poppins/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('../../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('../../assets/fonts/Poppins/Poppins-Bold.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    })();
  }, []);

  const {showDialog, hideDialog} = useDialog();

  const account = useAccount();

  useEffect(() => {
    const chainId = account.chainId ? starknetChainId(account.chainId) : undefined;

    if (chainId) {
      // if (chainId !== CHAIN_ID) {
      //   showDialog({
      //     title: 'Wrong Network',
      //     description:
      //       'AFK currently only supports the Starknet Sepolia network. Please switch to the Sepolia network to continue.',
      //     buttons: [],
      //   });
      // } else {
      //   hideDialog();
      // }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.chainId]);

  useEffect(() => {
    const interval = setInterval(() => tips.refetch(), 2 * 60 * 1_000);
    return () => clearInterval(interval);
  }, [tips]);

  useEffect(() => {
    if (sentTipNotification) return;

    const hasUnclaimedTip = (tips?.data ?? []).some((tip) => !tip?.isClaimed && tip?.depositId);
    if (hasUnclaimedTip) {
      setSentTipNotification(true);
      showToast({
        type: 'info',
        title: 'You have unclaimed tips',
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tips?.data]);
  const {
    wallet,
    connectCashMint,
    connectCashWallet,
    requestMintQuote,
    // generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
    mint,
    activeMintIndex,
    mintUrls,
    setMintInfo,
    getMintInfo,
  } = useCashu();
  const { isSeedCashuStorage, setIsSeedCashuStorage, hasSeedCashu, setHasSeedCashu, setMnemonic} = useCashuStore();


  // Auto load session:
  // Cashu seed
  // Nostr private key
  useEffect(() => {
    (async () => {
      const biometrySupported = Platform.OS !== 'web' && canUseBiometricAuthentication?.();

      if (biometrySupported) {
        const password = await retrievePassword();
        if (!password) return;
        const storeMnemonic = await retrieveAndDecryptCashuMnemonic(password);

        if (!storeMnemonic) {
          return;
        }
        if (storeMnemonic) setHasSeedCashu(true);

        const decoder = new TextDecoder();
        // const decryptedPrivateKey = decoder.decode(Buffer.from(storeMnemonic).toString("hex"));
        const decryptedPrivateKey = Buffer.from(storeMnemonic).toString('hex');
        setMnemonic(decryptedPrivateKey);

        if (isSeedCashuStorage) setHasSeedCashu(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if(!activeMintIndex) return;
      const mintUrl = mintUrls?.[activeMintIndex]?.url;
      if (!mintUrl) return;
      const info = await getMintInfo(mintUrl);
      setMintInfo(info);
    })();
  }, [activeMintIndex]);
  

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Router />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
});

// export default withExpoSnack(App);
// export default App;