import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
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
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.DYNAMIC_GENERAL,
  );

  const { account } = useAccount()

  const { handleBuyUsername } = useNameservice()
  const [username, setUsername] = useState<string | undefined>()

  const walletModal = useWalletModal()
  const { showToast } = useToast()
  const handleBuy = async () => {


    if (!account?.address) {
      walletModal.show();

      // const result = await waitConnection();
      // if (!result) return;
    }


    if (!account) {

      return showToast({ title: "Please connect you", type: "info" })
    }

    if (!username) {
      return showToast({ title: "Please choose an username", type: "info" })
    }
    handleBuyUsername(account, username)
  }
  const navigation = useNavigation<MainStackNavigationProps>();
  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    // if (screen) {
    //   navigation.navigate(screen as any);
    // }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <KeyboardAvoidingView behavior="padding" style={styles.content}>
          <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>

            <View>

              <Text
                style={styles.text}
              >Buy nameservice</Text>

              <SquareInput
                placeholder="Your name"
                onChangeText={setUsername}
                // onBlur={handleBlur('symbol')}
                value={username}
              // error={errors.symbol}
              />

              <Button onPress={() => {
                // onSubmitPress(TypeCreate.CREATE_AND_LAUNCH)
              }

              }

              >
                Verify name
              </Button>

              <Button onPress={() => {
                handleBuy()
                // onSubmitPress(TypeCreate.CREATE_AND_LAUNCH)
              }
              } >
                Buy nameservice
              </Button>




            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ScrollView>
    </View >
  );
};
