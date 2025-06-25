import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useAccount} from '@starknet-react/core';
import {useProfile} from 'afk_nostr_sdk';
import {useEffect, useState} from 'react';
import React from 'react';
import {View} from 'react-native';
import {CallData, constants} from 'starknet';

import {Button, Text} from '../../components';
import {KEYS_ADDRESS} from '../../constants/contracts';
import {TokenSymbol} from '../../constants/tokens';
import {useStyles, useWaitConnection} from '../../hooks';
import {useDataKeys} from '../../hooks/keys/useDataKeys';
import {useInstantiateKeys} from '../../hooks/keys/useInstantiateKeys';
import {useTransactionModal} from '../../hooks/modals';
import {useDialog} from '../../hooks/modals/useDialog';
import {useTransaction} from '../../hooks/modals/useTransaction';
import {useWalletModal} from '../../hooks/modals/useWalletModal';
import {KeysUser} from '../../types/keys';
import {TipSuccessModalProps} from '../TipSuccessModal';
import {KeyModalAction} from '.';
import stylesheet from './styles';

export type FormInstantiateKeyProps = {
  event?: NDKEvent;
  starknetAddress?: string;
  action?: KeyModalAction;

  hide: () => void;
  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const FormInstantiateKey = ({
  event,
  starknetAddress,
  hide,
  hideSuccess,
  showSuccess,
  action,
}: FormInstantiateKeyProps) => {
  const styles = useStyles(stylesheet);

  const [token, setToken] = useState<TokenSymbol>(TokenSymbol.ETH);
  const [amount, setAmount] = useState<string>('');

  const {data: profile} = useProfile({publicKey: event?.pubkey});
  const [myKey, setMyKey] = useState<KeysUser | undefined>();
  const [keySelected, setKeySelected] = useState<KeysUser | undefined>();
  const [isCanInstantiateKey, setCanInstantiateKey] = useState<boolean | undefined>(false);

  const account = useAccount();
  const walletModal = useWalletModal();
  const {sendTransaction, txUrl, txHash} = useTransaction({});
  const {hide: hideTransactionModal} = useTransactionModal();
  const waitConnection = useWaitConnection();
  const {handleInstantiateKeys} = useInstantiateKeys();
  const {getAllKeys, getKeyByAddress} = useDataKeys();
  const {showDialog, hideDialog} = useDialog();
  const isActive = !!amount && !!token;

  useEffect(() => {
    const getKeyByUserConnected = async () => {
      if (!account?.address) return;
      const myOwnKey = await getKeyByAddress(account?.address);
      console.log('myOwnKey', myOwnKey);
      setMyKey(myOwnKey);
    };

    const getKeyOfParams = async () => {
      if (!starknetAddress) return;
      const key = await getKeyByAddress(starknetAddress);
      // console.log('key', key);
      setKeySelected(key);
    };

    getKeyOfParams();
    getKeyByUserConnected();
  }, [account?.address, starknetAddress]);

  const onConnect = async () => {
    if (!account.address) {
      walletModal.show();

      const result = await waitConnection();
      if (!result) return;
    }
  };

  const onInstantiateKeys = async () => {
    const contractAddress = KEYS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    const call = {
      contractAddress,
      entrypoint: 'instantiate_keys',
      calldata: CallData.compile({}),
    };
    if (!account || !account?.account) return;

    const {transaction_hash} = await sendTransaction(
      [call],
      // {
      //   contractAddress: ESCROW_ADDRESSES[CHAIN_ID],
      //   entrypoint: Entrypoint.DEPOSIT,
      //   calldata: depositCallData,
      // },
    );
    // const tx = await account?.account?.execute([call], undefined, {});
    // console.log('tx hash', tx?.transaction_hash);
    // if (tx?.transaction_hash) {
    //   const wait_tx = await account?.account?.waitForTransaction(tx?.transaction_hash);
    //   // await handleInstantiateKeys(account?.account);
    // }

    if (txHash && transaction_hash) {
      hideTransactionModal();
      showSuccess({
        amount: Number(amount),
        symbol: token,
        user:
          (profile?.nip05 && `@${profile.nip05}`) ??
          profile?.displayName ??
          profile?.name ??
          event?.pubkey,
        children: (
          <>
            <Text>Your key is instantiate!</Text>
          </>
        ),
        hide: hideSuccess,
      });
    } else {
      const description = 'Please Try Again Later.';
      // if (receipt) {
      //   description = receipt.transaction_failure_reason.error_message;
      // }

      showDialog({
        title: 'Failed to send the tip',
        description,
        buttons: [{type: 'secondary', label: 'Close', onPress: () => hideDialog()}],
      });
    }
  };

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
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

      {!account?.address && <Button onPress={onConnect}>Connect</Button>}
      <View style={styles.sending}>
        <View style={styles.sendingText}>
          <Text color="textSecondary" fontSize={16} weight="medium">
            Instantiate your key
          </Text>
        </View>
      </View>

      {account?.address && <Text>Connect: {account?.address}</Text>}

      <View style={styles.pickerContainer}>
        {(myKey && BigInt(myKey?.owner) == BigInt(0)) ||
          (!myKey && <Button onPress={onInstantiateKeys}>Instantiate key</Button>)}
        {/* {myKey && (
          <View>
            <Text> {feltToAddress(BigInt(myKey?.owner))}</Text>
          </View>
        )}

        {keySelected && (
          <View>
            <Text> {feltToAddress(BigInt(keySelected?.owner))}</Text>
          </View>
        )} */}
      </View>

      <View style={styles.submitButton}>
        <Button variant="secondary" onPress={onInstantiateKeys}>
          Instantiate the keys
        </Button>
      </View>

      <Text
        weight="semiBold"
        color="inputPlaceholder"
        fontSize={13}
        align="center"
        style={styles.comment}
      >
        Instantiate key
      </Text>
    </View>
  );
};
