import {useAuth, useNip07Extension, useNostrContext} from 'afk_nostr_sdk';
import {ColorProp, ThemeColorNames} from '../styles';
import {useTheme} from './useTheme';
import {useMemo} from 'react';
import {useDialog} from './modals';
import {MainStackNavigationProps} from '../types';
import {useNavigation} from '@react-navigation/native';

export const useNostrAuth = () => {
  const {publicKey, privateKey} = useAuth();
  const {ndk} = useNostrContext();
  const {showDialog, hideDialog} = useDialog();
  const {getPublicKey} = useNip07Extension();
  const navigationMain = useNavigation<MainStackNavigationProps>();

  const isNostrConnected = useMemo(() => {
    return publicKey ? true : false;
  }, [publicKey]);

  const handleCheckNostrAndSendConnectDialog = async () => {
    if (!isNostrConnected) {
      handleGoLogin();
    }

    return isNostrConnected;
  };

  const handleGoLogin = () => {
    showDialog({
      title: 'Login your Nostr accounts',
      description: 'Go to Nostr login page.',
      buttons: [
        {
          type: 'primary',
          label: 'Continue',
          onPress: () => {
            navigationMain.navigate('Login');
            hideDialog();
          },
        },
        {type: 'default', label: 'Cancel', onPress: hideDialog},
      ],
    });
  };

  const handleCreateNostrAccount = () => {
    showDialog({
      title: 'WARNING',
      description:
        'Creating a new account will delete your current account. Are you sure you want to continue?',
      buttons: [
        {
          type: 'primary',
          label: 'Continue',
          onPress: () => {
            navigationMain.navigate('CreateAccount');
            hideDialog();
          },
        },
        {type: 'default', label: 'Cancel', onPress: hideDialog},
      ],
    });
  };

  const handleExtensionConnect = () => {
    showDialog({
      title: 'WARNING',
      description: 'Used your Nostr extension.',
      buttons: [
        {
          type: 'primary',
          label: 'Continue',
          onPress: () => {
            getPublicKey();
            // navigation.navigate('ImportKeys');
            // hideDialog();
          },
        },
        {type: 'default', label: 'Cancel', onPress: hideDialog},
      ],
    });
  };

  return {
    isNostrConnected,
    handleCheckNostrAndSendConnectDialog,
    handleCreateNostrAccount,
    handleExtensionConnect,
    handleGoLogin,
  };
};
