import {useCashu, useCashuStore} from 'afk_nostr_sdk';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import {useState} from 'react';
import {Platform} from 'react-native';

import {LockIcon} from '../../assets/icons';
import {Button, Input} from '../../components';
import {useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import {Auth} from '../../modules/Auth';
import {MainStackNavigationProps} from '../../types';
import {getPublicKeyFromSecret, isValidNostrPrivateKey} from '../../utils/keypair';
import {
  retrieveAndDecryptCashuMnemonic,
  storeCashuMnemonic,
  storePassword,
  storePrivateKey,
  storePublicKey,
} from '../../utils/storage';
import {useCashuContext} from '../../providers/CashuProvider';
import * as Bip39 from 'bip39';

interface IImportKeys {
  navigationProps?: MainStackNavigationProps | any;
  handleSuccess?: () => void;
  handleNavigateLoginScreen?: () => void;
}

export const ImportKeysModule: React.FC<IImportKeys> = ({
  navigationProps: navigation,
  handleSuccess,
  handleNavigateLoginScreen,
}: IImportKeys) => {
  const {theme} = useTheme();

  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const {showToast} = useToast();
  const {showDialog, hideDialog} = useDialog();
  const {generateNewMnemonic} = useCashuContext()!;
  const {setIsSeedCashuStorage} = useCashuStore();

  const handleImportAccount = async () => {
    if (!password) {
      showToast({type: 'error', title: 'Password is required'});
      return;
    }

    if (!privateKey) {
      showToast({type: 'error', title: 'Private key to import is required'});
      return;
    }

    if (!isValidNostrPrivateKey(privateKey)) {
      showToast({type: 'error', title: 'Private key not valid'});
      return;
    }

    await storePassword(password);
    await storePrivateKey(privateKey, password);
    const publicKey = getPublicKeyFromSecret(privateKey);
    await storePublicKey(publicKey);

    const mnemonicSaved = await retrieveAndDecryptCashuMnemonic(password);
    console.log('mnemonicSaved', mnemonicSaved);

    if (!mnemonicSaved) {
      console.log('[debug', Bip39.wordlists['english']);
      const mnemonic = Bip39.generateMnemonic(128, undefined, Bip39.wordlists['english']);
      console.log('mnemonic', mnemonic);
      await storeCashuMnemonic(mnemonic, password);
      setIsSeedCashuStorage(true);
    }

    const biometySupported = Platform.OS !== 'web' && canUseBiometricAuthentication();
    if (biometySupported) {
      showDialog({
        title: 'Easy login',
        description: 'Would you like to use biometrics to login?',
        buttons: [
          {
            type: 'primary',
            label: 'Yes',
            onPress: async () => {
              await storePassword(password);
              hideDialog();
            },
          },
          {
            type: 'default',
            label: 'No',
            onPress: hideDialog,
          },
        ],
      });
    }

    if (handleSuccess) {
      handleSuccess();
    } else {
      navigation.navigate('SaveKeys', {privateKey, publicKey});
    }
  };

  const handleGoBack = () => {
    if (handleNavigateLoginScreen) {
      handleNavigateLoginScreen();
    } else {
      navigation.goBack();
    }
  };

  return (
    <Auth title="ImportKeys">
      <Input
        left={<LockIcon color={theme.colors.primary} />}
        value={privateKey}
        onChangeText={setPrivateKey}
        secureTextEntry
        placeholder="Private key"
      />

      <Input
        left={<LockIcon color={theme.colors.primary} />}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
      />

      <Button
        block
        variant="secondary"
        disabled={!password || !privateKey}
        onPress={handleImportAccount}
      >
        Import Account
      </Button>

      <Button onPress={handleGoBack}>Back</Button>
    </Auth>
  );
};
