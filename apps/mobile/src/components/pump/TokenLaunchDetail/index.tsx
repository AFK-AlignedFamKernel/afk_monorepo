import {NDKEvent, NDKUserProfile} from '@nostr-dev-kit/ndk';
import {useNavigation} from '@react-navigation/native';
import {useAccount} from '@starknet-react/core';
import {Fraction} from '@uniswap/sdk-core';
import {useProfile} from 'afk_nostr_sdk';
import {ImageSourcePropType, View} from 'react-native';

import {useStyles} from '../../../hooks';
import {MainStackNavigationProps} from '../../../types';
import {TokenLaunchInterface} from '../../../types/keys';
import {feltToAddress} from '../../../utils/format';
import {decimalsScale} from '../../../utils/helpers';
import {Button} from '../../Button';
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

export const TokenLaunchDetail: React.FC<LaunchCoinProps> = ({
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
        <View style={styles.borderBottom}>
          <Text weight="semiBold">Supply:</Text>
          <Text>{Number(launch?.total_supply) / 10 ** 18}</Text>
        </View>
        <View style={styles.borderBottom}>
          <Text weight="semiBold">Price:</Text>
          <Text>{Number(launch?.price)}</Text>
        </View>

        {/* {launch?.created_at &&
          <Text>
            Created at {Number(launch?.created_at) / 10 ** 18}
          </Text>
        } */}
      </View>

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
