import React, { useState } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { CameraView, BarcodeScanningResult, CameraType, useCameraPermissions } from 'expo-camera';
import { usePayment } from '../../../hooks/usePayment';
import { useToast } from '../../../hooks/modals';

interface ScanCashuQRCodeProps {
  onClose: () => void;
}

const ScanCashuQRCode: React.FC<ScanCashuQRCodeProps> = ({ onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { handlePayInvoice, handleGenerateEcash } = usePayment();
  const { showToast } = useToast();

  const handleScannedCode = async ({ data }: BarcodeScanningResult) => {
    if (!data) {
      showToast({ title: 'Invalid QR code', type: 'error' });
      return;
    }
    if (data.startsWith('lightning:')) {
      // Handle Lightning invoice
      const invoice = data.replace('lightning:', '');
      await handlePayInvoice(invoice);
      onClose();
    } else if (data.startsWith('cashu')) {
      // Handle Cashu token
      await handleGenerateEcash(Number(data.replace('cashu', '')));
      onClose();
    } else {
      showToast({ title: 'Invalid QR code', type: 'error' });
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return <Text>Requesting camera permission</Text>;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text>We need your permission to use the camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        
        onBarcodeScanned={scanned ? undefined : handleScannedCode}
      />
      {scanned && <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />}
      <Button title="Close Scanner" onPress={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});

export default ScanCashuQRCode;
