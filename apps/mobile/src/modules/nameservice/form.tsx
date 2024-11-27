import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SquareInput, TextButton } from '../../components';
import { Swap } from '../../components/Swap';
import TabSelector from '../../components/TabSelector';
import { TOKENSMINT } from '../../constants/tokens';
import { useStyles } from '../../hooks';
import { WalletOnboarding } from '../Onboard/wallet';
import { MainStackNavigationProps } from '../../types';
import { SelectedTab, TABS_NAMESERVICE, TABS_ONBOARDING_WALLET } from '../../types/tab';
import { CashuWalletView } from '../CashuWallet';
import { LightningNetworkWalletView } from '../Lightning';
import stylesheet from './styles';
import { useNameservice } from '../../hooks/nameservice/useNameservice';
import { useToast, useWalletModal } from '../../hooks/modals';
import { useAccount } from '@starknet-react/core';

export const FormComponent: React.FC = () => {
  const styles = useStyles(stylesheet);
  const { account } = useAccount()
  const { handleBuyUsername } = useNameservice()
  const [username, setUsername] = useState<string | undefined>()
  const walletModal = useWalletModal()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = async () => {
    if (!username) {
      showToast({ title: "Please enter a name", type: "info" });
      return;
    }
    setIsVerifying(true);
    try {
      // TODO: Add verification when backend is ready
      setIsVerified(true);
      showToast({ title: "Name is available!", type: "success" });
    } catch (error) {
      showToast({ title: "Name verification failed", type: "error" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBuy = async () => {
    if (!isVerified) {
      showToast({ title: "Please verify name first", type: "info" });
      return;
    }
    
    if (isLoading) return;
    
    if (!username) {
      showToast({ title: "Please enter a name", type: "info" });
      return;
    }
    
    setIsLoading(true);
    try {
      if (!account?.address) {
        walletModal.show();
        return;
      }

      await handleBuyUsername(account, username);
      showToast({ title: "Name purchased successfully!", type: "success" });
    } catch (error) {
      showToast({ title: "Failed to purchase name", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buy Nameservice</Text>
      
      <View style={styles.faucetContainer}>
        <Text style={styles.faucetText}>
          Need funds? Get test tokens from Starknet Sepolia faucet
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <SquareInput
          style={styles.input}
          placeholder="Enter name to register"
          onChangeText={(text) => {
            setUsername(text);
            setIsVerified(false);
          }}
          value={username}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          style={styles.button}
          onPress={handleVerify}
          disabled={isVerifying || !username}
        >
          {isVerifying ? 'Verifying...' : 'Verify name'}
        </Button>

        <Button 
          style={styles.button}
          onPress={handleBuy}
          disabled={!isVerified || isLoading}
        >
          {isLoading ? 'Buying...' : 'Buy nameservice'}
        </Button>
      </View>
    </View>
  );
};
