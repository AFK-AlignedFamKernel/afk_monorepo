import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useAccount} from '@starknet-react/core';
import {useProfile} from 'afk_nostr_sdk';
import React, {useState} from 'react';
import {View} from 'react-native';
import {CallData, uint256} from 'starknet';

import {Avatar, Button, Input, Modalize, Picker, Text} from '../../../components';
import {ESCROW_ADDRESSES} from 'common';
import {CHAIN_ID, DEFAULT_TIMELOCK, Entrypoint, TOKENS, TokenSymbol} from '@/constants';
import {useStyles, useWaitConnection} from '../../../hooks';
import {useTransactionModal} from '../../../hooks/modals';
import {useDialog} from '../../../hooks/modals/useDialog';
import {useTransaction} from '../../../hooks/modals/useTransaction';
import {useWalletModal} from '../../../hooks/modals/useWalletModal';
import {TipSuccessModalProps} from '../../TipSuccessModal';
import stylesheet from './styles';

export type TipModalStarknet = Modalize;

export type FormTipModalStarknetProps = {
  event?: NDKEvent;
  ref?: any;
  show: (event: NDKEvent) => void;
  hide: () => void;
  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const FormTipStarknet: React.FC<FormTipModalStarknetProps> = ({
  event,
  hide: hideTipModal,
  showSuccess,
  hideSuccess,
  ref,
}: FormTipModalStarknetProps) => {
  const styles = useStyles(stylesheet);

  const [token, setToken] = useState<TokenSymbol>(TokenSymbol.ETH);
  const [amount, setAmount] = useState<string>('');

  const {data: profile} = useProfile({publicKey: event?.pubkey});

  const account = useAccount();
  const walletModal = useWalletModal();
  // const sendTransaction = useTransaction({});
  const {sendTransaction} = useTransaction({});
  const {hide: hideTransactionModal} = useTransactionModal();
  const waitConnection = useWaitConnection();

  const {showDialog, hideDialog} = useDialog();

  const isActive = !!amount && !!token;

  const onTipPress = async () => {
    if (!account.address) {
      walletModal.show();

      const result = await waitConnection();
      if (!result) return;
    }

    const amountUint256 = uint256.bnToUint256(
      Math.ceil(Number(amount) * 10 ** TOKENS[token][CHAIN_ID].decimals),
    );

    const approveCallData = CallData.compile([
      ESCROW_ADDRESSES[CHAIN_ID], // Contract address
      amountUint256, // Amount
    ]);

    const depositCallData = CallData.compile([
      amountUint256, // Amount
      TOKENS[token][CHAIN_ID].address, // Token address
      uint256.bnToUint256(`0x${event?.pubkey}`), // Recipient nostr pubkey
      DEFAULT_TIMELOCK, // timelock
    ]);
    const receipt = await sendTransaction([
      {
        contractAddress: TOKENS[token][CHAIN_ID].address,
        entrypoint: Entrypoint.APPROVE,
        calldata: approveCallData,
      },
      {
        contractAddress: ESCROW_ADDRESSES[CHAIN_ID],
        entrypoint: Entrypoint.DEPOSIT,
        calldata: depositCallData,
      },
    ]);

    // TODO add receipt
    if (receipt?.transaction_hash) {
      hideTipModal();
      hideTransactionModal();
      showSuccess({
        amount: Number(amount),
        symbol: token,
        user:
          (profile?.nip05 && `@${profile.nip05}`) ??
          profile?.displayName ??
          profile?.name ??
          event?.pubkey,
        hide: hideSuccess,
      });
    } else {
      let description = 'Please Try Again Later.';
      // if (receipt?.isRejected()) {
      // description = receipt.transaction_failure_reason.error_message;
      // }

      showDialog({
        title: 'Failed to send the tip',
        description,
        buttons: [{type: 'secondary', label: 'Close', onPress: () => hideDialog()}],
      });
    }

    // const receipt = await sendTransaction({
    //   calls: [
    //     {
    //       contractAddress: TOKENS[token][CHAIN_ID].address,
    //       entrypoint: Entrypoint.APPROVE,
    //       calldata: approveCallData,
    //     },
    //     {
    //       contractAddress: ESCROW_ADDRESSES[CHAIN_ID],
    //       entrypoint: Entrypoint.DEPOSIT,
    //       calldata: depositCallData,
    //     },
    //   ],
    // });
  };

  return (
    <View>
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

      <View style={styles.pickerContainer}>
        <View>
          <Picker
            label="Please select a token"
            selectedValue={token}
            onValueChange={(itemValue) => setToken(itemValue as TokenSymbol)}
          >
            {Object.values(TOKENS).map((tkn) => (
              <Picker.Item
                key={tkn[CHAIN_ID].symbol}
                label={tkn[CHAIN_ID].name}
                value={tkn[CHAIN_ID].symbol}
              />
            ))}
          </Picker>
        </View>

        <Input value={amount} onChangeText={setAmount} placeholder="Amount" />
      </View>

      <View style={styles.sending}>
        <View style={styles.sendingText}>
          <Text color="textSecondary" fontSize={16} weight="medium">
            Sending
          </Text>

          {amount.length > 0 && token.length > 0 ? (
            <Text color="primary" fontSize={16} weight="bold">
              {amount} {token}
            </Text>
          ) : (
            <Text color="primary" fontSize={16} weight="bold">
              ...
            </Text>
          )}
        </View>

        <View style={styles.recipient}>
          <Text fontSize={16} weight="regular">
            to
          </Text>
          <Text numberOfLines={1} ellipsizeMode="middle" fontSize={16} weight="medium">
            {(profile?.nip05 && `@${profile.nip05}`) ??
              profile?.displayName ??
              profile?.name ??
              event?.pubkey}
          </Text>
        </View>
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
        Tip friends and support creators with your favorite tokens.
      </Text>
    </View>
  );
};
// FormTipStarknet.displayName = 'FormTipStarknet';
