import {useTheme} from '@react-navigation/native';
import {useAuth} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';

import {CopyIconStack, LockIcon} from '../../assets/icons';
import {useToast} from '../../hooks/modals';
import {getPublicKeyFromSecret} from '../../utils/keypair';
import {
  retrieveAndDecryptPrivateKey,
  retrievePassword,
  retrievePublicKey,
} from '../../utils/storage';
import {Button} from '../Button';
import {Input} from '../Input';
import {Text} from '../Text';
import styles from './styles';
import {useWindowDimensions} from '../../hooks';

export const PrivateKeyImport: React.FC = () => {
  const {publicKey, isExtension, privateKey, setAuth} = useAuth();
  const [isPasswordOk, setIsPasswordOk] = useState(false);
  const theme = useTheme();
  const {showToast} = useToast();
  const [password, setPassword] = useState('');

  const {width} = useWindowDimensions();

  const handleCopy = async (type: 'privateKey' | 'publicKey') => {
    await Clipboard.setStringAsync(type === 'privateKey' ? privateKey : publicKey);
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

  const handlePassword = async () => {
    if (!password) {
      showToast({type: 'error', title: 'Password is required'});
      return;
    }

    /** TODO fix in web */
    // const passwordRetrieve = await retrievePassword();
    // if (password != passwordRetrieve) {
    //   showToast({type: 'error', title: 'Invalid password'});
    //   return;
    // }
    const privateKey = await retrieveAndDecryptPrivateKey(password);
    if (!privateKey || privateKey.length !== 32) {
      showToast({type: 'error', title: 'Invalid password'});
      return;
    }
    const privateKeyHex = privateKey.toString('hex');
    const storedPublicKey = await retrievePublicKey();
    const publicKey = getPublicKeyFromSecret(privateKeyHex);

    if (publicKey !== storedPublicKey) {
      setIsPasswordOk(false);
      showToast({type: 'error', title: 'Invalid password'});
      return;
    }
    setIsPasswordOk(true);
  };

  return (
    <View style={styles.container}>
      <Text>Enter your password to import your private key:</Text>

      <Input
        style={{height: 45}}
        left={<LockIcon color={theme.colors.primary} width={16} height={16} />}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
      />

      <View style={{alignItems: width >= 600 ? 'center' : undefined}}>
        <Button onPress={handlePassword} small>
          <Text>Enter password</Text>
        </Button>
      </View>

      {isPasswordOk && (
        <>
          <Text weight="semiBold" color="textSecondary">
            Your private key
          </Text>
          <Input
            value={privateKey}
            style={{height: 45}}
            editable={false}
            right={
              <TouchableOpacity
                onPress={() => handleCopy('privateKey')}
                style={{
                  marginRight: 10,
                }}
              >
                <CopyIconStack color={theme.colors.primary} />
              </TouchableOpacity>
            }
          />
        </>
      )}
    </View>
  );
};
