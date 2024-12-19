import {useNavigation} from '@react-navigation/native';
import {useAuth, useNip07Extension, useNostrContext} from 'afk_nostr_sdk';
import {useMemo} from 'react';

import {MainStackNavigationProps} from '../types';
import {useDialog} from './modals';
import {useLoginModal} from './modals/useLoginModal';

export const useNostrAuth = () => {
  const navigationMain = useNavigation<MainStackNavigationProps>();
  const {publicKey, privateKey} = useAuth();
  const {ndk} = useNostrContext();
  const {showDialog, hideDialog} = useDialog();
  const {show} = useLoginModal();
  const {getPublicKey} = useNip07Extension();

  const isNostrConnected = useMemo(() => {
    return publicKey ? true : false;
  }, [publicKey]);

  const handleCheckNostrAndSendConnectDialog = async () => {
    if (!isNostrConnected) {
      show();
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
