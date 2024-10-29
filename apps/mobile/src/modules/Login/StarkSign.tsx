import {useNavigation} from '@react-navigation/native';
import {useAccount, useDisconnect} from '@starknet-react/core';
import React, {useState} from 'react';
import {View} from 'react-native';
import {shortString, WeierstrassSignatureType} from 'starknet';

import {Button, Modal, Text} from '../../components';
import {LoadingSpinner} from '../../components/Loading';
import {useStyles} from '../../hooks';
import {useLogin} from '../../hooks/api/useLogin';
import {useToast} from '../../hooks/modals';
import {storeAuthData} from '../../utils/storage';
import stylesheet from './styles';

export type SignMessageModalProps = {
  hide: () => void;
};

const DEFAULT_TYPED_DATA = {
  types: {
    StarkNetDomain: [
      {name: 'name', type: 'felt'},
      {name: 'chainId', type: 'felt'},
      {name: 'version', type: 'felt'},
    ],
    Message: [{name: 'message', type: 'felt'}],
  },
  primaryType: 'Message',
  domain: {
    name: 'Afk',
    chainId: shortString.encodeShortString(process.env.EXPO_PUBLIC_NETWORK || 'SN_MAIN'),
    version: '0.0.1',
  },
  message: {
    message: 'Verify Account Signature',
  },
};

export const SignMessageModal: React.FC<SignMessageModalProps> = ({hide}) => {
  const toast = useToast();
  const navigation = useNavigation();
  const styles = useStyles(stylesheet);
  const {account, address} = useAccount();
  const [signatureLoading, setSignatureLoading] = useState(false);
  const {disconnect} = useDisconnect();
  const {mutate} = useLogin();

  const handleSignWallet = async () => {
    setSignatureLoading(true);

    try {
      if (!account) {
        toast.showToast({title: 'Account not connected', type: 'error'});
        return;
      }

      //:Attempt to sign message
      const sig = (await account.signMessage(DEFAULT_TYPED_DATA)) as string[];
      if (!sig) {
        toast.showToast({title: 'Failed to sign message', type: 'error'});
        return;
      }

      //:Adjust signature format if necessary
      if (sig.length === 3) sig.shift();

      const signed = {
        r: BigInt(sig[0]),
        s: BigInt(sig[1]),
      } as WeierstrassSignatureType;

      //:Verify the signature
      const isValid = await account.verifyMessage(DEFAULT_TYPED_DATA, signed).catch((error) => {
        toast.showToast({title: error.message, type: 'error'});
        throw error;
      });

      if (!isValid) {
        toast.showToast({title: 'Invalid Signature', type: 'error'});
        return;
      }

      // API call to create or login user
      mutate(
        {userAddress: address as string},
        {
          onSuccess(data) {
            toast.showToast({type: 'success', title: 'Message signed successfully'});
            storeAuthData(data?.data?.data);
            hide();
            // @ts-ignore
            navigation.navigate('Feed');
          },
          onError(error) {
            toast.showToast({type: 'error', title: error.message});
          },
        },
      );
    } catch (error: any) {
      // Handle user rejection and other errors
      if (error?.message === 'An error occurred (USER_REFUSED_OP)') {
        toast.showToast({title: 'Request rejected by user', type: 'error'});
      } else {
        toast.showToast({title: error?.message || 'An unexpected error occurred', type: 'error'});
        console.error('Error occurred:', error);
      }
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    hide();
  };

  return (
    <Modal
      style={{
        maxWidth: 400,
        width: '100%',
      }}
    >
      <Text fontSize={24} weight="bold" style={styles.title}>
        Signer
      </Text>

      <Text style={styles.description}>
        Sign a message in your wallet to verify that you are the owner of the connected address.
      </Text>

      <View style={styles.buttonContainer}>
        <Button variant="primary" onPress={handleSignWallet}>
          {signatureLoading ? <LoadingSpinner /> : 'Sign'}
        </Button>
        <Button variant="secondary" onPress={handleDisconnect}>
          Disconnect
        </Button>
      </View>
    </Modal>
  );
};
