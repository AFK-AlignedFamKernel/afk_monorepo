import {useState} from 'react';
import {KeyboardAvoidingView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {TextButton} from '../../components';
import {Swap} from '../../components/Swap';
import TabSelector from '../../components/TabSelector';
import {TOKENS} from '../../constants/tokens';
import {useStyles} from '../../hooks';
import {LightningNetworkWalletView} from '../../modules/Lightning';
import {DefiScreenProps} from '../../types';
import {SelectedTab, TABS_DEFI} from '../../types/tab';
import stylesheet from './styles';

export const Defi: React.FC<DefiScreenProps> = ({navigation}) => {
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.BTC_FI_VAULT);

  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <TextButton style={styles.cancelButton} onPress={navigation.goBack}>
          Cancel
        </TextButton>
      </SafeAreaView>

      <KeyboardAvoidingView behavior="padding" style={styles.content}>
        <TabSelector
          activeTab={selectedTab}
          handleActiveTab={handleTabSelected}
          buttons={TABS_DEFI}
          addScreenNavigation={false}
        ></TabSelector>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>
          <Text style={styles.text}>DeFi, Ramp and more soon. Stay tuned for the AFK Fi</Text>

          {selectedTab == SelectedTab.BTC_FI_VAULT && (
            <View style={{display: 'flex', alignItems: 'center'}}>
              <Swap
                tokensIns={TOKENS}
                tokenOut={TOKENS.WBTC}
                onPress={() => console.log('pressed!')}
                calculRewardCallback={function (): void {
                  console.log('Calcul rewards');
                }}
              />
            </View>
          )}

          {selectedTab == SelectedTab.BTC_BRIDGE && (
            <View>
              <Text style={styles.text}>Brdige coming soon</Text>
            </View>
          )}

          {selectedTab == SelectedTab.LIGHTNING_NETWORK_WALLET && (
            <View>
              <Text style={styles.text}>Brdige coming soon</Text>
              <LightningNetworkWalletView></LightningNetworkWalletView>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
