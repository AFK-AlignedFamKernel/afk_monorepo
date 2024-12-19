import {useCashu, useCashuStore, useNip07Extension, useNostrContext} from 'afk_nostr_sdk';
import {useMemo, useState} from 'react';

import {Button, Icon} from '../../../components';
import {useStyles, useTheme, useWindowDimensions} from '../../../hooks';
import {useInternalAccount} from '../../../hooks/account/useInternalAccount';
import {useDialog, useToast} from '../../../hooks/modals';
import {Auth} from '../../../modules/Auth';
import {AuthCreateAccountScreenProps} from '../../../types';
import stylesheet from './styles';
import {View, Text, TextInput, TouchableOpacity, Image} from 'react-native';
import {useCashuContext} from '../../../providers/CashuProvider';

export const CreateAccount: React.FC<AuthCreateAccountScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const {ndk} = useNostrContext();
  const {setIsSeedCashuStorage} = useCashuStore();
  const {generateMnemonic} = useCashuContext()!;
  const {showToast} = useToast();
  const {showDialog, hideDialog} = useDialog();
  const {
    handleGeneratePasskey,
    handleGenerateWallet,
    handleGenerateNostrWallet,
    handleGenerateNostrWalletOld,
    handleSavedNostrWalletOld,
  } = useInternalAccount();
  const {getPublicKey} = useNip07Extension();

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
    // const res = await handleGenerateWallet(passkey);
    // console.log('res handleGenerateWallet', res);

    // const resNostr = await handleGenerateNostrWallet(passkey);
    // console.log('resNostr handleGenerateNostrWallet', resNostr);

    const {publicKey, privateKey} = await handleGenerateNostrWalletOld(username, password, passkey);
    if (privateKey && publicKey) {
      navigation.navigate('SaveKeys', {privateKey, publicKey});
    }

    // @TODO fix
    // if (resNostr?.secretKey && resNostr?.publicKey) {
    //   const {publicKey, privateKey} = await handleSavedNostrWalletOld(
    //     username,
    //     password,
    //     resNostr?.secretKey,
    //     resNostr?.publicKey,
    //     passkey,
    //   );
    //   if (privateKey && publicKey) {
    //     navigation.navigate('SaveKeys', {privateKey, publicKey});
    //   }
    // }

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
  };

  const handleExtensionConnect = () => {
    showDialog({
      title: 'WARNING',
      description: 'Used your Nostr extension.',
      buttons: [
        {
          type: 'primary',
          label: 'Continue',
          onPress: async () => {
            const publicKey = await getPublicKey();
            // navigation.navigate('ImportKeys');
            hideDialog();
            // if (handleSuccess) {
            //   handleSuccess();
            // }
            if (publicKey && navigation) {
              navigation.navigate('Profile', {publicKey});
            }
          },
        },
        {type: 'default', label: 'Cancel', onPress: hideDialog},
      ],
    });
  };

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  return (
    <Auth title="Sign Up">
      <View style={styles.formContainer}>
        <Button
          onPress={handleExtensionConnect}
          style={styles.methodBtn}
          textStyle={styles.methodBtnText}
        >
          <View style={styles.btnInnerContainer}>
            <Image
              style={styles.methodBtnImg}
              source={require('./../../../assets/nostr.svg')}
              tintColor={theme.colors.textPrimary}
            />
            <Text>Nostr Extension</Text>
          </View>
        </Button>
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

      {isDesktop ? <hr style={styles.divider} /> : null}

      <View style={styles.accountBtnContainer}>
        <TouchableOpacity onPress={handleNavigateLogin} style={styles.accountBtn}>
          Already have an account?
        </TouchableOpacity>
      </View>

      {/* <TextButton onPress={handleImportKey}>Import account</TextButton> */}
    </Auth>
  );
};
