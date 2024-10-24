import {BarcodeScanningResult, CameraView, useCameraPermissions} from 'expo-camera';
import React, {useState} from 'react';
import {Button, StyleSheet, Text, View, Dimensions, Clipboard, TouchableOpacity} from 'react-native';

import {useToast} from '../../../hooks/modals';
import {usePayment} from '../../../hooks/usePayment';

interface ScanCashuQRCodeProps {
  onClose: () => void;
}

const ScanCashuQRCode: React.FC<ScanCashuQRCodeProps> = ({onClose}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [action, setAction] = useState<'send' | 'receive' | null>(null);
  const {handlePayInvoice, handleGenerateEcash} = usePayment();
  const {showToast} = useToast();

  const handleScannedCode = async ({data}: BarcodeScanningResult) => {
    if (!data) {
      showToast({title: 'Invalid QR code', type: 'error'});
      return;
    }
    setScanned(true);
    setScannedData(data);

    if (action === 'send' && data.startsWith('lightning:')) {
      const invoice = data.replace('lightning:', '');
      await handlePayInvoice(invoice);
      onClose();
    } else if (action === 'receive' && data.startsWith('cashu')) {
      await handleGenerateEcash(Number(data.replace('cashu', '')));
      onClose();
    } else {
      showToast({title: 'Invalid QR code', type: 'error'});
    }
  };

  const handleCopyToClipboard = () => {
    if (scannedData) {
      Clipboard.setString(scannedData);
      showToast({title: 'Copied to clipboard', type: 'success'});
    }
  };

  if (!permission) {
    return <Text>Requesting camera permission</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text>We need your permission to use the camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  if (!action) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerText}>Do you want to send or receive?</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setAction('send')}>
            <Text style={styles.buttonText}>Pay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setAction('receive')}>
            <Text style={styles.buttonText}>Receive</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Scan QR Code</Text>
      </View>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleScannedCode}
        />
        <View style={styles.overlay} />
      </View>
      {scannedData && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{scannedData}</Text>
          <Button title="Copy to Clipboard" onPress={handleCopyToClipboard} />
        </View>
      )}
      {scanned && <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />}
      <TouchableOpacity onPress={onClose}>
        <Text style={styles.cancelText}>Close Scanner</Text>
      </TouchableOpacity>
    </View>
  );
};

const {width} = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cameraContainer: {
    width: width * 0.8,
    height: width * 0.8,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  resultContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    width: width * 0.8,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(79, 168, 155, 1)', // Use your app's primary color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelText: {
    color: 'red',
    fontSize: 16,
    marginTop: 20,
  },
});

export default ScanCashuQRCode;
