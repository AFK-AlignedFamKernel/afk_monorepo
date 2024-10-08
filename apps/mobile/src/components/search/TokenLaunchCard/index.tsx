import {NDKEvent, NDKUserProfile} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useAccount} from '@starknet-react/core';
import {Fraction} from '@uniswap/sdk-core';
import {useProfile} from 'afk_nostr_sdk';
import {useState} from 'react';
import {ImageSourcePropType, TouchableOpacity, View} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {useStyles, useTheme, useWaitConnection} from '../../../hooks';
import {useBuyCoinByQuoteAmount} from '../../../hooks/launchpad/useBuyCoinByQuoteAmount';
import {useSellCoin} from '../../../hooks/launchpad/useSellCoin';
import {useToast, useWalletModal} from '../../../hooks/modals';
// import {useProfile} from '../../hooks';
import {MainStackNavigationProps} from '../../../types';
import {TokenDeployInterface, TokenLaunchInterface} from '../../../types/keys';
import {feltToAddress} from '../../../utils/format';
import {Text} from '../../Text';
import stylesheet from './styles';
import {CopyIconStack} from '../../../assets/icons';
import {Button, Input} from '../..';

export type LaunchCoinProps = {
  imageProps?: ImageSourcePropType;
  name?: string;
  event?: NDKEvent;
  profileProps?: NDKUserProfile;
  token?: TokenDeployInterface;
  launch?: TokenLaunchInterface;
  isViewDetailDisabled?: boolean;
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
}) => {
  const {data: profile} = useProfile({publicKey: event?.pubkey});
  const account = useAccount();

  const {showToast} = useToast();
  const {theme} = useTheme();

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

  // const sellKeys = async () => {
  //   if (!amount) return;

  //   await onConnect();
  //   if (!account || !account?.account) return;

  //   if (!launch?.owner) return;

  //   if (!launch?.token_quote) return;

  //   // handleSellKeys(account?.account, launch?.owner, Number(amount), launch?.token_quote, undefined)
  //   handleSellCoins(
  //     account?.account,
  //     feltToAddress(BigInt(launch?.token_address)),
  //     Number(amount),
  //     launch?.token_quote,
  //     undefined,
  //   );
  // };

  // const buyCoin = async () => {
  //   if (!amount) return;

  //   await onConnect();

  //   if (!account || !account?.account) return;

  //   if (!launch?.owner) return;

  //   if (!launch?.token_quote) return;

  //   console.log('launch', launch);
  //   // handleBuyKeys(account?.account, launch?.owner, launch?.token_quote, Number(amount),)
  //   handleBuyCoins(
  //     account?.account,
  //     feltToAddress(BigInt(launch?.token_address)),
  //     Number(amount),
  //     launch?.token_quote,
  //   );
  // };

  const navigation = useNavigation<MainStackNavigationProps>();
  // const handleNavigateToProfile = () => {
  //   if (!event?.id) return;
  //   navigation.navigate('Profile', { publicKey: event?.pubkey });
  // };
  let priceAmount = token?.price;
  // if (token?.price) {
  //   priceAmount = new Fraction(String(token.price), decimalsScale(18)).toFixed(18);
  // }
  let created_at = token?.created_at;

  // if (token?.created_at) {
  //   created_at = new Fraction(String(token.created_at), decimalsScale(18)).toFixed(18);
  // }

  const handleCopy = async () => {
    if (!token?.memecoin_address) return;
    await Clipboard.setStringAsync(token?.memecoin_address);
    showToast({type: 'info', title: 'Copied to clipboard'});
  };

  return (
    <View style={styles.container}>
      <View>
        {token?.memecoin_address && (
          <View style={styles.borderBottom}>
            {/* <Text weight="semiBold">Meme Coin address:</Text> */}
            <Input
              value={token?.memecoin_address}
              editable={false}
              right={
                <TouchableOpacity
                  onPress={() => handleCopy()}
                  style={
                    {
                      // marginRight: 10,
                    }
                  }
                >
                  <CopyIconStack color={theme.colors.primary} />
                </TouchableOpacity>
              }
            />
            <Text>{token?.memecoin_address}</Text>
          </View>
        )}

        <View style={styles.borderBottom}>
          <Text weight="semiBold">Name:</Text>
          <Text>{token?.name}</Text>
        </View>

        {token?.owner && (
          <View style={styles.borderBottom}>
            <Text weight="semiBold">Owner:</Text>
            <Text>{token?.owner}</Text>
          </View>
        )}

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
          Supply: {Number(token?.total_supply) / 10 ** 18}
        </Text>

        <Text>
          Price: {Number(token?.price)}
        </Text> */}

        <View style={styles.borderBottom}>
          <Text weight="semiBold">Total Supply:</Text>
          <Text>{Number(token?.total_supply)}</Text>
        </View>

        {token?.created_at && (
          <Text>
            Created at {token?.created_at}
            {/* Created at {Number(token?.created_at)} */}
          </Text>
        )}

        <View style={styles.borderBottom}>
          <Text weight="semiBold">Network:</Text>
          <Text>{token?.network}</Text>
        </View>
      </View>

      <View>
        {token?.threshold_liquidity && (
          <View style={styles.borderBottom}>
            <Text weight="semiBold">Threshold liquidity:</Text>
            <Text>{Number(token?.threshold_liquidity)}</Text>
          </View>
        )}

        {token?.liquidity_raised && (
          <View>
            <Text weight="semiBold">Raised:</Text>
            <Text>{Number(token?.liquidity_raised)}</Text>
          </View>
        )}

        {/* {token?.is_liquidity_token && (
          <View style={styles.borderBottom}>
            <Text weight="semiBold">Is tokened in DEX:</Text>
            <Text>{Number(token?.is_liquidity_token)}</Text>
          </View>
        )} */}
      </View>

      {token?.token_quote && (
        <View>
          <Text weight="bold" fontSize={18} style={styles.marginBottom}>
            Token quote
          </Text>
          <View style={styles.borderBottom}>
            <Text weight="semiBold">Quote token:</Text>
            <Text>{feltToAddress(BigInt(token.token_quote?.token_address))}</Text>
          </View>
        </View>
      )}

      {/* <tokenActionsForm
        onChangeText={(e) => setAmount(Number(e))}
        onBuyPress={buyCoin}
        onSellPress={sellKeys}
      ></LaunchActionsForm> */}

      {!isViewDetailDisabled && (
        <View>
          {' '}
          <Button
            onPress={() => {
              if (token && token?.memecoin_address) {
                navigation.navigate('LaunchDetail', {
                  coinAddress: token?.memecoin_address,
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
