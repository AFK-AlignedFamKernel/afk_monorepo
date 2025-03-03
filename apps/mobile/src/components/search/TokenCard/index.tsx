import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '@starknet-react/core';
import { useProfile } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import { ImageSourcePropType, TextInput, TouchableOpacity, View, Image } from 'react-native';

import { CopyIconStack } from '../../../assets/icons';
import { useStyles, useTheme } from '../../../hooks';
import { useToast } from '../../../hooks/modals';
import { MainStackNavigationProps } from '../../../types';
import { TokenDeployInterface, TokenLaunchInterface } from '../../../types/keys';
import { feltToAddress } from '../../../utils/format';
import { Button, Icon, Modal } from '../..';
import { Text } from '../../Text';
import stylesheet from './styles';
import { useLaunchToken } from '../../../hooks/launchpad/useLaunchToken';
import { AddLiquidityForm } from '../../AddLiquidityForm';
import { useModal } from '../../../hooks/modals/useModal';
import { useState } from 'react';
import { getElapsedTimeStringFull } from '../../../utils/timestamp';
import { useMetadataLaunch } from '../../../hooks/launchpad/useMetadataLaunch';
import { FormMetadata } from './form-metadata';

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
  const [isOpenAdmin, setIsOpenAdmin] = useState<boolean>(false);


  const { addMetadata } = useMetadataLaunch();
  const { handleLaunchCoin } = useLaunchToken();
  const { show: showModal } = useModal();

  const handleCopy = async () => {
    if (!token?.memecoin_address) return;
    await Clipboard.setStringAsync(token?.memecoin_address);
    showToast({ type: 'info', title: 'Copied to clipboard' });
  };


  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isExpandedSymbol, setIsExpandedSymbol] = useState<boolean>(false)
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);


  const [metadata, setMetadata] = useState<{
    url: string;
    nostr_event_id: string;
  }>({
    url: '',
    nostr_event_id: '',
  });
  const handleAddMetadata = async () => {
    if (!token?.memecoin_address) return;

    if (!account) {
      showToast({ type: 'error', title: 'Please connect your account' });
      return;
    };


    // upload image/video to IPFS

    // const image = await uploadImageToIPFS(image);

    let url = '';
    let nostr_event_id = 0;

    await addMetadata(account, {
      coin_address: token?.memecoin_address,
      url,
      nostr_event_id: nostr_event_id?.toString()
    });
  }


  // console.log("token", token)
  // console.log("url metadata", token?.url)

  return (
    <View style={styles.container}>

      {isModalVisible && (

        <FormMetadata
          token={token}
          launch={launch}
          imageProps={imageProps}
          name={name}
          profileProps={profileProps}
          isModalVisibleProps={isModalVisible}
          setIsModalVisibleProps={setIsModalVisible}
          isButtonOpenVisible={true}
        />
      )}
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }
        }>

        {token?.is_launched &&
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 10
            }}
          >
            <Icon name="CheckIcon" size={15} />
            <Text style={{ fontSize: 10, fontStyle: "italic" }}>Launched in Bonding curve</Text>
          </View>
        }

        {token?.block_timestamp && (
          <Text>Created {getElapsedTimeStringFull(new Date(token?.block_timestamp).getTime())}</Text>
        )}


      </View>

      <View>

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
                `${feltToAddress(BigInt(token.memecoin_address)).slice(0, 6)}...${feltToAddress(BigInt(token.memecoin_address)).slice(token?.memecoin_address?.length - 4, token?.memecoin_address?.length)}`
                : ''}
            </Text>

          </TouchableOpacity>

        </View>
      </View>

      <View style={styles.header}>

        <TouchableOpacity onPress={() => setIsExpandedSymbol(!isExpandedSymbol)}>
          <Text
            numberOfLines={isExpandedSymbol ? undefined : 1}
            ellipsizeMode="tail"
            style={styles.symbolName}>{token?.symbol || 'Unnamed Symbol'}</Text>
        </TouchableOpacity>


        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text
            numberOfLines={isExpanded ? undefined : 1}
            ellipsizeMode="tail"
            style={styles.tokenName}
          >
            {token?.name || 'Unnamed Token'}
          </Text>
        </TouchableOpacity>

        {/* <View style={styles.priceTag}>
          <Text style={{ color: '#4CAF50' }}>${Number(token?.price || 0).toFixed(4)}</Text>
        </View>

        <View style={styles.priceTag}>
          <Text style={styles.text}>${Number(token?.market_cap || 0).toFixed(4)}</Text>
        </View> */}
        {/* 
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
                `${feltToAddress(BigInt(token.memecoin_address)).slice(0, 6)}...${feltToAddress(BigInt(token.memecoin_address)).slice(token?.memecoin_address?.length - 4, token?.memecoin_address?.length)}`
                : ''}
            </Text>

          </TouchableOpacity>

        </View> */}


        {token?.url && (
          <View>
            <Image
              source={{ uri: token?.url }}
              style={{ width: 100, height: 100 }}
            />

          </View>
        )}

        {token?.description &&
          <Text>{token?.description}</Text>
        }

        {token?.nostr_id &&
          <Text>{token?.nostr_id}</Text>
        }

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




      {
        token?.owner_address &&
        account && account?.address == token?.owner_address && (
          <View>

            <Button
              onPress={() => {
                setIsOpenAdmin(!isOpenAdmin);
              }}
            >
              Open admin
            </Button>

            {isOpenAdmin && (

              <>
                <Button
                  onPress={() => {
                    handleLaunchCoin(account, token?.memecoin_address);
                  }}
                >
                  Launch your coin
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

                <Button
                  onPress={() => {
                    if (token?.memecoin_address) {
                      setIsModalVisible(true);
                    }
                  }}
                >
                  Add Metadata
                </Button>
              </>
            )}

            {/* <AddLiquidityForm tokenAddress={token?.memecoin_address} /> */}

          </View>
        )
      }

      {
        token?.owner_address &&
        account && account?.address == token?.owner_address && !token?.is_launched && (
          <View>


            {isOpenAdmin && (

              <>
                <Button
                  onPress={() => {
                    handleLaunchCoin(account, token?.memecoin_address);
                  }}
                >
                  Launch your coin
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

            {/* <AddLiquidityForm tokenAddress={token?.memecoin_address} /> */}

          </View>
        )
      }


      {
        !isViewDetailDisabled && (
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

            {/* <Button
            onPress={() => {
              if (token?.memecoin_address) {
                showModal(<AddLiquidityForm tokenAddress={token.memecoin_address} />);
              }
            }}
          >
            Add Liquidity
          </Button> */}
          </>
        )
      }
    </View >
  );
};
