import '@walletconnect/react-native-compat';
import {starknetChainId, useAccount} from '@starknet-react/core';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {useCallback, useEffect, useState} from 'react';
import {Platform, View} from 'react-native';
import {registerForPushNotificationsAsync} from '../services/notifications';
import {useTips} from '../hooks';
import {useDialog, useToast} from '../hooks/modals';
import {Router} from './Router';

SplashScreen.preventAutoHideAsync();

export default function App() {
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

  useEffect(() => {
    if (Platform.OS !== 'web') {
      registerForPushNotificationsAsync()
        .then((token: string | null) => {
          if (token) {
            console.log('Push token:', token);
          }
        })
        .catch((error: Error) => console.error('Failed to get push token:', error));
    }
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <View style={{flex: 1, flexDirection: 'row'}} onLayout={onLayoutRootView}>
      <Router />
    </View>
  );
}
