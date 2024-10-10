import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { useAuth, useCashu, useCashuStore, useNostrContext } from 'afk_nostr_sdk';
import { canUseBiometricAuthentication } from 'expo-secure-store';
import { useState } from 'react';
import { Platform } from 'react-native';

import { LockIcon } from '../../../assets/icons';
import { Button, Input, TextButton } from '../../../components';
import { useTheme } from '../../../hooks';
import { useDialog, useToast } from '../../../hooks/modals';
import { Auth } from '../../../modules/Auth';
import { AuthCreateAccountScreenProps } from '../../../types';
import { generateRandomKeypair } from '../../../utils/keypair';
import {
  retrieveAndDecryptCashuMnemonic,
  storeCashuMnemonic,
  storePassword,
  storePrivateKey,
  storePublicKey,
} from '../../../utils/storage';
import { useInternalAccount } from '../../../hooks/account/useInternalAccount';

export const CreateAccount: React.FC<AuthCreateAccountScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { ndk } = useNostrContext();
  const { setIsSeedCashuStorage } = useCashuStore();
  const { generateMnemonic } = useCashu();
  const { showToast } = useToast();
  const { showDialog, hideDialog } = useDialog();
  const { handleGeneratePasskey, handleGenerateWallet, handleGenerateNostrWallet, handleGenerateNostrWalletOld, handleSavedNostrWalletOld } = useInternalAccount()

  const handleCreateAccount = async () => {
    if (!username) {
      showToast({ type: 'error', title: 'Username is required' });
      return;
    }

    if (!password) {
      showToast({ type: 'error', title: 'Password is required' });
      return;
    }

    const passkey = await handleGeneratePasskey()
    console.log("passkey", passkey)
    const res = await handleGenerateWallet(passkey)
    console.log("res handleGenerateWallet", res)

    const resNostr = await handleGenerateNostrWallet(passkey)
    console.log("resNostr handleGenerateNostrWallet", resNostr)

    // const {publicKey, privateKey} = await handleGenerateNostrWalletOld(username, password, passkey)
    
    if(resNostr?.secretKey && resNostr?.publicKey) {
      const { publicKey, privateKey } = await handleSavedNostrWalletOld(username, password, resNostr?.secretKey, resNostr?.publicKey, passkey)
      if (privateKey && publicKey) {
        navigation.navigate('SaveKeys', { privateKey, publicKey });
      }
    }

    // const { privateKey, publicKey } = generateRandomKeypair();
    // await storePassword(password);
    // await storePrivateKey(privateKey, password);
    // await storePublicKey(publicKey);

    // try {
    //   const mnemonicSaved = await retrieveAndDecryptCashuMnemonic(password);

    //   if (!mnemonicSaved) {
    //     const mnemonic = await generateMnemonic();
    //     await storeCashuMnemonic(mnemonic, password);
    //     setIsSeedCashuStorage(true);
    //   }
    // } catch (e) {
    //   console.log('error cashu wallet', e);
    // }


    // try {
    //   ndk.signer = new NDKPrivateKeySigner(privateKey);
    //   const ndkUser = ndk.getUser({ pubkey: publicKey });
    //   ndkUser.profile = { nip05: username, displayName: username };
    //   await ndkUser.publish();
    // } catch (e) {
    //   console.log("error ndk user setup")

    // }


    // const biometySupported = Platform.OS !== 'web' && canUseBiometricAuthentication();
    // if (biometySupported) {
    //   showDialog({
    //     title: 'Easy login',
    //     description: 'Would you like to use biometrics to login?',
    //     buttons: [
    //       {
    //         type: 'primary',
    //         label: 'Yes',
    //         onPress: async () => {
    //           await storePassword(password);
    //           hideDialog();
    //         },
    //       },
    //       {
    //         type: 'default',
    //         label: 'No',
    //         onPress: hideDialog,
    //       },
    //     ],
    //   });
    // }

   

  };

  const handleImportKey = () => {
    navigation.navigate('ImportKeys');
  };

  return (
    <Auth title="Create Account">
      <Input placeholder="@ Username" value={username} onChangeText={setUsername} />

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
        disabled={!username || !password}
        onPress={handleCreateAccount}
      >
        Create Account
      </Button>

      <TextButton onPress={handleImportKey}>Import account</TextButton>

      <Button onPress={() => navigation.goBack()}>Back</Button>
    </Auth>
  );
};
