import { useAccount, useProvider } from '@starknet-react/core';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useStyles, useTheme, useTips, useWaitConnection } from '../../hooks';
import { useToast, useTransaction, useTransactionModal, useWalletModal } from '../../hooks/modals';
import { LaunchDetailScreenProps, MainStackNavigationProps } from '../../types';
import stylesheet from './styles';
import { useNostrContext } from 'afk_nostr_sdk';
import { SelectedTab } from '../../types/tab';
import { useDataCoins } from '../../hooks/launchpad/useDataCoins';
import { TokenLaunchInterface } from '../../types/keys';
import { TokenLaunchDetail } from '../../components/TokenLaunchDetail';

export const LaunchDetail: React.FC<LaunchDetailScreenProps> = ({ navigation, route, }) => {
  // export const LaunchDetails: React.FC<LaunchpadScreenProps> = () => {

  const { coinAddress, launch: launchParams } = route.params

  if (!coinAddress) {
    return <>
      <View>
        <Text>No coin address found</Text>
      </View></>
  }

  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const [loading, setLoading] = useState<false | number>(false);
  const { ndk } = useNostrContext();
  const { provider } = useProvider();
  const account = useAccount();
  const [launch, setLaunch] = useState<TokenLaunchInterface | undefined>(launchParams)

  const { getCoinLaunchByAddress } = useDataCoins();
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  useEffect(() => {
    const getData = async () => {
      const launchData = await getCoinLaunchByAddress(coinAddress)
      console.log("launchData", launchData)
      setLaunch(launchData)
      setFirstLoadDone(true)
    }

    if (coinAddress && !launch) {
      getData()

    }
  }, [coinAddress])
  // const navigation = useNavigation<MainStackNavigationProps>();

  const [selectedTab, setSelectedTab] = useState<SelectedTab | undefined>(SelectedTab.TIPS);
  const handleTabSelected = (tab: string | SelectedTab, screen?: string) => {
    setSelectedTab(tab as any);
    if (screen) {
      navigation.navigate(screen as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* <Header showLogo /> */}
      <Text style={styles.text}>Launchpad to Pump it</Text>
      <Text style={styles.text}>LFG</Text>

      {launch &&
        <TokenLaunchDetail isViewDetailDisabled={true} launch={launch}></TokenLaunchDetail>

      }
      <Text style={styles.text}>Coming soon</Text>

      <View
      >
        <View ><Text style={styles.text}>Overview </Text></View>

        <View><Text style={styles.text}>Graph</Text></View>
        <View><Text style={styles.text}>Holders</Text></View>
        <View><Text style={styles.text}>TX </Text></View>

      </View>
    </View>
  );
};
