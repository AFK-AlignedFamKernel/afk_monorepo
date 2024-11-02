import {useNavigation} from '@react-navigation/native';
import {useAccount, useDisconnect} from '@starknet-react/core';
import axios from 'axios';
import React, {useState} from 'react';
import {View} from 'react-native';
import {WeierstrassSignatureType} from 'starknet';

import {Button, Modal, Text} from '../../components';
import {LoadingSpinner} from '../../components/Loading';
import {typedDataValidate} from '../../constants/contracts';
import {useStyles} from '../../hooks';
import {useLogin} from '../../hooks/api/useLogin';
import {useToast} from '../../hooks/modals';
import {storeAuthData} from '../../utils/storage';
import stylesheet from './styles';

export type SignMessageModalProps = {
  hide: () => void;
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
      const sig = (await account.signMessage(typedDataValidate)) as string[];
      if (!sig) {
        toast.showToast({title: 'Failed to sign message', type: 'error'});
        return;
      }

      //:Adjust signature format if necessary
      if (sig.length === 3) sig.shift();

      const signedMessage = {
        r: BigInt(sig[0]),
        s: BigInt(sig[1]),
      } as WeierstrassSignatureType;

      console.log(signedMessage, 'signeds');

      //Validate Signature
      const isValid = await account
        .verifyMessage(typedDataValidate, signedMessage)
        .catch((error) => {
          toast.showToast({title: error?.cause || error?.message, type: 'error'});
          throw error;
        });

      if (!isValid) {
        toast.showToast({title: 'Invalid Signature', type: 'error'});
        return;
      }

      // API call to create or login user
      mutate(
        {
          userAddress: address as string,
          signature: signedMessage,
          loginType: 'starknet',
        },
        {
          onSuccess(data) {
            setSignatureLoading(false);
            toast.showToast({type: 'success', title: 'Message signed successfully'});
            storeAuthData(data?.data?.data);
            hide();
            // @ts-ignore
            navigation.navigate('Feed');
          },
          onError(error) {
            setSignatureLoading(false);
            // Check if the error is an Axios error
            if (axios.isAxiosError(error) && error.response) {
              const message = error.response.data?.message || 'An error occurred';
              toast.showToast({type: 'error', title: message});
            } else {
              toast.showToast({type: 'error', title: 'An unexpected error occurred'});
            }
          },
        },
      );
    } catch (error: any) {
      setSignatureLoading(false);
      toast.showToast({title: error?.cause || 'An unexpected error occurred', type: 'error'});
      console.error('Error occurred:', error);
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
