import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '@starknet-react/core';
import { useProfile } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import { ImageSourcePropType, TouchableOpacity, View } from 'react-native';

import { CopyIconStack } from '../../../assets/icons';
import { useStyles, useTheme } from '../../../hooks';
import { useToast } from '../../../hooks/modals';
import { MainStackNavigationProps } from '../../../types';
import { TokenDeployInterface, TokenLaunchInterface } from '../../../types/keys';
import { feltToAddress } from '../../../utils/format';
import { Button } from '../..';
import { Text } from '../../Text';
import stylesheet from './styles';
import { useLaunchToken } from '../../../hooks/launchpad/useLaunchToken';
import { AddLiquidityForm } from '../../AddLiquidityForm';
import { useModal } from '../../../hooks/modals/useModal';
import { useState } from 'react';

export type LaunchCoinProps = {
  imageProps?: ImageSourcePropType;
  name?: string;
  event?: NDKEvent;
  profileProps?: NDKUserProfile;
  token?: TokenDeployInterface;
  dataMeged?: LaunchCoinProps;
  launch?: TokenLaunchInterface;
  isViewDetailDisabled?: boolean;
  isTokenOnly?: boolean;
};

enum AmountType {
  QUOTE_AMOUNT,
  COIN_AMOUNT_TO_BUY,
}

export const TokenCard: React.FC<LaunchCoinProps> = ({
  token,
  launch,
  imageProps,
  name,
  profileProps,
  event,
  isViewDetailDisabled,
  isTokenOnly,
}) => {
  const { data: profile } = useProfile({ publicKey: event?.pubkey });
  const { account } = useAccount();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  const { handleLaunchCoin } = useLaunchToken();
  const { show: showModal } = useModal();

  const handleCopy = async () => {
    if (!token?.memecoin_address) return;
    await Clipboard.setStringAsync(token?.memecoin_address);
    showToast({ type: 'info', title: 'Copied to clipboard' });
  };


  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isExpandedSymbol, setIsExpandedSymbol] = useState<boolean>(false)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text
            numberOfLines={isExpanded ? undefined : 1}
            ellipsizeMode="tail"
            style={styles.tokenName}
          >
            {token?.name || 'Unnamed Token'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsExpandedSymbol(!isExpandedSymbol)}>
          <Text
            numberOfLines={isExpandedSymbol ? undefined : 1}
            ellipsizeMode="tail"
            style={styles.symbolName}>{token?.symbol || 'Unnamed Symbol'}</Text>
        </TouchableOpacity>
        <View style={styles.addressContainer}>
          <TouchableOpacity onPress={handleCopy}>

            <Text
              // onPress={handleCopy} 
              numberOfLines={1} ellipsizeMode="middle" style={{ color: '#808080', flex: 1 }}>
              {token?.memecoin_address ? feltToAddress(BigInt(token.memecoin_address)) : ''}
            </Text>
          </TouchableOpacity>

          <CopyIconStack color={theme.colors.primary} />
        </View>
        <View style={styles.priceTag}>
          {/* <Text style={{ color: '#4CAF50' }}>${Number(token?.price || 0).toFixed(4)}</Text> */}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Supply</Text>
          <Text style={styles.statValue}>{Number(token?.total_supply || 0).toLocaleString()}</Text>
        </View>
{/* 
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Network</Text>
          <Text style={styles.statValue}>{token?.network || '-'}</Text>
        </View> */}
      </View>

      {account && account?.address == token?.owner && (
        <View>
          <Button
            onPress={() => {
              handleLaunchCoin(account, token?.memecoin_address);
            }}
          >
            Launch your coin
          </Button>

          <AddLiquidityForm tokenAddress={token?.memecoin_address} />
        </View>
      )}

      {!isViewDetailDisabled && (
        <>
          <Button
            onPress={() => {
              if (token && token?.memecoin_address) {
                navigation.navigate('LaunchDetail', {
                  coinAddress: token?.memecoin_address,
                });
              }
            }}
            style={styles.actionButton}
          >
            View token page
          </Button>

          <Button
            onPress={() => {
              if (token?.memecoin_address) {
                showModal(<AddLiquidityForm tokenAddress={token.memecoin_address} />);
              }
            }}
          >
            Add Liquidity
          </Button>
        </>
      )}
    </View>
  );
};
