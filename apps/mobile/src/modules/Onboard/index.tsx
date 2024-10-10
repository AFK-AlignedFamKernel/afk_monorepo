import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextButton } from '../../components';
import { Swap } from '../../components/Swap';
import TabSelector from '../../components/TabSelector';
import { TOKENSMINT } from '../../constants/tokens';
import { useStyles } from '../../hooks';
import { LightningNetworkWalletView } from '../Lightning';
import { MainStackNavigationProps, OnboardingWalletScreen } from '../../types';
import { SelectedTab, TABS_ONBOARDING_WALLET, TABS_WALLET } from '../../types/tab';
import stylesheet from './styles';
import { CashuWalletView } from '../Cashu';
import { DynamicEmailSignIn } from './dynamic/DynamicEmailSignIn';
import { DynamicWalletOnboarding } from './dynamic';
import { useNavigation } from '@react-navigation/native';
import { WalletOnboarding } from '../../modules/Onboard/wallet';

export const OnboardingComponent: React.FC = () => {
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.DYNAMIC_GENERAL);

  const navigation = useNavigation<MainStackNavigationProps>()
  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    // if (screen) {
    //   navigation.navigate(screen as any);
    // }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <TextButton style={styles.cancelButton} onPress={navigation.goBack}>
          Cancel
        </TextButton>
      </SafeAreaView>
      <ScrollView>
        <KeyboardAvoidingView behavior="padding" style={styles.content}>
          <TabSelector
            activeTab={selectedTab}
            handleActiveTab={handleTabSelected}
            buttons={TABS_ONBOARDING_WALLET}
            addScreenNavigation={false}
          ></TabSelector>
          <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>

            {selectedTab == SelectedTab.DYNAMIC_GENERAL && (
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <DynamicWalletOnboarding />
              </View>
            )}

            {selectedTab == SelectedTab.GENERATE_INTERNAL_WALLET && (
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <WalletOnboarding />
              </View>
            )}

            {selectedTab == SelectedTab.BTC_FI_VAULT && (
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <Swap
                  tokensIns={TOKENSMINT}
                  tokenOut={TOKENSMINT.WBTC}
                  onPress={() => console.log('pressed!')}
                  calculRewardCallback={function (): void {
                    console.log('Calcul rewards');
                  }}
                />
              </View>
            )}

            {selectedTab == SelectedTab.LIGHTNING_NETWORK_WALLET && (
              <View>
                <Text style={styles.text}>Zap, Lightning wallet and NWC</Text>
                <LightningNetworkWalletView></LightningNetworkWalletView>
              </View>
            )}

            {selectedTab == SelectedTab.CASHU_WALLET && (
              <View>
                <Text style={styles.text}>Cashu wallet coming soon</Text>
                <CashuWalletView></CashuWalletView>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
};
