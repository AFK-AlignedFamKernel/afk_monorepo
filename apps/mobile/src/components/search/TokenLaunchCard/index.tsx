import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '@starknet-react/core';
import { useProfile } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { ImageSourcePropType, TouchableOpacity, View, Image } from 'react-native';

import { useStyles, useTheme, useWindowDimensions } from '../../../hooks';
import { useToast } from '../../../hooks/modals';
import { MainStackNavigationProps } from '../../../types';
import { TokenDeployInterface, TokenLaunchInterface } from '../../../types/keys';
import { getElapsedTimeStringFull } from '../../../utils/timestamp';
import { Icon } from '../../Icon';
import { Text } from '../../Text';
import stylesheet from './styles';
import { CopyIconStack } from 'src/assets/icons';
import { feltToAddress } from 'common';

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

export const TokenLaunchCard: React.FC<LaunchCoinProps> = ({
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
  const account = useAccount();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const navigation = useNavigation<MainStackNavigationProps>();

  const handleCopy = async () => {
    if (!token?.memecoin_address) return;
    await Clipboard.setStringAsync(token?.memecoin_address);
    showToast({ type: 'info', title: 'Copied to clipboard' });
  };

  const dimensions = useWindowDimensions();
  const isDesktop = useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]);

  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isExpandedSymbol, setIsExpandedSymbol] = useState<boolean>(false)

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>

      <View style={styles.detailRow}>
        {token?.block_timestamp ? (
          <Text style={styles.creationTime}>
            {getElapsedTimeStringFull(new Date(token?.block_timestamp).getTime())}
          </Text>
        ) : null}

        <View style={styles.addressContainer}>
          <TouchableOpacity onPress={handleCopy}>
            <CopyIconStack color={theme.colors.primary} />
            <Text
              // onPress={handleCopy} 
              numberOfLines={1}
              ellipsizeMode="middle"

              style={{
                // color: '#808080', 
                flex: 1, flexWrap: 'wrap',
                // width: "50%"
              }}>
              {token?.memecoin_address ?
                `${feltToAddress(BigInt(token.memecoin_address)).slice(0, 6)}...${feltToAddress(BigInt(token.memecoin_address)).slice(token?.memecoin_address?.length - 5, token?.memecoin_address?.length - 1)}`
                : ''}

            </Text>

          </TouchableOpacity>

        </View>
        {/* <View style={styles.priceTag}>
          <Text style={styles.text}>Price: {Number(token?.price || 0).toFixed(4)}</Text>

        </View> */}
      </View>


      {token?.is_liquidity_added &&
        <View>
          <Icon name="CheckIcon" size={15} />
          <Text style={{ fontSize: 10, fontStyle: "italic" }}>Graduated</Text>
        </View>
      }
      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => setIsExpandedSymbol(!isExpandedSymbol)}>
          {token?.symbol ? <Text
            numberOfLines={isExpandedSymbol ? undefined : 1}
            ellipsizeMode="tail"
            style={styles.tokenSymbol}>{token.symbol}</Text> : null}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}>
          <Text
            numberOfLines={isExpanded ? undefined : 1}
            ellipsizeMode="tail"
            style={styles.tokenName}>${token?.name || ""}</Text>
        </TouchableOpacity>

        {/* <View style={styles.priceTag}>
          <Text style={styles.text}>Price: {Number(token?.price || 0).toFixed(4)} Meme/STRK</Text>

        </View> */}
        {/* <Text style={styles.price}>MC {Number(token?.market_cap || 0).toFixed(4)}</Text> */}
      </View>


      <View style={styles.imageContainer}>
        {token?.url &&
          <Image source={{ uri: token?.url }} style={[styles.contentImage,
            // {
            //   // height: dimensionsMedia[1],
            //   // aspectRatio: getImageRatio(postSource.width, postSource.height),
            // },
          ]} />
        }
      </View>


      <View style={styles.divider} />
      {
        token?.threshold_liquidity && (
          <View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Raised Progress</Text>
              <Text style={styles.value}>
                {Number(token?.liquidity_raised || 0).toLocaleString()} /{' '}
                {Number(token?.threshold_liquidity).toLocaleString()}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  Number(token.liquidity_raised) <=
                    Number(token.threshold_liquidity) - Number(token.threshold_liquidity) * 0.02
                    ? styles.progressBarFillWarn
                    : styles.progressBarFill,
                  {
                    width: `${Math.min(
                      (Number(token?.liquidity_raised || 0) / Number(token?.threshold_liquidity)) *
                      100,
                      100,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        )
      }
      <View style={styles.stats}>
        <View style={styles.statContainer}>
          {/* <Icon name="MaxSupplyIcon" size={22} fill="black" /> */}
          <Icon name="SupplyIcon" size={22} fill="black" />
          <Text style={styles.statValue}>{Number(token?.total_supply || 0).toLocaleString()}</Text>
        </View>
        {/* <View style={styles.statContainer}>
          <Icon name="MaxSupplyIcon" size={22} fill="black" />
          <Text style={styles.statValue}>{Number(token?.market_cap || 0).toLocaleString()}</Text>
        </View> */}
        {/* <View style={styles.statContainer}>
          <Icon name="TokenHolderIcon" size={22} fill="black" />
          <Text style={styles.statValue}>{Number(token?.token_holded || 0).toLocaleString()}</Text>
        </View> */}
        {/* 
        <View style={styles.statContainer}>
          <View style={styles.priceTag}>
            <Text style={styles.text}>Price: {Number(token?.price || 0).toFixed(4)}</Text>

          </View>
        </View> */}
      </View>

      {
        !isViewDetailDisabled && (
          <>
            {!isTokenOnly && (
              <TouchableOpacity
                onPress={() => {
                  if (token && token?.memecoin_address) {
                    navigation.navigate('LaunchDetail', {
                      coinAddress: token?.memecoin_address,
                    });
                  }
                }}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>View details</Text>
              </TouchableOpacity>
            )}
            {isTokenOnly && (
              <TouchableOpacity
                onPress={() => {
                  if (token && token?.memecoin_address) {
                    navigation.navigate('LaunchDetail', {
                      coinAddress: token?.memecoin_address,
                    });
                  }
                }}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>View token page</Text>
              </TouchableOpacity>
            )}
          </>
        )
      }
    </View >
  );
};
