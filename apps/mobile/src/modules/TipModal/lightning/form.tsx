import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useProfile} from 'afk_nostr_sdk';
import React, {useState} from 'react';
import {View} from 'react-native';

import {Avatar, Button, Input, Modalize, Text} from '../../../components';
import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import {TipSuccessModalProps} from '../../TipSuccessModal';
import stylesheet from './styles';

export type TipModalLightning = Modalize;

export type FormTipModalLightningProps = {
  event?: NDKEvent;
  ref?: any;
  show: (event: NDKEvent) => void;
  hide: () => void;
  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const FormLightningZap: React.FC<FormTipModalLightningProps> = ({
  event,
  hide: hideTipModal,
  showSuccess,
  hideSuccess,
  ref,
}: FormTipModalLightningProps) => {
  const styles = useStyles(stylesheet);

  const [amount, setAmount] = useState<string>('');
  const {data: profile} = useProfile({publicKey: event?.pubkey});
  const {showToast} = useToast();
  const isActive = !!amount;

  const onTipPress = () => {
    showToast({title: 'ZAP coming soon', type: 'info'});
  };

  return (
    <View>
      <Text>ZAP Coming soon</Text>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <Avatar size={48} source={require('../../../assets/afk-logo.png')} />

            <View style={styles.cardInfo}>
              <Text
                fontSize={15}
                color="text"
                weight="bold"
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {profile?.displayName ?? profile?.name ?? event?.pubkey}
              </Text>

              {profile?.nip05 && (
                <Text fontSize={11} color="textLight" weight="regular">
                  @{profile?.nip05}
                </Text>
              )}
            </View>
          </View>
        </View>

        <Text
          fontSize={13}
          weight="medium"
          color="text"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.cardContentText}
        >
          {event?.content}
        </Text>
      </View>

      <View>
        <Text
          fontSize={13}
          weight="medium"
          color="text"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.cardContentText}
        >
          SATS amount
        </Text>

        <Input value={amount} onChangeText={setAmount} placeholder="Amount" />
      </View>

      <View style={styles.submitButton}>
        <Button variant="secondary" disabled={!isActive} onPress={onTipPress}>
          Tip
        </Button>
      </View>

      <Text
        weight="semiBold"
        color="inputPlaceholder"
        fontSize={13}
        align="center"
        style={styles.comment}
      >
        Tip friends and support creators with BTC in the Lightning network.
      </Text>
    </View>
  );
};
// FormTipStarknet.displayName = 'FormTipStarknet';