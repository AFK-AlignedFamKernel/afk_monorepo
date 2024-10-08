import {useState} from 'react';
import {KeyboardAvoidingView, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {TextButton} from '../../components';
import {Swap} from '../../components/Swap';
import {TokenSwap} from '../../components/TokenSwap';
import TabSelector from '../../components/TabSelector';
import {TOKENSMINT} from '../../constants/tokens';
import {useStyles} from '../../hooks';
import {CashuWalletView} from '../../modules/Cashu';
import {LightningNetworkWalletView} from '../../modules/Lightning';
import {DefiScreenProps} from '../../types';
import {SelectedTab, TABS_DEFI} from '../../types/tab';
import stylesheet from './styles';

export const Defi: React.FC<DefiScreenProps> = ({navigation}) => {
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
            {selectedTab == SelectedTab.SWAP_AVNU && (
              <View style={{display: 'flex', alignItems: 'center'}}>
                <TokenSwap onPress={() => console.log('pressed!')} />
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
                <CashuWalletView></CashuWalletView>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
};
