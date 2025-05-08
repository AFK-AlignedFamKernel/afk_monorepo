import {useAuth} from 'afk_nostr_sdk';
import React, {FC, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Button} from '../../../components';
import {useToast} from '../../../hooks/modals';
import {WalletManager} from '../../../utils/storage/wallet-manager';

export const WalletOnboarding: FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const {showToast} = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isFirstLoadDone, setIsFirstLoadDone] = useState(false);
  const {setAuth} = useAuth();

  const handleGenerateWallet = async () => {
    const isWalletSetup = await WalletManager.getIsWalletSetup();
    console.log('isWalletSetup', isWalletSetup);

    // if (isWalletSetup) return;

    if (isWalletSetup && isWalletSetup == 'true') {
      const result = await WalletManager.getDecryptedPrivateKey();
      if (!result) {
        showToast({title: 'Authentication issue.', type: 'error'});

        // return router.push("/onboarding")
      } else {
        const {secretKey, mnemonic, publicKey, strkPrivateKey} = result;
        console.log('result', result);
        showToast({title: 'Authentication succeed.', type: 'success'});

        setIsConnected(true);
      }
    } else if (!isWalletSetup) {
      const result = await WalletManager.getOrCreateKeyPair();
      if (!result) {
        showToast({title: 'Authentication issue.', type: 'error'});
        // return router.push("/onboarding")
      } else {
        const {secretKey, mnemonic, publicKey, strkPrivateKey} = result;
        showToast({title: 'Wallet generated successfully.', type: 'success'});

        setIsConnected(true);
      }
    }
  };

  const handleConnectPasskeyWallet = async () => {
    const isWalletSetup = await WalletManager.getIsWalletSetup();
    console.log('isWalletSetup', isWalletSetup);

    // if (isWalletSetup) return;

    if (isWalletSetup && isWalletSetup == 'true') {
      const result = await WalletManager.getDecryptedPrivateKey();
      if (!result) {
        showToast({title: 'Authentication issue.', type: 'error'});

        // return router.push("/onboarding")
      } else {
        const {secretKey, mnemonic, publicKey, strkPrivateKey} = result;
        console.log('result', result);
        showToast({title: 'Authentication succeed.', type: 'success'});

        setIsConnected(true);
      }
    } else if (!isWalletSetup) {
      showToast({title: 'Please, generate your wallet', type: 'info'});
    }
  };

  return (
    <View>
      <ScrollView>
        <Button
          onPress={() => {
            handleConnectPasskeyWallet();
          }}
        >
          Connect{' '}
        </Button>
        <Text>Generate an EVM and Starknet wallet</Text>
        <Button
          onPress={() => {
            handleGenerateWallet();
          }}
        >
          Generate{' '}
        </Button>
      </ScrollView>
    </View>
  );
};
