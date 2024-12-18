import {mnemonicToSeedSync} from '@scure/bip39';
import {useAuth, useCashu, useCashuStore, useNip07Extension} from 'afk_nostr_sdk';
import {canUseBiometricAuthentication} from 'expo-secure-store';
import {useEffect, useState} from 'react';
import {Platform, TextInput, View, Image, Text} from 'react-native';

import {Button, Icon} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useDialog, useToast} from '../../hooks/modals';
import {Auth} from '../../modules/Auth';
import {MainStackNavigationProps} from '../../types';
import {getPublicKeyFromSecret} from '../../utils/keypair';
import {
  retrieveAndDecryptCashuMnemonic,
  retrieveAndDecryptCashuSeed,
  retrieveAndDecryptPrivateKey,
  retrievePassword,
  retrievePublicKey,
  storeCashuMnemonic,
  storeCashuSeed,
} from '../../utils/storage';
import {LoginStarknet} from './StarknetLogin';
import stylesheet from './styles';
import {TouchableOpacity} from 'react-native-gesture-handler';

interface ILoginNostr {
  isNavigationAfterLogin?: boolean;
  navigationProps?: MainStackNavigationProps | any;
  handleSuccess?: () => void;
  handleSuccessCreateAccount?: () => void;
}
export const LoginNostrModule: React.FC<ILoginNostr> = ({
  isNavigationAfterLogin,
  navigationProps,
  handleSuccess,
  handleSuccessCreateAccount,
}: ILoginNostr) => {
  const {theme} = useTheme();
  const styles = useStyles(stylesheet);
  const setAuth = useAuth((state) => state.setAuth);
  const publicKey = useAuth((state) => state.publicKey);

  // const navigation = useNavigation<MainStackNavigationProps>()
  // const { setIsSeedCashuStorage } = useAuth()
  const {setIsSeedCashuStorage, setSeed, setMnemonic} = useCashuStore();
  const [password, setPassword] = useState('');

  const {showToast} = useToast();
  const {showDialog, hideDialog} = useDialog();
  const {getPublicKey} = useNip07Extension();
  const {generateMnemonic} = useCashu();

  // const navigationMain = useNavigation<MainStackNavigationProps>();

  useEffect(() => {
    (async () => {
      const biometrySupported = Platform.OS !== 'web' && canUseBiometricAuthentication?.();

      if (biometrySupported) {
        const storedPassword = await retrievePassword();
        if (storedPassword) setPassword(storedPassword);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!password) {
      showToast({type: 'error', title: 'Password is required'});
      return;
    }

    const privateKey = await retrieveAndDecryptPrivateKey(password);
    if (!privateKey || privateKey.length !== 32) {
      showToast({type: 'error', title: 'Invalid password'});
      return;
    }
    const privateKeyHex = privateKey.toString('hex');

    const storedPublicKey = await retrievePublicKey();
    const publicKey = getPublicKeyFromSecret(privateKeyHex);

    if (publicKey !== storedPublicKey) {
      showToast({type: 'error', title: 'Invalid password'});
      return;
    }

    const mnemonicSaved = await retrieveAndDecryptCashuMnemonic(password);
    // console.log("mnemonicSaved", mnemonicSaved)
    setIsSeedCashuStorage(true);
    setAuth(publicKey, privateKeyHex);

    try {
      if (!mnemonicSaved) {
        const mnemonic = await generateMnemonic();
        await storeCashuMnemonic(mnemonic, password);
        const seed = await mnemonicToSeedSync(mnemonic);

        const seedHex = Buffer.from(seed).toString('hex');

        await storeCashuSeed(seedHex, password);

        setMnemonic(mnemonic);
        setSeed(seed);
        setIsSeedCashuStorage(true);
      }

      const seedSaved = await retrieveAndDecryptCashuSeed(password);

      if (!seedSaved && mnemonicSaved) {
        const mnemonic = Buffer.from(mnemonicSaved).toString('hex');
        console.log('mnemonic', mnemonic);

        const seed = await mnemonicToSeedSync(mnemonic);
        const seedHex = Buffer.from(seed).toString('hex');
        console.log('seedHex', seedHex);

        await storeCashuSeed(seedHex, password);
        setMnemonic(mnemonic);
        setSeed(seed);
      }
    } catch (e) {
      console.log('Error mnemonic', e);
    }
    if (handleSuccess) {
      handleSuccess();
    }
    if (publicKey && privateKeyHex && isNavigationAfterLogin && navigationProps) {
      navigationProps?.navigate('Feed');
    }
  };

  const handleCreateAccount = () => {
    showDialog({
      title: 'WARNING',
      description:
        'Creating a new account will delete your current account. Are you sure you want to continue?',
      buttons: [
        {
          type: 'primary',
          label: 'Continue',
          onPress: () => {
            navigationProps?.navigate('CreateAccount');
            hideDialog();
          },
        },
        {type: 'default', label: 'Cancel', onPress: hideDialog},
      ],
    });
  };

  const handleImportAccount = () => {
    showDialog({
      title: 'WARNING',
      description:
        'Creating a new account will delete your current account. Are you sure you want to continue?',
      buttons: [
        {
          type: 'primary',
          label: 'Continue',
          onPress: () => {
            navigationProps?.navigate('ImportKeys');
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
          onPress: async () => {
            const publicKey = await getPublicKey();
            // navigation.navigate('ImportKeys');
            hideDialog();
            if (handleSuccess) {
              handleSuccess();
            }
            if (publicKey && navigationProps) {
              navigationProps.navigate('Profile', {publicKey});
            }
          },
        },
        {type: 'default', label: 'Cancel', onPress: hideDialog},
      ],
    });
  };

  // const handleGoDegenApp = () => {
  //   // Brind dialog
  //   navigation.navigate('DegensStack', { screen: 'Games' });
  //   // showDialog({
  //   //   title: 'WARNING',
  //   //   description:
  //   //     'You are going to visit AFK without a Nostr graph features. Are you sure you want to continue?',
  //   //   buttons: [
  //   //     {
  //   //       type: 'primary',
  //   //       label: 'Continue',
  //   //       onPress: () => {
  //   //         navigation.navigate("DegensStack", { screen: "Games" });
  //   //         hideDialog();
  //   //       },
  //   //     },
  //   //     { type: 'default', label: 'Cancel', onPress: hideDialog },
  //   //   ],
  //   // });
  // };

  return (
    <Auth title="Log In">
      <View style={styles.loginMethodsContainer}>
        <Button
          onPress={handleExtensionConnect}
          style={styles.loginMethodBtn}
          textStyle={styles.loginMethodBtnText}
        >
          <View style={styles.btnInnerContainer}>
            <Image style={styles.loginMethodBtnImg} source={require('./../../assets/nostr.svg')} />
            Nostr Extension
          </View>
        </Button>
        <LoginStarknet
          handleNavigation={() => navigationProps?.navigate('Feed')}
          btnText={'Starknet Account'}
          useCustomBtn
        />
      </View>
      <Text style={styles.passwordLabel}>Password</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter your password"
          style={styles.passwordInput}
        />
        <Icon name={'EyeIcon'} size={20} color={'grayInput'} style={styles.eyeIcon} />
      </View>
      <Text style={styles.passwordInstruction}>
        It must be a combination of minimum 8 letters, numbers, and symbols.
      </Text>
      <View style={styles.importAccountBtnContainer}>
        <TouchableOpacity onPress={handleImportAccount} style={styles.importAccountBtn}>
          Forgot Password? Import Account
        </TouchableOpacity>
      </View>

      <Button
        block
        style={styles.loginBtn}
        variant="primary"
        disabled={!password?.length}
        onPress={handleLogin}
      >
        Log In
      </Button>
      <hr style={styles.divider} />

      <View style={styles.noAccountBtnContainer}>
        <TouchableOpacity onPress={handleCreateAccount} style={styles.noAccountBtn}>
          No account yet? Sign Up
        </TouchableOpacity>
      </View>
    </Auth>
  );
};
