import { useNavigation, useTheme } from '@react-navigation/native';
import { Image, ImageSourcePropType, Pressable, TouchableOpacity, View } from 'react-native';
import { Text } from '../Text';
import styles from './styles';
import { useAuth, useProfile } from "afk_nostr_sdk"
import { Input } from '../Input';
import { CopyIconStack, LockIcon } from '../../assets/icons';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../../hooks/modals';
import { useState } from 'react';
import { retrieveAndDecryptPrivateKey, retrievePassword, retrievePublicKey } from '../../utils/storage';
import { getPublicKeyFromSecret } from '../../utils/keypair';


export const PrivateKeyImport: React.FC = () => {
  const { publicKey, isExtension, privateKey, setAuth } = useAuth()
  const [isPasswordOk, setIsPasswordOk] = useState(false)
  const theme = useTheme()
  const { showToast } = useToast();
  const [password, setPassword] = useState('');

  const handleCopy = async (type: 'privateKey' | 'publicKey') => {
    await Clipboard.setStringAsync(type === 'privateKey' ? privateKey : publicKey);
    showToast({ type: 'info', title: 'Copied to clipboard' });
  };

  const handlePassword = async () => {
    if (!password) {
      showToast({ type: 'error', title: 'Password is required' });
      return;
    }
    const passwordRetrieve = await retrievePassword()
    if (password != passwordRetrieve) {
      showToast({ type: 'error', title: 'Invalid password' });
      return;
    }
    const privateKey = await retrieveAndDecryptPrivateKey(password);
    if (!privateKey || privateKey.length !== 32) {
      showToast({ type: 'error', title: 'Invalid password' });
      return;
    }
    const privateKeyHex = privateKey.toString('hex');
    const storedPublicKey = await retrievePublicKey();
    const publicKey = getPublicKeyFromSecret(privateKeyHex);

    if (publicKey !== storedPublicKey) {
      setIsPasswordOk(false)
      showToast({ type: 'error', title: 'Invalid password' });
      return;
    }
    setIsPasswordOk(true)

  };

  return (
    <View style={styles.container}>
      <Text>Enter your password to import your private key</Text>

      <Input
        left={<LockIcon color={theme.colors.primary} />}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
      />

      <Pressable onPress={handlePassword}>
        <Text>Enter password</Text>
      </Pressable>

      {isPasswordOk &&
        <>
          <Text weight="semiBold" color="textSecondary">
            Your private key
          </Text>
          <Input
            value={privateKey}
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


      }


    </View>
  );
};
