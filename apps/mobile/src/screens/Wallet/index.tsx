import {useState} from 'react';
import {KeyboardAvoidingView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {TextButton} from '../../components';
import {Swap} from '../../components/Swap';
import TabSelector from '../../components/TabSelector';
import {TOKENSMINT} from '../../constants/tokens';
import {useStyles} from '../../hooks';
import {LightningNetworkWalletView} from '../../modules/Lightning';
import {WalletScreenBTC} from '../../types';
import {SelectedTab, TABS_DEFI} from '../../types/tab';
import stylesheet from './styles';
import {CashuWalletView} from '../../modules/Cashu';

export const WalletBTC: React.FC<WalletScreenBTC> = ({navigation}) => {
  const styles = useStyles(stylesheet);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(
    SelectedTab.LIGHTNING_NETWORK_WALLET,
  );

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
          {/* <Text style={styles.text}>DeFi, Ramp and more soon. Stay tuned for the AFK Fi</Text> */}

          {selectedTab == SelectedTab.BTC_FI_VAULT && (
            <View style={{display: 'flex', alignItems: 'center'}}>
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
          {/* 
          {selectedTab == SelectedTab.BTC_BRIDGE && (
            <View>
              <Text style={styles.text}>Bridge coming soon</Text>
            </View>
          )} */}

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
    </View>
  );
};
