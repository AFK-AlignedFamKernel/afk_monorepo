import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '@starknet-react/core';
import { useProfile } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import { ImageSourcePropType, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  return (
    <View style={styles.container}>

      {isModalVisible && (
        <Modal
        >
          <View>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Token Metadata</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter title"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description" 
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Media</Text>
                <View style={styles.mediaUpload}>
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={() => {
                      // Handle media upload
                    }}
                  >
                    <Text style={styles.uploadButtonText}>Upload Image/Video</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={() => {
                    // Handle form submission
                    setIsModalVisible(false);
                  }}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
            </View>
        </Modal>
      )}
      <View
        style={{
          display: "flex", flexDirection: "column",
          gap: 10
        }
        }>
        {token?.block_timestamp && (
          <Text>Created {getElapsedTimeStringFull(new Date(token?.block_timestamp).getTime())}</Text>
        )}

        {token?.is_launched &&
          <View
            style={{
              display: "flex", flexDirection: "row",
              gap: 10
            }}
          >
            <Icon name="CheckIcon" size={15} />
            <Text style={{ fontSize: 10, fontStyle: "italic" }}>Launched in Bonding curve</Text>
          </View>
        }
      </View>

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

      {
        token?.owner_address &&
        account && account?.address == token?.owner_address && !token?.is_launched && (
          <View>
            <Button
              onPress={() => {
                handleLaunchCoin(account, token?.memecoin_address);
              }}
            >
              Launch your coin
            </Button>

            {/* <AddLiquidityForm tokenAddress={token?.memecoin_address} /> */}
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
