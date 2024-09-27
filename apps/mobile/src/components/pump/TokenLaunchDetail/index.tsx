import {NDKEvent, NDKUserProfile} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useAccount} from '@starknet-react/core';
import {Fraction} from '@uniswap/sdk-core';
import {useProfile} from 'afk_nostr_sdk';
import {useState} from 'react';
import {ImageSourcePropType, View} from 'react-native';

import {useStyles, useWaitConnection} from '../../../hooks';
import {useBuyCoinByQuoteAmount} from '../../../hooks/launchpad/useBuyCoinByQuoteAmount';
import {useSellCoin} from '../../../hooks/launchpad/useSellCoin';
import {useWalletModal} from '../../../hooks/modals';
import {MainStackNavigationProps} from '../../../types';
import {TokenLaunchInterface} from '../../../types/keys';
import {feltToAddress} from '../../../utils/format';
import {decimalsScale} from '../../../utils/helpers';
import {Button} from '../../Button';
import {LaunchActionsForm} from '../../LaunchActionsForm';
import {Text} from '../../Text';
import stylesheet from './styles';

export type LaunchCoinProps = {
  imageProps?: ImageSourcePropType;
  name?: string;
  event?: NDKEvent;
  profileProps?: NDKUserProfile;
  launch?: TokenLaunchInterface;
  isViewDetailDisabled?: boolean;
  isDisabledInfo?: boolean;
  isDisabledForm?: boolean;
};

export const TokenLaunchDetail: React.FC<LaunchCoinProps> = ({
  launch,
  imageProps,
  name,
  profileProps,
  event,
  isViewDetailDisabled,
  isDisabledInfo,
  isDisabledForm,
}) => {
  const {data: profile} = useProfile({publicKey: event?.pubkey});
  const account = useAccount();
  const [amount, setAmount] = useState<number | undefined>();

  const styles = useStyles(stylesheet);

  const {handleSellCoins} = useSellCoin();
  // const { handleBuyKeys } = useBuyKeys()
  const {handleBuyCoins} = useBuyCoinByQuoteAmount();
  const waitConnection = useWaitConnection();
  const walletModal = useWalletModal();
  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();

      const result = await waitConnection();
      if (!result) return;
    }
  };
  const navigation = useNavigation<MainStackNavigationProps>();
  // const handleNavigateToProfile = () => {
  //   if (!event?.id) return;
  //   navigation.navigate('Profile', { publicKey: event?.pubkey });
  // };
  let priceAmount;
  if (launch?.price) {
    priceAmount = new Fraction(String(launch.price), decimalsScale(18)).toFixed(18);
  }
  let created_at;

  if (launch?.created_at) {
    created_at = new Fraction(String(launch.created_at), decimalsScale(18)).toFixed(18);
  }

  const sellKeys = async () => {
    if (!amount) return;

    await onConnect();
    if (!account || !account?.account) return;

    if (!launch?.owner) return;

    if (!launch?.token_quote) return;

    // handleSellKeys(account?.account, launch?.owner, Number(amount), launch?.token_quote, undefined)
    handleSellCoins(
      account?.account,
      feltToAddress(BigInt(launch?.token_address)),
      Number(amount),
      launch?.token_quote,
      undefined,
    );
  };

  const buyCoin = async () => {
    if (!amount) return;

    await onConnect();

    if (!account || !account?.account) return;

    if (!launch?.owner) return;

    if (!launch?.token_quote) return;

    console.log('launch', launch);
    // handleBuyKeys(account?.account, launch?.owner, launch?.token_quote, Number(amount),)
    handleBuyCoins(
      account?.account,
      feltToAddress(BigInt(launch?.token_address)),
      Number(amount),
      launch?.token_quote,
    );
  };

  return (
    <View style={styles.container}>
      <View>
        {launch?.token_address && (
          <View style={styles.borderBottom}>
            <Text weight="semiBold">Coin address:</Text>
            <Text>{feltToAddress(BigInt(launch.token_address))}</Text>
          </View>
        )}

        {launch?.owner && (
          <View style={styles.borderBottom}>
            <Text weight="semiBold">Owner:</Text>
            <Text>{feltToAddress(BigInt(launch.owner))}</Text>
          </View>
        )}

        <View style={styles.borderBottom}>
          <Text weight="semiBold">Supply:</Text>
          <Text>{Number(launch?.total_supply) / 10 ** 18}</Text>
        </View>
        <View style={styles.borderBottom}>
          <Text weight="semiBold">Price:</Text>
          <Text>{Number(launch?.price)}</Text>
        </View>
      </View>

      {!isDisabledInfo && (
        <>
          <View>
            {launch?.threshold_liquidity && (
              <View style={styles.borderBottom}>
                <Text weight="semiBold">Threshold liquidity:</Text>
                <Text>{Number(launch?.threshold_liquidity)}</Text>
              </View>
            )}

            {launch?.liquidity_raised && (
              <View>
                <Text weight="semiBold">Raised:</Text>
                <Text>{Number(launch?.liquidity_raised)}</Text>
              </View>
            )}

            {launch?.is_liquidity_launch && (
              <View style={styles.borderBottom}>
                <Text weight="semiBold">Is launched in DEX:</Text>
                <Text>{Number(launch?.is_liquidity_launch)}</Text>
              </View>
            )}
          </View>
          {launch?.token_quote && (
            <View
            // style={styles.imageContainer}
            >
              <Text weight="bold" fontSize={18} style={styles.marginBottom}>
                Token quote
              </Text>
              <View style={styles.borderBottom}>
                <Text weight="semiBold">Quote token:</Text>
                <Text>{feltToAddress(BigInt(launch.token_quote?.token_address))}</Text>
              </View>
              <View>
                <Text weight="semiBold">Step increase: </Text>
                <Text>{Number(launch.token_quote?.step_increase_linear) / 10 ** 18}</Text>
              </View>
            </View>
          )}
        </>
      )}

      {!isDisabledForm && (
        <LaunchActionsForm
          onChangeText={(e) => setAmount(Number(e))}
          onBuyPress={buyCoin}
          onSellPress={sellKeys}
        ></LaunchActionsForm>
      )}

      {!isViewDetailDisabled && (
        <View>
          {' '}
          <Button
            onPress={() => {
              if (launch && launch?.token_address) {
                navigation.navigate('LaunchDetail', {
                  coinAddress: feltToAddress(BigInt(launch?.token_address)),
                  launch,
                });
              }
            }}
          >
            View details
          </Button>
        </View>
      )}
    </View>
  );
};
