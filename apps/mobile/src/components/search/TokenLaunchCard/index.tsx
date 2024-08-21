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
// import {useProfile} from '../../hooks';
import {MainStackNavigationProps} from '../../../types';
import {TokenLaunchInterface} from '../../../types/keys';
import {feltToAddress} from '../../../utils/format';
import {decimalsScale} from '../../../utils/helpers';
import {Button} from '../../Button';
import {Input} from '../../Input';
import {Text} from '../../Text';
import stylesheet from './styles';

export type LaunchCoinProps = {
  imageProps?: ImageSourcePropType;
  name?: string;
  event?: NDKEvent;
  profileProps?: NDKUserProfile;
  launch?: TokenLaunchInterface;
  isViewDetailDisabled?: boolean;
};

enum AmountType {
  QUOTE_AMOUNT,
  COIN_AMOUNT_TO_BUY,
}
export const TokenLaunchCard: React.FC<LaunchCoinProps> = ({
  launch,
  imageProps,
  name,
  profileProps,
  event,
  isViewDetailDisabled,
}) => {
  const {data: profile} = useProfile({publicKey: event?.pubkey});
  const account = useAccount();

  const styles = useStyles(stylesheet);

  const [amount, setAmount] = useState<number | undefined>();
  const [typeAmount, setTypeAmount] = useState<AmountType>(AmountType.QUOTE_AMOUNT);

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

  return (
    <View style={styles.container}>
      <View>
        {launch?.token_address && (
          <Text>Coin address: {feltToAddress(BigInt(launch.token_address))}</Text>
        )}

        {launch?.owner && <Text>Owner: {feltToAddress(BigInt(launch.owner))}</Text>}

        {/*         
      <View style={styles.imageContainer}>
        <Image
          source={
            profile?.cover ? profile?.cover : require('../../../assets/feed/images/story-bg.png')
          }
          resizeMode="cover"
        />
        <Image
          style={styles.image}
          source={profile?.image ? profile?.image : require('../../assets/degen-logo.png')}
        />
           <Text weight="medium" fontSize={13} style={styles.name}>
        {profile?.name ?? profile?.nip05 ?? profile?.displayName ?? 'Anon AFK'}
      </Text>
      </View> */}
        {/* <Text>
          Supply: {Number(launch?.total_supply) / 10 ** 18}
        </Text>

        <Text>
          Price: {Number(launch?.price)}
        </Text> */}

        <Text>Supply: {Number(launch?.total_supply) / 10 ** 18}</Text>
        <Text>Price: {Number(launch?.price)}</Text>

        {/* {launch?.created_at &&
          <Text>
            Created at {Number(launch?.created_at) / 10 ** 18}
          </Text>
        } */}
      </View>

      <View>
        {launch?.threshold_liquidity && (
          <Text>Threshold liquidity: {Number(launch?.threshold_liquidity)}</Text>
        )}

        {launch?.liquidity_raised && <Text>Raised: {Number(launch?.liquidity_raised)}</Text>}

        {launch?.is_liquidity_launch && (
          <Text>Is launched in DEX: {Number(launch?.is_liquidity_launch)}</Text>
        )}
      </View>

      {launch?.token_quote && (
        <View
        // style={styles.imageContainer}
        >
          <Text>Token quote</Text>
          <Text>Quote token: {feltToAddress(BigInt(launch.token_quote?.token_address))}</Text>
          <Text>Step increase: {Number(launch.token_quote?.step_increase_linear) / 10 ** 18}</Text>
        </View>
      )}

      <Input
        keyboardType="numeric"
        // value={amount ? String(amount) : "0"}
        onChangeText={(e) => {
          setAmount(Number(e));
          // if (e && Number(e) ) {
          //   setAmount(Number(e))
          // }

          // if (e ) {
          //   setAmount(Number(0))
          // }
        }}
        placeholder="Amount"
      />
      <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 3}}>
        <Button onPress={buyCoin} style={{backgroundColor: 'green'}}>
          <Text>Buy</Text>
        </Button>

        <Button onPress={sellKeys} style={{backgroundColor: 'red'}}>
          Sell
        </Button>
      </View>

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
