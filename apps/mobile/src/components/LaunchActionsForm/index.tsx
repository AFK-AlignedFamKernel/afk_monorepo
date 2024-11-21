import {useAccount} from '@starknet-react/core';
import {useState} from 'react';
import {View} from 'react-native';

import {useStyles} from '../../hooks';
import {useWalletModal} from '../../hooks/modals';
import {useBalanceUtil} from '../../starknet/evm/utilHook';
import {LaunchDataMerged, UserShareInterface} from '../../types/keys';
import {Button} from '../Button';
import {Input} from '../Input';
import {Text} from '../Text';
import stylesheet from './styles';

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
  userShare?: UserShareInterface;
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

  const {data: toBalance} = useBalanceUtil({
    address: account?.address,
    token: launch?.quote_token,
  });

  console.log('toBalance', toBalance);
  console.log('userShare', userShare);
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
            style={[styles.toggleButton, styles.buttonBuy, typeAction === 'BUY' && styles.activeToggle]}
          >
            Buy
          </Button>
          <Button
            onPress={() => setTypeAction?.('SELL')}
            style={[styles.toggleButton, styles.buttonSell, typeAction === 'SELL' && styles.activeToggle]}
          >
            Sell
          </Button>
        </View>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Input
            // keyboardType="decimal-pad"
            keyboardType="numeric"
            // keyboardType=""
            style={styles.input}
            onChangeText={onChangeText}
            placeholder="Amount"
            // value={Number(amount?.toString())}
            value={amount?.toString()}
          />
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance: {toBalance?.formatted}</Text>
            <Button
              style={styles.maxButton}
              onPress={() => {
                onSetAmount(toBalance?.formatted)
                /* Set max balance */
              }}
            >
              MAX
            </Button>
          </View>
        </View>

        {/* Action Button */}
        {!account?.address ? (
          <Button style={styles.actionButton} onPress={onConnect}>
            Connect Wallet
          </Button>
        ) : (
          <Button style={styles.actionButton} onPress={() => onHandleAction()}>
            {typeAction || 'BUY'}
          </Button>
        )}
      </View>
    </View>
  );
};
