import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { useNavigation } from '@react-navigation/native';
import { Image, ImageSourcePropType, Pressable, TextInput, View, } from 'react-native';

// import {useProfile} from '../../hooks';
import { MainStackNavigationProps } from '../../types';
import { Text } from '../Text';
import { useProfile } from "afk_nostr_sdk"
import { KeysUser } from '../../types/keys';
import { Fraction } from '@uniswap/sdk-core';
import { decimalsScale } from '../../utils/helpers';
import { cairo, uint256 } from 'starknet';
import { feltToAddress } from '../../utils/format';
import { useSellKeys } from '../../hooks/keys/useSellKeys';
import { useBuyKeys } from '../../hooks/keys/useBuyKeys';
import { useAccount } from '@starknet-react/core';
import { useState } from 'react';
import { Button } from '../Button';
import stylesheet from './styles';
import { useStyles, useWaitConnection } from '../../hooks';
import { useWalletModal } from '../../hooks/modals';
import { Input } from '../Input';

export type StoryProps = {
  imageProps?: ImageSourcePropType;
  name?: string;
  event?: NDKEvent;
  profileProps?: NDKUserProfile;
  keyUser?: KeysUser
};

export const KeyUser: React.FC<StoryProps> = ({ keyUser, imageProps, name, profileProps, event }) => {
  const { data: profile } = useProfile({ publicKey: event?.pubkey });
  const account = useAccount()

  const styles = useStyles(stylesheet)

  const [amount, setAmount] = useState<number | undefined>()


  const { handleSellKeys } = useSellKeys()
  const { handleBuyKeys } = useBuyKeys()
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

    await onConnect()
    if (!account || !account?.account) return;

    if (!keyUser?.owner) return;

    if (!keyUser?.token_quote) return;

    handleSellKeys(account?.account, keyUser?.owner, Number(amount), keyUser?.token_quote, undefined)

  }

  const buyKeys = async () => {
    if (!amount) return;

    await onConnect()

    if (!account || !account?.account) return;

    if (!keyUser?.owner) return;

    if (!keyUser?.token_quote) return;
    handleBuyKeys(account?.account, keyUser?.owner, keyUser?.token_quote, Number(amount),)
  }
  const navigation = useNavigation<MainStackNavigationProps>();
  // const handleNavigateToProfile = () => {
  //   if (!event?.id) return;
  //   navigation.navigate('Profile', { publicKey: event?.pubkey });
  // };
  let priceAmount;
  if (keyUser?.price) {
    priceAmount = new Fraction(String(keyUser.price), decimalsScale(18)).toFixed(18);
  }
  let created_at;

  if (keyUser?.created_at) {
    created_at = new Fraction(String(keyUser.created_at), decimalsScale(18)).toFixed(18);

  }

  return (
    <View style={styles.container}>
      <View>

        {keyUser?.owner &&
          <Text>
            Owner: {feltToAddress(BigInt(keyUser.owner))}

          </Text>
        }
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
        <Text>
          Supply: {Number(keyUser?.total_supply) / 10 ** 18}
        </Text>
        <Text>
          Price: {Number(keyUser?.price) / 10 ** 18}
        </Text>

        {keyUser?.created_at &&
          <Text>
            Created at {Number(keyUser?.created_at) / 10 ** 18}
          </Text>
        }

      </View>

      {keyUser?.token_quote &&
        <View
          style={styles.imageContainer}
        >
          <Text>Token quote</Text>
          <Text>
            Quote token: {feltToAddress(BigInt(keyUser.token_quote?.token_address))}
          </Text>
          <Text>
            Step increase: {Number(keyUser.token_quote?.step_increase_linear) / 10 ** 18}
          </Text>
        </View>}

      <Input value={amount ? String(amount) : "0"} onChangeText={(e) => {
        if (e && Number(e)) {
          setAmount(Number(e))
        }
      }} placeholder="Amount" />
      <View style={{ display: "flex", flex: 1, flexDirection: "row", gap: 3 }}>

        <Button onPress={buyKeys} style={{ backgroundColor: "green" }} >
          <Text>
            Buy
          </Text>
        </Button>

        <Button onPress={sellKeys}

          style={{ backgroundColor: "red" }}>
          Sell

        </Button>
      </View>
    </View>
  );
};
