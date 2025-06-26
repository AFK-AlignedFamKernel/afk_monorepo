import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useAccount } from '@starknet-react/core';
import { useLN, useProfile } from 'afk_nostr_sdk';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { CallData, uint256 } from 'starknet';

import { Avatar, Button, Input, Modalize, Picker, Text } from '@/components';
import { TokenSymbol } from '@/constants/tokens';
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
  const [successAction, setSuccessAction] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<any | null>(null);
  const [successUrl, setSuccessUrl] = useState<any | null>(null);
  const [preimage, setPreimage] = useState<string | null>(null);
  // const sendTransaction = useTransaction({});
  const { sendTransaction } = useTransaction({});
  const { hide: hideTransactionModal } = useTransactionModal();
  const waitConnection = useWaitConnection();

  const { handlePayInvoice, handleConnect, handlePayLnurl, starknetSwapper } = useAtomiqLab();
  const { showDialog, hideDialog } = useDialog();
  const [isLoading, setIsLoading] = useState(false);

  const isActive = !!amount && !!token;

  const onTipPress = async () => {
    try {
      // if (!account.address) {
      //   walletModal.show();

      //   const result = await waitConnection();
      //   if (!result) return;
      // }

      if (!profile?.lud16) {
        showToast({ title: "No LUD16 found", type: 'error' });
        return;
      }


      if (!amount) {
        showToast({ title: "No amount found", type: 'error' });
        return;
      }
      setIsLoading(true)


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
      showToast({ title: "Paying invoice in process", type: 'info' });
      const res = await handlePayLnurl(profile?.lud16, Number(amount))

      console.log("res", res)
      if (res.success && res?.lightningSecret) {
        setPreimage(res.lightningSecret)
        setSuccessAction(res.successAction)
        setSuccessUrl(res.successUrl)

        showToast({
          title: "Tip sent",
          type: "success"
        })
      }
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      showToast({
        title: "Error",
        type: "error"
      })
    }
    finally {
      setIsLoading(false)
    }
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
          {/* <Picker
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
          </Picker> */}


          {token === TokenSymbol.STRK && (
            <Text>
              STRK
            </Text>
          )}

        </View>

        <Input value={amount} onChangeText={setAmount} placeholder="Amount in SATS" />
      </View>

      <View style={styles.sending}>
        <View style={styles.sendingText}>
          <Text color="textSecondary" fontSize={16} weight="medium">
            Sending
          </Text>

          {amount.length > 0 && token.length > 0 ? (
            <Text color="primary" fontSize={16} weight="bold">
              {amount} SATs
              {/* {token} */}
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
        <Button variant="secondary" disabled={!isActive || isLoading} onPress={onTipPress}>
          {isLoading ? <ActivityIndicator /> : "Tip"}
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
