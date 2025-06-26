/* eslint-disable react-hooks/exhaustive-deps */
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { randomUUID } from 'expo-crypto';
import jsQR from 'jsqr';
import React, { useEffect, useRef, useState } from 'react';
import { Clipboard, Modal, Platform, Switch, Text, TouchableOpacity, View } from 'react-native';

import { CopyIconStack } from '../../assets/icons';
import { AnimatedToast } from '../../context/Toast/AnimatedToast';
import { ToastConfig } from '../../context/Toast/ToastContext';
import { useAtomiqLab, useStyles, useTheme } from '../../hooks';
import { useToast } from '../../hooks/modals';
import { usePayment } from '../../hooks/usePayment';
import { Button } from '../Button';
import { Input } from '../Input';
import stylesheet from './styles';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavigationProps, MainStackParams } from '../../types';
import Checkbox from 'expo-checkbox';

interface ScanCashuQRCodeProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface VideoElementRef extends HTMLVideoElement {
  srcObject: MediaStream | null;
}

export const ScanQRCode: React.FC<ScanCashuQRCodeProps> = ({ onClose, onSuccess }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [webPermissionGranted, setWebPermissionGranted] = useState<boolean>(false);
  const [modalToast, setModalToast] = useState<ToastConfig | undefined>(undefined);
  const [showModalToast, setShowModalToast] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { handlePayInvoice, handleReceiveEcash } = usePayment();
  const [scannedType, setScannedType] = useState<"CASHU" | "STRK" | "LNURL" | "LNBC">("LNBC")
  const { showToast } = useToast();
  const { theme } = useTheme();
  const styles = useStyles(stylesheet);
  const [type, setType] = useState<"CASHU" | "STRK">("CASHU")

  const [amount, setAmount] = useState<string | undefined>(undefined)

  const { handlePayInvoice: handlePayInvoiceAtomiq, handlePayLnurl } = useAtomiqLab()

  const navigation = useNavigation<MainStackNavigationProps>();
  // Web-specific refs and state
  const videoRef = useRef<VideoElementRef | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webStream, setWebStream] = useState<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);

  const cleanup = () => {
    stopScanning();
    if (webStream) {
      webStream.getTracks().forEach((track) => {
        track.stop();
      });
      setWebStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  };

  const handleScannedCode = ({ data }: BarcodeScanningResult) => {
    console.log('Scanned data:', data);
    if (!data) {
      showToast({ title: 'Invalid QR code', type: 'error' });
      return;
    }
    cleanup();
    setScanned(true);
    setScannedData(data);
    setModalVisible(true);
  };

  const handlePay = async (): Promise<void> => {

    try {
      if (scannedData) {
        setIsProcessing(true);

        if (type == "CASHU") {
          const { meltResponse: tokens } = await handlePayInvoice(scannedData);
          if (tokens) {
            setModalVisible(false);
            cleanup();
            onClose();
            onSuccess();
          } else {
            const key = randomUUID();
            setModalToast({
              title: 'Error processing payment.',
              type: 'error',
              key,
            });
            setShowModalToast(true);
            setIsProcessing(false);
          }
        } else {
          if (scannedData?.toLowerCase().startsWith('lnurl')) {
            const invoiceAtomiq = await handlePayLnurl(scannedData, Number(amount))
            console.log("invoiceAtomiq", invoiceAtomiq)

            if (invoiceAtomiq) {
              showToast({ title: 'Payment sent', type: 'success' });
            } else {
              const key = randomUUID();
              setModalToast({
                title: 'Error processing payment.',
                type: 'error',
                key,
              });
              setShowModalToast(true);
              setIsProcessing(false);
            }
          } else {
            const invoiceAtomiq = await handlePayInvoiceAtomiq(scannedData)
            console.log("invoiceAtomiq", invoiceAtomiq)

            if (invoiceAtomiq) {
              showToast({ title: 'Payment sent', type: 'success' });
            } else {
              const key = randomUUID();
              setModalToast({
                title: 'Error processing payment.',
                type: 'error',
                key,
              });
              setShowModalToast(true);
              setIsProcessing(false);
            }
          }
        }

      }
    } catch (error) {
      console.log("handlePay error", error)
      showToast({ title: 'Error processing payment.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceive = async (): Promise<void> => {
    try {
      if (scannedData) {
        setIsProcessing(true);
        const response = await handleReceiveEcash(scannedData);
        if (response) {
          setModalVisible(false);
          cleanup();
          onClose();
          onSuccess();
        } else {
          const key = randomUUID();
          setModalToast({
            title: 'Error processing payment.',
            type: 'error',
            key,
          });
          setShowModalToast(true);
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.log("handleReceive error", error)
      showToast({ title: 'Error processing payment.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = (): void => {
    if (scannedData) {
      Clipboard.setString(scannedData);
      showToast({ title: 'Copied to clipboard', type: 'success' });
    }
  };

  // Web-specific camera handling
  const startWebCamera = async (): Promise<void> => {
    try {
      if (!webPermissionGranted) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setWebStream(stream);
        setWebPermissionGranted(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      showToast({ title: 'Error accessing camera', type: 'error' });
    }
  };

  const scanQRCode = (): void => {
    if (!scanningRef.current || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleScannedCode({
          data: code.data,
          type: 'qr',
          bounds: {
            origin: {
              x: code.location.topLeftCorner.x,
              y: code.location.topLeftCorner.y,
            },
            size: {
              width: code.location.bottomRightCorner.x - code.location.topLeftCorner.x,
              height: code.location.bottomRightCorner.y - code.location.topLeftCorner.y,
            },
          },
          cornerPoints: [],
        });
      }
    }

    if (scanningRef.current) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const startScanning = () => {
    scanningRef.current = true;
    scanQRCode();
  };

  const stopScanning = () => {
    scanningRef.current = false;
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      startWebCamera();
    }
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current && webStream) {
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play();
          startScanning();
        }
      };
    }
  }, [webStream]);

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setScanned(false);
    setScannedData(null);
    cleanup();
    onClose();
  };

  const handleScannerClose = () => {
    cleanup();
    onClose();
  };

  if (!permission && Platform.OS !== 'web') {
    return (
      <Modal animationType="fade" transparent={true} visible={true}>
        <View style={styles.grantPermissionMainContainer}>
          <View style={styles.grantPermissionContent}>
            <Text style={styles.grantPermissionText}>Requesting camera permission</Text>
            <Button
              style={styles.modalActionButton}
              textStyle={styles.modalActionButtonText}
              onPress={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission?.granted && Platform.OS !== 'web') {
    return (
      <Modal animationType="fade" transparent={true} visible={true}>
        <View style={styles.grantPermissionMainContainer}>
          <View style={styles.grantPermissionContent}>
            <Text style={styles.grantPermissionText}>
              We need your permission to use the camera
            </Text>
            <View style={styles.grantModalButtonsContainer}>
              <Button
                style={[styles.grantActionButton, styles.grantCancelButton]}
                textStyle={styles.grantCancelButtonText}
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                style={[styles.grantActionButton, styles.grantAcceptButton]}
                textStyle={styles.grantAcceptButtonText}
                onPress={requestPermission}
              >
                Grant Permission
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const renderCamera = () => {
    if (Platform.OS === 'web') {
      return (
        <>
          <video
            ref={videoRef as React.RefObject<HTMLVideoElement>}
            style={styles.cameraWeb}
            playsInline
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleScannedCode}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          mirror
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!scanned ? (
        <>
          {Platform.OS !== 'web' || webPermissionGranted ? (
            <View style={styles.header}>
              <Text style={[styles.headerText, { color: theme.colors.text }]}>Scan QR Code</Text>
            </View>
          ) : null}
          {renderCamera()}
          {Platform.OS === 'web' && !webPermissionGranted ? (
            <View
              style={styles.waitingContainer}
            >
              <Button onPress={() => {
                // navigation.goBack();
                handleScannerClose()
              }}>Cancel</Button>
              <Text style={styles.waitingText}>Waiting for permissions...</Text>
            </View>
          ) : null}
          {Platform.OS !== 'web' || webPermissionGranted ? (
            <>
              <TouchableOpacity onPress={handleScannerClose}>
                <Text style={styles.cancelText}>Close Scanner</Text>
              </TouchableOpacity>
              <Text style={styles.text}>{type}</Text>

              <Switch value={type == "STRK"} onValueChange={() => {
                if (type == "CASHU") {
                  setType("STRK")
                } else {
                  setType("CASHU")
                }
              }} > {type}</Switch>
            </>
          ) : null}
        </>
      ) : null}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        {showModalToast && modalToast ? (
          <View style={styles.toastContainer}>
            <AnimatedToast
              key={modalToast.key}
              toast={modalToast}
              hide={() => setShowModalToast(false)}
            />
          </View>
        ) : null}
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.resultText}>Scanned Data</Text>
            {scannedData ? (
              <Input
                autoFocus={false}
                value={scannedData}
                style={{
                  height: 45,
                  marginHorizontal: 20,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.text,
                }}
                editable={false}
                right={
                  <TouchableOpacity
                    onPress={handleCopyToClipboard}
                    style={{
                      marginRight: 10,
                    }}
                  >
                    <CopyIconStack color={theme.colors.primary} />
                  </TouchableOpacity>
                }
              />
            ) : null}

            <Switch value={type == "STRK"} onValueChange={() => {
              if (type == "CASHU") {
                setType("STRK")
              } else {
                setType("CASHU")
              }
            }} > {type}</Switch>
            <Text style={styles.modalText}>
              {scannedData?.toLowerCase().startsWith('lnbc')
                ? 'Pay this invoice?'
                : scannedData?.toLowerCase().startsWith('lnurl')
                  ? 'Pay?'
                  : 'Receive this eCash?'}
            </Text>

            {scannedData?.toLowerCase().startsWith('lnurl') ? (
              <Input
                value={String(amount)}
                onChangeText={setAmount}
                placeholder='Amount to send'
              ></Input>

            ) : null}
            <View style={styles.scannedModalButtonsContainer}>
              <Button
                style={[styles.scannedModalActionButton, styles.scannedModalCancelButton]}
                textStyle={styles.scannedModalCancelButtonText}
                onPress={handleModalClose}
              >
                Cancel
              </Button>
              <Button
                style={[styles.scannedModalActionButton, styles.scannedModalOKButton]}
                textStyle={styles.scannedModalOKButtonText}
                disabled={isProcessing}
                onPress={scannedData?.toLowerCase().startsWith('lnbc') || scannedData?.toLowerCase().startsWith('lnurl') ? handlePay : handleReceive}
              >
                {isProcessing
                  ? 'Processing...'
                  : scannedData?.toLowerCase().startsWith('lnbc')
                    ? 'Pay'
                    : scannedData?.toLowerCase().startsWith('lnurl')
                      ? 'Pay'
                      : 'Receive'}
              </Button>

            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};


export default ScanQRCode;