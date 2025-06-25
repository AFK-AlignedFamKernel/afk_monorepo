import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useAccount} from '@starknet-react/core';
import {useProfile} from 'afk_nostr_sdk';
import {forwardRef, useEffect, useState} from 'react';
import {useWindowDimensions} from 'react-native';

import {Modalize, Text} from '../../components';
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
import {FormInstantiateKey} from './FormInstantiateKey';
import stylesheet from './styles';

export type KeyModal = Modalize;

export enum KeyModalAction {
  INSTANTIATE,
  BUY,
  SELL,
}
export type KeyModalProps = {
  event?: NDKEvent;
  starknetAddress?: string;
  action?: KeyModalAction;

  show: (event: NDKEvent, starknetAddress?: string, action?: KeyModalAction) => void;
  hide: () => void;
  showSuccess: (props: TipSuccessModalProps) => void;
  hideSuccess: () => void;
};

export const KeyModal = forwardRef<Modalize, KeyModalProps>(
  ({event, hide: hideKeyModal, showSuccess, hideSuccess, starknetAddress, action}, ref) => {
    const styles = useStyles(stylesheet);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const [token, setToken] = useState<TokenSymbol>(TokenSymbol.ETH);
    const [amount, setAmount] = useState<string>('');
    const {data: profile} = useProfile({publicKey: event?.pubkey});
    const [myKey, setMyKey] = useState<KeysUser | undefined>();
    const [keySelected, setKeySelected] = useState<KeysUser | undefined>();
    const [isCanInstantiateKey, setCanInstantiateKey] = useState<boolean | undefined>(false);
    const [isNeedToLoad, setIsNeedToLoad] = useState<boolean | undefined>(false);
    const account = useAccount();
    const walletModal = useWalletModal();
    const {sendTransaction} = useTransaction({});
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
        setMyKey(myOwnKey);
      };

      const getKeyOfParams = async () => {
        if (!starknetAddress) return;
        const key = await getKeyByAddress(starknetAddress);
        setKeySelected(key);
      };

      getKeyOfParams();
      getKeyByUserConnected();
    }, [account?.address, starknetAddress, isNeedToLoad]);

    return (
      <Modalize
        title="KeyModal"
        ref={ref}
        disableScrollIfPossible={false}
        modalStyle={[styles.modal, isDesktop ? styles.desktopModal : styles.mobileModal]}
      >
        <FormInstantiateKey
          showSuccess={showSuccess}
          hide={hideDialog}
          hideSuccess={hideSuccess}
          event={event}
          action={action}
          starknetAddress={starknetAddress}
        />
        <Text
          weight="semiBold"
          color="inputPlaceholder"
          fontSize={13}
          align="center"
          style={styles.comment}
        >
          Buy the Key of your friends and support the community.
        </Text>
      </Modalize>
    );
  },
);
KeyModal.displayName = 'KeyModal';