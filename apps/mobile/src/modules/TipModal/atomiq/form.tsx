import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useAccount } from '@starknet-react/core';
import { useLN, useProfile } from 'afk_nostr_sdk';
import React, { useState } from 'react';
import { View } from 'react-native';
import { CallData, uint256 } from 'starknet';

import { Avatar, Button, Input, Modalize, Picker, Text } from '../../../components';
import { ESCROW_ADDRESSES } from '../../../constants/contracts';
import { CHAIN_ID } from '../../../constants/env';
import { DEFAULT_TIMELOCK, Entrypoint } from '../../../constants/misc';
import { TOKENS, TokenSymbol } from '../../../constants/tokens';
import { useAtomiqLab, useStyles, useWaitConnection } from '../../../hooks';
import { useToast, useTransactionModal } from '../../../hooks/modals';
import { useDialog } from '../../../hooks/modals/useDialog';
import { useTransaction } from '../../../hooks/modals/useTransaction';
import { useWalletModal } from '../../../hooks/modals/useWalletModal';
import { TipSuccessModalProps } from '../../TipSuccessModal';
import stylesheet from './styles';


export type TipAtomiqModal = Modalize;

export type FormAtomiqProps = {
  event?: NDKEvent;
  ref?: any;
  show: (event: NDKEvent) => void;
  hide: () => void;
  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const FormTipAtomiq: React.FC<FormAtomiqProps> = ({
  event,
  hide: hideTipModal,
  showSuccess,
  hideSuccess,
  ref,
}: FormAtomiqProps) => {
  const styles = useStyles(stylesheet);

  const [token, setToken] = useState<TokenSymbol>(TokenSymbol.STRK);
  const [amount, setAmount] = useState<string>('');
  const { handleZap, getInvoiceFromLnAddress, payInvoice } = useLN();

  const { data: profile } = useProfile({ publicKey: event?.pubkey });

  const { showToast } = useToast();
  const account = useAccount();
  const walletModal = useWalletModal();
  // const sendTransaction = useTransaction({});
  const { sendTransaction } = useTransaction({});
  const { hide: hideTransactionModal } = useTransactionModal();
  const waitConnection = useWaitConnection();

  const { handlePayInvoice, handleConnect, handlePayLnurl, starknetSwapper } = useAtomiqLab();
  const { showDialog, hideDialog } = useDialog();

  const isActive = !!amount && !!token;

  const onTipPress = async () => {
    // if (!account.address) {
    //   walletModal.show();

    //   const result = await waitConnection();
    //   if (!result) return;
    // }

    if (!profile?.lud16) {
      showToast({ title: "No LUD16 found", type: 'error' });
      return;
    }


    if(!amount) {
      showToast({ title: "No amount found", type: 'error' });
      return;
    }

    const invoice = await getInvoiceFromLnAddress(profile?.lud16, Number(amount));

    if (!invoice?.paymentRequest) {
      showToast({ title: "Invoice not found", type: 'error' });
      return;
    }

    console.log("invoice", invoice)
    // if (!starknetSwapper) {
    //   await handleConnect();
    // }
    // await handleConnect();
    // await handlePayInvoice(invoice?.paymentRequest)
    await handlePayLnurl(profile?.lud16, Number(amount))
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

          {/* {TOKENS[TokenSymbol.STRK] === token && (
          <View>
            <Text>
              {TOKENS[TokenSymbol.STRK]}
            </Text>
          </View>
         )} */}
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
