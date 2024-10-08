import {FC, useState} from 'react';
import {dynamicClient} from '../../../app/DynamicClient';
import {TextInput, View} from 'react-native';
import React from 'react';
import {Button} from '../../../components';

export const DynamicEmailSignIn: FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
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

  return (
    <View>
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
    </View>
  );
};
