import React from 'react';
import {StyleSheet, View} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface GenerateQRCodeProps {
  data: string;
  size?: number;
}

const GenerateQRCode: React.FC<GenerateQRCodeProps> = ({data, size = 200}) => {
  return (
    <View style={styles.container}>
      <QRCode value={data} size={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GenerateQRCode;
