import {BarcodeScanningResult, CameraView, useCameraPermissions} from 'expo-camera';
import React, {useState} from 'react';
import {Button, StyleSheet, Text, View, Dimensions, Clipboard, TouchableOpacity, Modal} from 'react-native';

import {useToast} from '../../../hooks/modals';
import {usePayment} from '../../../hooks/usePayment';
import {useTheme} from '../../../hooks'; 

interface ScanCashuQRCodeProps {
  onClose: () => void;
}

const ScanCashuQRCode: React.FC<ScanCashuQRCodeProps> = ({onClose}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const {handlePayInvoice, handleGenerateEcash} = usePayment();
  const {showToast} = useToast();
  const {theme} = useTheme(); 

  const handleScannedCode = ({data}: BarcodeScanningResult) => {
    console.log('Scanned data:', data); 
    if (!data) {
      showToast({title: 'Invalid QR code', type: 'error'});
      return;
    }
    setScanned(true);
    setScannedData(data);
    setModalVisible(true); 
  };

  const handlePay = async () => {
    if (scannedData) {
      await handlePayInvoice(scannedData);
      showToast({title: 'Invoice paid successfully', type: 'success'});
      setModalVisible(false);
      onClose();
    }
  };

  const handleReceive = async () => {
    if (scannedData) {
      await handleGenerateEcash(Number(scannedData.replace('cashu', '')));
      showToast({title: 'eCash received successfully', type: 'success'});
      setModalVisible(false);
      onClose();
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

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, {color: theme.colors.text}]}>Scan QR Code</Text>
      </View>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleScannedCode}
        />
        <View style={styles.overlay} />
      </View>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              {scannedData?.startsWith('lnbc') ? 'Pay this invoice?' : 'Receive this eCash?'}
            </Text>
            <Button
              title={scannedData?.startsWith('lnbc') ? 'Pay Invoice' : 'Receive eCash'}
              onPress={scannedData?.startsWith('lnbc') ? handlePay : handleReceive}
            />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
      {scannedData && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Scanned Data: {scannedData}</Text>
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
  cancelText: {
    color: 'red',
    fontSize: 16,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default ScanCashuQRCode;
