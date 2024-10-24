import React, {useEffect, useState} from 'react';
import {Text, View, StyleSheet, Button} from 'react-native';
import {Camera, CameraPermissionStatus, DrawableFrameProcessor, ReadonlyFrameProcessor, useCameraDevices} from 'react-native-vision-camera';
import {useScanBarcodes, BarcodeFormat} from 'vision-camera-code-scanner';
import {usePayment} from '../../../hooks/usePayment';
import {useToast} from '../../../hooks/modals';

interface ScanCashuQRCodeProps {
  onClose: () => void;
}

const ScanCashuQRCode: React.FC<ScanCashuQRCodeProps> = ({onClose}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? null; 
  const {handlePayInvoice, handleGenerateEcash} = usePayment();
  const {showToast} = useToast();

  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  }) as [((frame: any) => void) | undefined, any[]];

  // Define a compatible frame processor type
  type CompatibleFrameProcessor = (frame: any) => void;

  // Cast frameProcessor to the compatible type
  const compatibleFrameProcessor = frameProcessor as unknown as ReadonlyFrameProcessor | DrawableFrameProcessor | undefined;

  useEffect(() => {
    (async () => {
      const status = await Camera.getCameraPermissionStatus();
      console.log('Camera permission status:', status);
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (barcodes.length > 0) {
      handleScannedCode(barcodes[0].displayValue);
    }
  }, [barcodes]);

  const handleScannedCode = async (data: string | undefined) => {
    if (!data) {
      showToast({title: 'Invalid QR code', type: 'error'});
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
      showToast({title: 'Invalid QR code', type: 'error'});
    }
  };

  if (!hasPermission) {
    return <Text>No access to camera</Text>;
  }

  if (device == null) return <Text>Loading Camera...</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={compatibleFrameProcessor}
      />
      <Button title="Close Scanner" onPress={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScanCashuQRCode;
