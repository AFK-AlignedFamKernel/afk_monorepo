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

export const FormComponent: React.FC = () => {
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.DYNAMIC_GENERAL,
  );

  const [username, setUsername] = useState<string | undefined>()

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

              <Text>Buy nameservice</Text>

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
