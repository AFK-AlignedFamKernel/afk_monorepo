import { FC, useState } from 'react';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../../../app/DynamicClient';
import { TextInput, View, ScrollView, Text } from 'react-native';
import React from 'react';
import { Button } from '../../../components';
import { useToast } from '../../../hooks/modals';

export const DynamicWalletOnboarding: FC = () => {

  enum OtpType {
    SMS,
    EMAIL
  }
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<string | undefined>('');
  const [otpType, setOtpType] = useState<OtpType>(OtpType.EMAIL);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { showToast } = useToast()

  const { wallets } = useReactiveClient(dynamicClient)

  const wallet = wallets.userWallets[0]

  const handleSendOTP = async () => {
    await dynamicClient.auth.email.sendOTP(email);
    setOtpSent(true);
  };

  // TODO finish OTP sms
  const handleSendSmsOTP = async () => {
    showToast({ title: "OTP SMS not enable yet", type: "info" })
    // await dynamicClient.auth.sms.sendOTP(phone);
    // setOtpSent(true);
  };

  const handleResendOTP = async () => {
    dynamicClient.auth.email.resendOTP();
  };

  const handleVerifyOTP = async () => {
    await dynamicClient.auth.email.verifyOTP(otp);
  };

  const handleVerifySmsOTP = async () => {
    await dynamicClient.auth.sms.verifyOTP(otp);
  };


  const handleResendSmsOTP = async () => {
    await dynamicClient.auth.sms.resendOTP();
  };

  const handleCreateWallet = async () => {
    const walletCreated = await wallets.embedded.createWallet({})
    if (walletCreated) {
      showToast({ title: "Wallet created successfully", type: "success" })
    }

  }

  return (
    <View>

      <ScrollView>
        {wallet && wallets.embedded.hasWallet ? (
          <View>Your wallet address: {wallet.address}</View>
        ) : (
          <Button onPress={() => {
            handleCreateWallet()
          }}>
            Create Wallet
          </Button>
        )}

        <View
          style={{ display: "flex", flex: 1, flexDirection: "row" }}>
          <Button onPress={() => setOtpType(OtpType.EMAIL)}>Email</Button>
          <Button onPress={() => setOtpType(OtpType.SMS)}>Sms</Button>
        </View>

        {!otpSent ? (
          <View>

            {otpType == OtpType.EMAIL ?
              <>
                <TextInput value={email} onChangeText={setEmail} placeholder="Enter your email" />
                <Button onPress={handleSendOTP}>Send OTP</Button>
              </>
              :
              <>
                <TextInput value={phone} onChangeText={setPhone} placeholder="Enter your phone number" />
                <Button onPress={handleSendSmsOTP}>Send OTP</Button>
              </>
            }
          </View>
        ) : (
          <View>
            <TextInput value={otp} onChangeText={setOtp} placeholder="Enter OTP" />
            {otpType == OtpType.EMAIL ?
              <>
                <Button onPress={handleVerifyOTP}>Verify OTP</Button>
                <Button onPress={handleResendOTP}>Resend OTP</Button>
              </>
              :
              <>
                <Button onPress={handleVerifyOTP}>Verify OTP</Button>
                <Button onPress={handleResendOTP}>Resend OTP</Button>
              </>
            }
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
