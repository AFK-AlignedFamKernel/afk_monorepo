import {NDKEvent, NDKUserProfile} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useAccount} from '@starknet-react/core';
import {Fraction} from '@uniswap/sdk-core';
import {useProfile} from 'afk_nostr_sdk';
import {ImageSourcePropType, Pressable, View} from 'react-native';

import {useStyles, useWaitConnection} from '../../../hooks';
import {MainStackNavigationProps} from '../../../types';
import {TokenDeployInterface, TokenLaunchInterface} from '../../../types/keys';
import {feltToAddress} from '../../../utils/format';
import {decimalsScale} from '../../../utils/helpers';
import {Button} from '../../Button';
import {Text} from '../../Text';
import stylesheet from './styles';
import {LaunchActionsForm} from '../../LaunchActionsForm';
import {useState} from 'react';
import {useBuyCoinByQuoteAmount} from '../../../hooks/launchpad/useBuyCoinByQuoteAmount';
import {useSellCoin} from '../../../hooks/launchpad/useSellCoin';
import {useToast, useWalletModal} from '../../../hooks/modals';
import {AddressComponent} from '../../AddressComponent';

export type LaunchCoinProps = {
  imageProps?: ImageSourcePropType;
  name?: string;
  event?: NDKEvent;
  profileProps?: NDKUserProfile;
  launch?: TokenDeployInterface;
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
  console.log('launch', launch);

  const [isDisabledInfoState, setIsDisabledInfoState] = useState<boolean | undefined>(
    isDisabledInfo,
  );
  const styles = useStyles(stylesheet);

  const {showToast} = useToast();
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
  let priceAmount = launch?.price;
  // if (launch?.price) {
  //   priceAmount = new Fraction(String(launch.price), decimalsScale(18)).toFixed(18);
  // }
  let created_at = launch?.created_at;

  // const sellKeys = async () => {
  //   if (!amount) return;

  //   await onConnect();
  //   if (!account || !account?.account) return;

  //   if (!launch?.quote_token) return;

  //   // handleSellKeys(account?.account, launch?.owner, Number(amount), launch?.token_quote, undefined)
  //   handleSellCoins(
  //     account?.account,
  //     launch.memecoin_address,
  //     //  feltToAddress(BigInt(launch?.memecoin_address)),
  //     Number(amount),
  //     launch?.quote_token,
  //     undefined,
  //   );
  // };

  // const buyCoin = async () => {
  //   if (!amount) return;

  //   await onConnect();

  //   if (!account || !account?.account) return;
  //   console.log('launch', launch);

  //   if (!launch?.owner) return;

  //   if (!launch?.token_quote) return;

  //   // handleBuyKeys(account?.account, launch?.owner, launch?.token_quote, Number(amount),)
  //   handleBuyCoins(
  //     account?.account,
  //     launch?.memecoin_address,
  //     //  feltToAddress(BigInt(launch?.memecoin_address)),
  //     Number(amount),
  //     launch?.quote_token,
  //   );
  // };

  const sellKeys = async () => {
    if (!amount) {
      return showToast({title: 'Select an amount to buy', type: 'info'});
    }
    await onConnect();
    if (!account || !account?.account) return;

    if (!launch?.memecoin_address) return;
    console.log('launch', launch);

    // if (!token?.quote_token) return;

    const sellResult = await handleSellCoins(
      account?.account,
      launch?.memecoin_address,
      // feltToAddress(BigInt(token?.memecoin_address)),
      Number(amount),
      launch?.quote_token,
      undefined,
    );

    if (sellResult) {
      return showToast({title: 'Buy done', type: 'success'});
    }
  };

  const buyCoin = async () => {
    await onConnect();
    if (!amount) {
      return showToast({title: 'Select an amount to buy', type: 'info'});
    }

    if (!account || !account?.account) return;

    console.log('launch', launch);

    if (!launch?.memecoin_address) return;
    // if (!token?.token_quote) return;
    // handleBuyKeys(account?.account, token?.owner, token?.token_quote, Number(amount),)
    const buyResult = await handleBuyCoins(
      account?.account,
      launch?.memecoin_address,
      // feltToAddress(BigInt(token?.memecoin_address)),
      Number(amount),
      launch?.quote_token,
    );

    return showToast({title: 'Buy done', type: 'success'});
  };

  return (
    <View style={styles.container}>
      <View>
        {launch?.memecoin_address && (
          <View style={styles.borderBottom}>
            <Text weight="semiBold">Coin address:</Text>
            <AddressComponent address={feltToAddress(BigInt(launch.memecoin_address))} />
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
          <Text>{Number(launch?.total_supply)}</Text>
        </View>
        <View style={styles.borderBottom}>
          <Text weight="semiBold">Price:</Text>
          <Text>{Number(launch?.price ?? 0)}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => {
          setIsDisabledInfoState(!isDisabledInfoState);
        }}
      >
        <Text>{isDisabledInfoState ? 'View more info' : 'Close info'}</Text>
      </Pressable>
      {!isDisabledInfoState && (
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

          {launch?.quote_token && (
            <View style={styles.borderBottom}>
              <Text weight="semiBold">Quote token:</Text>
              <Text>{launch?.quote_token}</Text>
            </View>
          )}
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
                <Text>{Number(launch.token_quote?.step_increase_linear)}</Text>
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
              if (launch && launch?.memecoin_address) {
                navigation.navigate('LaunchDetail', {
                  coinAddress: feltToAddress(BigInt(launch?.memecoin_address)),
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
