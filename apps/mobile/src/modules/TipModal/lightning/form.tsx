import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useCashu, useCashuStore, useLN, useProfile, useSendZapNote } from 'afk_nostr_sdk';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { Avatar, Button, Input, Modalize, Text } from '../../../components';
import { useStyles } from '../../../hooks';
import { useToast } from '../../../hooks/modals';
import { TipSuccessModalProps } from '../../TipSuccessModal';
import stylesheet from './styles';
import { usePayment } from 'src/hooks/usePayment';
import { canUseBiometricAuthentication } from 'expo-secure-store';
import { retrieveAndDecryptCashuMnemonic, retrievePassword } from 'src/utils/storage';
import { CashuMint } from '@cashu/cashu-ts';

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

  const [isCashu, setIsCashu] = useState(true);
  const { mutate: mutateSendZapNote } = useSendZapNote();

  const [amount, setAmount] = useState<string>('');
  const { handleZap, getInvoiceFromLnAddress, payInvoice } = useLN();
  const { data: profile } = useProfile({ publicKey: event?.pubkey });
  const { showToast } = useToast();
  const isActive = !!amount;

  console.log('profile nip', profile);
  console.log('lud06', profile?.lud06);
  console.log('lud16', profile?.lud16);
  console.log('nip', profile?.nip05);
  const { handleGenerateEcash, handlePayInvoice } = usePayment();

  const { mintUrls, activeMintIndex, setMintInfo, getMintInfo, mint, setMintUrls, wallet, connectCashWallet, setActiveMint, mintUrlSelected, setMintUrlSelected } = useCashu()
  useEffect(() => {
    (async () => {

      if (!activeMintIndex) return;

      if (!mint) return;
      const mintUrl = mintUrls?.[activeMintIndex]?.url;
      if (!mintUrl) return;
      const info = await getMintInfo(mintUrl);
      setMintInfo(info);
    })();
  }, [activeMintIndex, mint]);
  const { isSeedCashuStorage, setIsSeedCashuStorage, hasSeedCashu, setHasSeedCashu } = useCashuStore();
  const { setMnemonic } = useCashuStore();

  // const [hasSeedCashu, setHasSeedCashu] = useState(false);

  // useEffect(() => {
  //   (async () => {
  //     const biometrySupported = Platform.OS !== 'web' && canUseBiometricAuthentication?.();

  //     if (biometrySupported) {
  //       const password = await retrievePassword();
  //       if (!password) return;
  //       const storeMnemonic = await retrieveAndDecryptCashuMnemonic(password);

  //       if (!storeMnemonic) {
  //         return;
  //       }
  //       if (storeMnemonic) setHasSeedCashu(true);

  //       const decoder = new TextDecoder();
  //       // const decryptedPrivateKey = decoder.decode(Buffer.from(storeMnemonic).toString("hex"));
  //       const decryptedPrivateKey = Buffer.from(storeMnemonic).toString('hex');
  //       setMnemonic(decryptedPrivateKey);

  //       if (isSeedCashuStorage) setHasSeedCashu(true);
  //     }
  //   })();
  // }, []);

  const { payExternalInvoice, payLnInvoice, checkMeltQuote } = useCashu()
  const onTipPress = async () => {
    showToast({ title: 'ZAP in processing', type: 'info' });

    if (!event) return;

    if (!amount) {
      showToast({ title: 'Zap send', type: 'error' });
      return;
    }

    if (!profile?.lud16) {
      showToast({ title: "This profile doesn't have a lud16 Lightning address", type: 'error' });
      return;
    }

    const invoice = await getInvoiceFromLnAddress(profile?.lud16, Number(amount));
    console.log('invoice', invoice);

    if (!invoice?.paymentRequest) {
      showToast({ title: "Invoice not found", type: 'error' });
      return;
    }

    let result: string | undefined;
    let success: boolean = false;
    if (!isCashu) {
      const zapExtension = await handleZap(amount, invoice?.paymentRequest);
      console.log('zapExtension', zapExtension);
      if (zapExtension?.preimage) {
        success = true;
        showToast({ title: "Lightning zap succeed", type: "success" })
      }
    } else {
      // const cashuLnPayment = await payExternalInvoice(Number(amount), invoice?.paymentRequest)
      const { invoice: cashuLnPayment, meltResponse } = await handlePayInvoice(
        invoice?.paymentRequest,
        Number(amount)
      )
      console.log('cashuLnPayment', cashuLnPayment);

      if (!cashuLnPayment && !meltResponse) {
        return showToast({ title: "Lightning zap failed", type: "error" })
      }
      if (cashuLnPayment?.quote) {
        const verify = await checkMeltQuote(cashuLnPayment?.quote)
        console.log('verify', verify);

        success = true;
        showToast({ title: "Lightning zap succeed with Cashu", type: "success" })
      }
    }
    // const zapExtension = await payInvoice(invoice?.paymentRequest)

    if (success) {
      await mutateSendZapNote({
        event,
        amount: Number(amount?.toString()),
        lud16: profile?.lud16
      }, {
        onSuccess: () => {
          showToast({ title: "Zap and notif sent", type: "success" })

        }
      })
    }
  };

  return (
    <View>
      <Text>ZAP with Bitcoin</Text>
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

        <View>
          {profile?.lud16 && (
            <Text fontSize={11} color="textLight" weight="regular">
              LN Address: {profile?.lud16}
            </Text>
          )}
        </View>

        <View>

          {!wallet && (
            <View>
              <Button variant="secondary" onPress={() => {

                if (mint) {
                  connectCashWallet(mint)
                } else {

                  if (!activeMintIndex) {
                    console.log('no active mint index');
                    // connectCashWallet(mintUrls?.["0"]?.url)
                    setActiveMint(mintUrlSelected)
                    return;
                  };

                  // const cashuMint = new CashuMint(mintUrls?.[activeMintIndex]?.url).
                  if (mintUrls?.[activeMintIndex]?.url) {
                    setActiveMint(mintUrls?.[activeMintIndex]?.url)

                    const cashuMint = new CashuMint(mintUrls?.[activeMintIndex]?.url)
                    // setWalletConnected(cashuMint)
                    connectCashWallet(cashuMint)
                  }
                }

              }}>Connect Cashu</Button>
            </View>
          )}
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
