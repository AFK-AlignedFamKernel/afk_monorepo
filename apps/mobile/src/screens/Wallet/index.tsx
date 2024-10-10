import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextButton } from '../../components';
import { Swap } from '../../components/Swap';
import TabSelector from '../../components/TabSelector';
import { TOKENSMINT } from '../../constants/tokens';
import { useStyles } from '../../hooks';
import { LightningNetworkWalletView } from '../../modules/Lightning';
import { WalletScreen } from '../../types';
import { SelectedTab, TABS_WALLET } from '../../types/tab';
import stylesheet from './styles';
import { CashuWalletView } from '../../modules/Cashu';
import { LayerswapView } from '../../modules/Bridge/layerswap';

export const Wallet: React.FC<WalletScreen> = ({ navigation }) => {
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.CASHU_WALLET);

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
      <ScrollView>
        <KeyboardAvoidingView behavior="padding" style={styles.content}>
          <TabSelector
            activeTab={selectedTab}
            handleActiveTab={handleTabSelected}
            buttons={TABS_WALLET}
            addScreenNavigation={false}
          ></TabSelector>
          <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>

            {selectedTab == SelectedTab.BRIDGE_LAYERSWAP && (
              <>
                <LayerswapView />
              </>
            )}


            {selectedTab == SelectedTab.CASHU_WALLET && (
              <View>
                <Text style={styles.text}>Cashu wallet coming soon</Text>
                <CashuWalletView></CashuWalletView>
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

          </SafeAreaView>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
};
