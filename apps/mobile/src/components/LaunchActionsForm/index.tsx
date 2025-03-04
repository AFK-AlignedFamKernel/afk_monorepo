import { useAccount } from '@starknet-react/core';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View, Animated } from 'react-native';

import { useStyles } from '../../hooks';
import { useWalletModal } from '../../hooks/modals';
import { useBalanceUtil } from '../../starknet/evm/utilHook';
import { LaunchDataMerged, UserShareInterface } from '../../types/keys';
import { Button } from '../Button';
import { Input } from '../Input';
import { Text } from '../Text';
import stylesheet from './styles';
import { formatNumber, numericValue } from '../../utils/format';
import { IconButton } from '../IconButton';
import { LoadingSpinner } from '../Loading';

export type LaunchActionsFormProps = {
  onBuyPress: () => void;
  onSellPress: () => void;
  onHandleAction: (amountProps?: number) => void;
  onChangeText: (e: any) => void;
  // onSetAmount: (e: number) => void;
  onSetAmount: (e?: string) => void;
  typeAction?: 'BUY' | 'SELL';
  setTypeAction?: (type: 'BUY' | 'SELL') => void;
  launch?: LaunchDataMerged;
  amount?: string;
  userShare?: { data: UserShareInterface };
  refetchCoinBalance?: () => void;
  coinBalanceLoading?: boolean
};

enum AmountType {
  QUOTE_AMOUNT,
  COIN_AMOUNT_TO_BUY,
}
export const LaunchActionsForm: React.FC<LaunchActionsFormProps> = ({
  launch,
  amount,
  userShare,
  setTypeAction,
  typeAction,
  onBuyPress,
  onSellPress,
  onHandleAction,
  onChangeText,
  onSetAmount,
  refetchCoinBalance,
  coinBalanceLoading
}) => {
  const styles = useStyles(stylesheet);
  const walletModal = useWalletModal();


  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();
      // const result = await waitConnection();
      // if (!result) return;
    }
  };

  const account = useAccount();
  const [isActive, setIsActive] = useState(false);

  const [typeAmount, setTypeAmount] = useState<AmountType>(AmountType.QUOTE_AMOUNT);

  const { data: toBalance } = useBalanceUtil({
    address: account?.address,
    token: launch?.quote_token,
  });

  const amountOwned = userShare?.data?.amount_owned 




  return (
    <View style={styles.container}>
      <View style={styles.tradingCard}>
        {/* Token Info Header */}
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenName}>{launch?.name || 'Token'}</Text>
          <Text style={styles.tokenPrice}>{`$${launch?.price || '0.00'}`}</Text>
        </View>

        {/* Buy/Sell Toggle */}
        <View style={styles.actionToggle}>
          <Button
            onPress={() => setTypeAction?.('BUY')}
            style={[
              styles.toggleButton,
              styles.buttonBuy,
              typeAction === 'BUY' && styles.activeToggle,
            ]}
          >
            Buy
          </Button>
          <Button
            onPress={() => setTypeAction?.('SELL')}
            style={[
              styles.toggleButton,
              styles.buttonSell,
              typeAction === 'SELL' && styles.activeToggle,
            ]}
          >
            Sell
          </Button>
        </View>

        {/* Amount Input */}

        <View style={styles.inputContainer}>
          <Input
            // keyboardType="decimal-pad"
            keyboardType="decimal-pad"
            inputMode="decimal"
            // keyboardType="numeric"
            // keyboardType=""
            style={styles.input}
            onChangeText={(e) => onChangeText(numericValue(e))}
            placeholder="Amount"
            // value={Number(amount?.toString())}
            value={amount?.toString()}
          // value={typeAction === 'BUY' ? amount?.toString() : userShare?.amount_owned?.toString()}
          />

          {account && account?.address &&
            <View>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Balance: {toBalance && Number(toBalance?.formatted) < 0 ? 0 : toBalance?.formatted}</Text>
                <Button
                  style={styles.maxButton}
                  onPress={() => {
                    if (typeAction === 'BUY') {
                      onSetAmount(toBalance?.formatted);
                    } else {
                      onSetAmount(Number(amountOwned) >= 0 ? amountOwned?.toString() : '0');
                    }
                    /* Set max balance */
                  }}
                >
                  MAX
                </Button>
              </View>

              <View style={[styles.balanceInfo, { marginTop: 5 }]}>
                <Text style={styles.balanceLabel}>Coin Balance: {formatNumber(Number(amountOwned) >= 0 ? amountOwned as any : 0)}</Text>


                <Pressable onPress={() => {
                  return refetchCoinBalance?.()
                }}>
                  {coinBalanceLoading ?
                    <LoadingSpinner size={16} color='white' />
                    :
                    <Ionicons name="refresh" size={16} color="white" />
                  }
                </Pressable>
              </View>
            </View>


          }

        </View>

        {/* Action Button */}
        {!account?.address ? (
          <Button style={styles.actionButton} onPress={onConnect}>
            Connect Wallet
          </Button>
        ) : (
          <Button
            style={[styles.actionButton, typeAction == 'SELL' && styles.buttonSell]}
            onPress={() => onHandleAction()}
          >
            {typeAction || 'BUY'}
          </Button>
        )}
      </View>
    </View>
  );
};
