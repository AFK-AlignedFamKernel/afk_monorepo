// import {useAuth} from '../../store/auth';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import { TouchableOpacity, View } from 'react-native';

import { CopyIconStack } from '../../../assets/icons';
import { InfoIcon } from '../../../assets/icons';
import { Button, Input, Text } from '../../../components';
import { useStyles, useTheme } from '../../../hooks';
import { useDialog, useToast } from '../../../hooks/modals';
import { Auth } from '../../../modules/Auth';
import { AuthSaveKeysScreenProps, MainStackNavigationProps } from '../../../types';
import stylesheet from './styles';

export const SaveKeys: React.FC<AuthSaveKeysScreenProps> = ({ route }) => {
  const { privateKey, publicKey, seed } = route.params;

  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const setAuth = useAuth((state) => state.setAuth);
  const { showToast } = useToast();
  const { showDialog, hideDialog } = useDialog();

  const navigation = useNavigation<MainStackNavigationProps>();
  // const navigation = useNavigation();
  const handleCopy = async (type: 'privateKey' | 'publicKey' | 'seed') => {
    await Clipboard.setStringAsync(type === 'privateKey' ? privateKey : publicKey);
    if (type === 'seed' && seed) {
      await Clipboard.setStringAsync(seed);
    }
    showToast({ type: 'info', title: 'Copied to clipboard' });
  };

  const handleContinue = () => {
    showDialog({
      title: 'Saved your Private key',
      description: 'Please send your Nostr private key somewhere safe.',
      buttons: [
        {
          type: 'secondary',
          label: 'Copy private key',
          onPress: async () => {
            handleCopy('privateKey');
            hideDialog();
          },
        },
        {
          type: 'primary',
          label: 'Yes',
          onPress: async () => {
            setAuth(publicKey, privateKey);
            hideDialog();
            // navigation.navigate("Feed")
            navigation.navigate('Profile', { publicKey });
          },
        },
        {
          type: 'default',
          label: 'No',
          onPress: hideDialog,
        },
      ],
    });
  };

  return (
    <Auth title="Save your keys">
      <View style={styles.inputWithLabel}>
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
      </View>

      <View style={styles.inputWithLabel}>
        <Text weight="semiBold" color="textSecondary">
          Your public key
        </Text>
        <Input
          value={publicKey}
          editable={false}
          right={
            <TouchableOpacity
              onPress={() => handleCopy('publicKey')}
              style={{
                marginRight: 10,
              }}
            >
              <CopyIconStack color={theme.colors.primary} />
            </TouchableOpacity>
          }
        />
      </View>


      {seed &&
        <View style={styles.inputWithLabel}>
          <Text weight="semiBold" color="textSecondary">
            Your seed for Cashu & BTC
          </Text>
          <Input
            value={seed}
            editable={false}
            right={
              <TouchableOpacity
                onPress={() => handleCopy('seed')}
                style={{
                  marginRight: 10,
                }}
              >
                <CopyIconStack color={theme.colors.primary} />
              </TouchableOpacity>
            }
          />
        </View>
      }

      <View style={styles.warning}>
        <InfoIcon width={20} height={20} color={theme.colors.primary} />

        <Text color="primary" weight="medium" fontSize={13}>
          Your private key is your identity, if you lose this key, you will lose access to your
          account.
        </Text>
      </View>

      <Button block variant="secondary" onPress={handleContinue}>
        Continue
      </Button>
    </Auth>
  );
};
