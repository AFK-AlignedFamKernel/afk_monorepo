import {NDKEvent, NDKUserProfile} from '@nostr-dev-kit/ndk';
import Slider from '@react-native-community/slider';
import {useNavigation} from '@react-navigation/native';
import {useAccount} from '@starknet-react/core';
import {useProfile} from 'afk_nostr_sdk';
import {useState} from 'react';
import {ImageSourcePropType, View} from 'react-native';

import {useStyles, useWaitConnection} from '../../../hooks';
import {useBuyCoinByQuoteAmount} from '../../../hooks/launchpad/useBuyCoinByQuoteAmount';
import {useSellCoin} from '../../../hooks/launchpad/useSellCoin';
import {useToast, useWalletModal} from '../../../hooks/modals';
import {MainStackNavigationProps} from '../../../types';
import {TokenDeployInterface} from '../../../types/keys';
import {feltToAddress} from '../../../utils/format';
import {AddressComponent} from '../../AddressComponent';
import {Button} from '../../Button';
import {LaunchActionsForm} from '../../LaunchActionsForm';
import {Text} from '../../Text';
import stylesheet from './styles';

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
  const [thresholdLiquidity, setThresholdLiquidity] = useState(
    Number(launch?.threshold_liquidity) ?? 0,
  );
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
  const priceAmount = launch?.price;
  // if (launch?.price) {
  //   priceAmount = new Fraction(String(launch.price), decimalsScale(18)).toFixed(18);
  // }
  const created_at = launch?.created_at;

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
      <View style={styles.detailCard}>
        {launch?.memecoin_address && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Coin address</Text>
              <AddressComponent
                address={feltToAddress(BigInt(launch.memecoin_address))}
                textStyle={styles.addressValue}
              />
            </View>
            <View style={styles.divider} />
          </>
        )}

        {launch?.owner && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Owner</Text>
              <Text style={styles.value}>{feltToAddress(BigInt(launch.owner))}</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Supply</Text>
          <Text style={styles.value}>{Number(launch?.total_supply).toLocaleString()}</Text>
        </View>

        <View style={styles.divider} />

        {launch?.is_liquidity_launch && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Is launched in DEX</Text>
            <Text style={styles.value}>{Number(launch?.is_liquidity_launch).toLocaleString()}</Text>
          </View>
        )}

        {launch?.threshold_liquidity && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Threshold liquidity</Text>
            <Text style={styles.value}>{thresholdLiquidity}</Text>
            <Slider
              style={{width: 200, height: 40}}
              value={thresholdLiquidity}
              onValueChange={setThresholdLiquidity}
              step={0.1}
              minimumValue={0}
              maximumValue={Number(launch.threshold_liquidity)}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
            />
          </View>
        )}

        {launch?.liquidity_raised && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Raised</Text>
            <Text style={styles.value}>{Number(launch?.liquidity_raised).toLocaleString()}</Text>
          </View>
        )}

        {launch?.liquidity_raised && launch?.threshold_liquidity && (
          <View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Raised Progress</Text>
              <Text style={styles.value}>
                {Number(launch?.liquidity_raised).toLocaleString()} /{' '}
                {Number(launch?.threshold_liquidity).toLocaleString()}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min((Number(launch?.liquidity_raised) / Number(launch?.threshold_liquidity)) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {(
                (Number(launch?.liquidity_raised) / Number(launch?.threshold_liquidity)) *
                100
              ).toFixed(1)}
              % Complete
            </Text>
          </View>
        )}

        {launch?.bonding_type && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Bonding type</Text>
            <Text style={styles.value}>{launch?.bonding_type}</Text>
          </View>
        )}

        {launch?.total_token_holded && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Total token holded</Text>
            <Text style={styles.value}>{Number(launch?.total_token_holded).toLocaleString()}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>${Number(launch?.price ?? 0).toFixed(4)}</Text>
        </View>

        {launch?.quote_token && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Quote token</Text>
            <AddressComponent address={launch?.quote_token || ''} textStyle={styles.addressValue} />
          </View>
        )}
      </View>

      {/* <Button
        style={styles.toggleButton}
        textStyle={styles.toggleText}
        onPress={() => setIsDisabledInfoState(!isDisabledInfoState)}
      >
        {isDisabledInfoState ? 'View more info' : 'Hide details'}
      </Button>

      {!isDisabledInfoState && (
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          {launch?.threshold_liquidity && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Threshold liquidity</Text>
              <Text style={styles.value}>
                {Number(launch?.threshold_liquidity).toLocaleString()}
              </Text>
            </View>
          )}

          {launch?.liquidity_raised && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Raised</Text>
              <Text style={styles.value}>{Number(launch?.liquidity_raised).toLocaleString()}</Text>
            </View>
          )}
          {launch?.token_quote && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Token quote</Text>
              <AddressComponent
                address={feltToAddress(BigInt(launch.token_quote?.token_address))}
                textStyle={styles.addressValue}
              />
            </View>
          )}
        </View>
      )} */}

      {!isDisabledForm && (
        <LaunchActionsForm
          onChangeText={(e) => setAmount(Number(e))}
          onBuyPress={buyCoin}
          onSellPress={sellKeys}
          onHandleAction={function (amountProps?: number): void {
            throw new Error('Function not implemented.');
          }}
          onSetAmount={function (e: number): void {
            throw new Error('Function not implemented.');
          }}
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
