import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const ScanCashuQRCode = ({  }) => {
  const devices = useCameraDevices();
  const device = devices[0];

  useEffect(() => {
    // Ask for camera permission
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission === 'denied') {
        console.warn('Camera permission denied');
      }
    };

    requestCameraPermission();
  }, []);

  if (device == null) return <Text>Loading Camera...</Text>;

  const handleScan = (frame: { text: any; }) => {
    // Assuming `frame` contains the scanned QR code's content
    const qrCodeData = frame?.text;  // You need a QR code processor library here
    if (qrCodeData) {
      try {
      } catch (error) {
        console.error('Error decoding Cashu token:', error);
      }
    }
  };

  return (
    <Camera
    //   style={{ flex: 1 }}
      device={device}
      isActive={true}
    //   frameProcessor={handleScan}
    />
  );
};

export default ScanCashuQRCode;
