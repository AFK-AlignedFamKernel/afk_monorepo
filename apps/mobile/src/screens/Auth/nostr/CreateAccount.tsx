import {useCashu, useCashuStore, useNostrContext} from 'afk_nostr_sdk';
import {useState} from 'react';

import {LockIcon} from '../../../assets/icons';
import {Button, Icon, Input, TextButton} from '../../../components';
import {useStyles, useTheme} from '../../../hooks';
import {useInternalAccount} from '../../../hooks/account/useInternalAccount';
import {useDialog, useToast} from '../../../hooks/modals';
import {Auth} from '../../../modules/Auth';
import {AuthCreateAccountScreenProps} from '../../../types';
import stylesheet from './styles';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';

export const CreateAccount: React.FC<AuthCreateAccountScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const {ndk} = useNostrContext();
  const {setIsSeedCashuStorage} = useCashuStore();
  const {generateMnemonic} = useCashu();
  const {showToast} = useToast();
  const {showDialog, hideDialog} = useDialog();
  const {
    handleGeneratePasskey,
    handleGenerateWallet,
    handleGenerateNostrWallet,
    handleGenerateNostrWalletOld,
    handleSavedNostrWalletOld,
  } = useInternalAccount();

  const handleCreateAccount = async () => {
    if (!username) {
      showToast({type: 'error', title: 'Username is required'});
      return;
    }

    if (!password) {
      showToast({type: 'error', title: 'Password is required'});
      return;
    }

    const passkey = await handleGeneratePasskey();
    console.log('passkey', passkey);
    const res = await handleGenerateWallet(passkey);
    console.log('res handleGenerateWallet', res);

    const resNostr = await handleGenerateNostrWallet(passkey);
    console.log('resNostr handleGenerateNostrWallet', resNostr);

    // const {publicKey, privateKey} = await handleGenerateNostrWalletOld(username, password, passkey)

    if (resNostr?.secretKey && resNostr?.publicKey) {
      const {publicKey, privateKey} = await handleSavedNostrWalletOld(
        username,
        password,
        resNostr?.secretKey,
        resNostr?.publicKey,
        passkey,
      );
      if (privateKey && publicKey) {
        navigation.navigate('SaveKeys', {privateKey, publicKey});
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

  const handleNavigateLogin = () => {
    navigation.navigate('Login');
  }

  return (
    <Auth title="Sign Up">
      <View style={styles.formContainer}>
        <View>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            style={styles.input}
          />
        </View>
        <View>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              style={styles.input}
            />
            <Icon name={'EyeIcon'} size={20} color={'grayInput'} style={styles.eyeIcon} />
          </View>
        </View>
        <Button
          block
          style={styles.formBtn}
          variant="primary"
          disabled={!username || !password}
          onPress={handleCreateAccount}
        >
          Sign Up
        </Button>
      </View>

      <hr style={styles.divider} />

      <View style={styles.accountBtnContainer}>
        <TouchableOpacity onPress={handleNavigateLogin} style={styles.accountBtn}>
          Already have an account?
        </TouchableOpacity>
      </View>

      {/* <TextButton onPress={handleImportKey}>Import account</TextButton> */}
    </Auth>
  );
};
