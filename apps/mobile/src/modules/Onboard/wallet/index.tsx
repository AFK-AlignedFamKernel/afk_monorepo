import { FC, useState } from 'react';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../../../app/DynamicClient';
import { TextInput, View, ScrollView, Text } from 'react-native';
import React from 'react';
import { Button } from '../../../components';
import { useToast } from '../../../hooks/modals';

export const WalletOnboarding: FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const {showToast} = useToast()

  const { wallets } = useReactiveClient(dynamicClient)

  const wallet = wallets.userWallets[0]

  const handleSendOTP = async () => {
    await dynamicClient.auth.email.sendOTP(email);
    setOtpSent(true);
  };

  const handleResendOTP = () => {
    dynamicClient.auth.email.resendOTP();
  };

  const handleVerifyOTP = () => {
    dynamicClient.auth.email.verifyOTP(otp);
  };

  const handleCreateWallet = async () => {
    const walletCreated =await wallets.embedded.createWallet({})

    showToast({title:"Wallet created successfully", type:"success"})

  }

  return (
    <View>

      <ScrollView>
  

        {!otpSent ? (
          <View>
            <TextInput value={email} onChangeText={setEmail} placeholder="Enter your email" />

            <Button onPress={handleSendOTP}>Send OTP</Button>
          </View>
        ) : (
          <View>
            <TextInput value={otp} onChangeText={setOtp} placeholder="Enter OTP" />

            <Button onPress={handleVerifyOTP}>Verify OTP</Button>

            <Button onPress={handleResendOTP}>Resend OTP</Button>
          </View>
        )}

        <View>
          <Text>JWT:</Text>
          <Text>{dynamicClient?.auth.token}</Text>
        </View>

        <View>
          <Text>User:</Text>
          <Text>{dynamicClient?.auth.authenticatedUser?.email}</Text>
        </View>

        <Button onPress={() => dynamicClient?.auth.logout()} >
          <Text>Logout</Text>
        </Button>


      </ScrollView>
    </View>
  );
};
