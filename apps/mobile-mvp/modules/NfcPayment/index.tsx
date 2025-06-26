import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
// Note: react-native-nfc-manager needs to be installed with npm/yarn
// import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import PolyfillCrypto from 'react-native-webview-crypto';

import { CloseIcon, NfcIcon } from '../../assets/icons';
import { Button } from '../../components/Button';
import { useStyles, useTheme } from '../../hooks';
import { usePayment } from '../../hooks/usePayment';
import { useCashuContext } from '../../providers/CashuProvider';
import { useToast } from '../../hooks/modals';
import stylesheet from './styles';

// Note: NFC Manager should be initialized after installation
// NfcManager.start();

interface NfcPaymentProps {
    onClose: () => void;
    isVisible: boolean;
    mode: 'send' | 'receive';
    setMode: (mode: 'send' | 'receive') => void;
}

export const NfcPayment: React.FC<NfcPaymentProps> = ({ onClose, isVisible, mode, setMode }) => {
    const { theme } = useTheme();
    const styles = useStyles(stylesheet);
    const { showToast } = useToast();

    const { handleGenerateEcash, handlePayInvoice } = usePayment();
    const { getUnitBalance } = useCashuContext()!;

    const [isReading, setIsReading] = useState(false);
    const [isWriting, setIsWriting] = useState(false);
    const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);

    // Simulating NFC support check until actual implementation
    useEffect(() => {
        // When the real NFC Manager is installed, replace this with actual check
        // const checkNfcSupport = async () => {
        //   const supported = await NfcManager.isSupported();
        //   setNfcSupported(supported);
        //   
        //   if (supported) {
        //     await NfcManager.start();
        //   }
        // };

        // Simulating NFC support for development
        const checkNfcSupport = async () => {
            // Simulate most devices supporting NFC
            setNfcSupported(true);
        };

        checkNfcSupport();

        // Clean up when component unmounts
        return () => {
            // NfcManager.cancelTechnologyRequest().catch(() => {});
        };
    }, []);

    // Function to handle reading NFC tags (for receiving payments)
    const handleReadNfc = async () => {
        try {
            setIsReading(true);
            showToast({ title: 'Ready to read NFC payment', type: 'info' });

            // Uncomment when NFC Manager is installed
            // // Request NFC technology
            // await NfcManager.requestTechnology(NfcTech.Ndef);
            // 
            // // Read NDEF message from tag
            // const tag = await NfcManager.getTag();
            // const ndefRecords = tag?.ndefMessage || [];
            // 
            // if (ndefRecords.length > 0) {
            //   // Parse the first record as text
            //   const textRecord = ndefRecords[0];
            //   const textBytes = textRecord.payload;
            //   // Skip the first 3 bytes (language code length and language code)
            //   const text = Ndef.text.decodePayload(textBytes);
            //   
            //   // Process the received data
            //   if (text.startsWith('lightning:')) {
            //     // Handle Lightning invoice
            //     const invoice = text.replace('lightning:', '');
            //     await handlePaymentFromNfc(invoice, 'lightning');
            //   } else if (text.startsWith('cashu:')) {
            //     // Handle Cashu token
            //     const token = text.replace('cashu:', '');
            //     await handlePaymentFromNfc(token, 'ecash');
            //   } else {
            //     showToast({ title: 'Invalid NFC data format', type: 'error' });
            //   }
            // } else {
            //   showToast({ title: 'No data found on NFC tag', type: 'error' });
            // }

            // Simulate a successful read for development
            setTimeout(() => {
                showToast({ title: 'Successfully read payment data!', type: 'success' });
                setIsReading(false);
            }, 2000);

        } catch (error) {
            console.error('Error reading NFC tag:', error);
            showToast({ title: 'Error reading NFC tag', type: 'error' });
            setIsReading(false);
        }
    };

    // Function to handle writing to NFC tags (for sending payments)
    const handleWriteNfc = async (data: string, paymentType: 'lightning' | 'ecash') => {
        try {
            setIsWriting(true);
            showToast({ title: 'Ready to write NFC payment', type: 'info' });

            // Uncomment when NFC Manager is installed
            // // Request NFC technology
            // await NfcManager.requestTechnology(NfcTech.Ndef, {
            //   alertMessage: 'Hold your device near the receiver to send payment'
            // });
            // 
            // // Prepare data with proper prefix
            // const prefix = paymentType === 'lightning' ? 'lightning:' : 'cashu:';
            // const recordData = prefix + data;
            // 
            // // Format as NDEF Text Record
            // const bytes = Ndef.encodeMessage([Ndef.textRecord(recordData)]);
            // 
            // if (bytes) {
            //   await NfcManager.ndefHandler.writeNdefMessage(bytes);
            //   showToast({ title: 'Payment data written to NFC tag', type: 'success' });
            // }

            // Simulate a successful write for development
            setTimeout(() => {
                showToast({ title: 'Payment data successfully written!', type: 'success' });
                setIsWriting(false);
            }, 2000);

        } catch (error) {
            console.error('Error writing to NFC tag:', error);
            showToast({ title: 'Error writing to NFC tag', type: 'error' });
            setIsWriting(false);
        }
    };

    // Function to process payment data received from NFC
    const handlePaymentFromNfc = async (data: string, type: 'lightning' | 'ecash') => {
        try {
            if (type === 'lightning') {
                // Process Lightning invoice payment
                const { meltResponse } = await handlePayInvoice(data);
                if (meltResponse) {
                    showToast({ title: 'Lightning payment successful', type: 'success' });
                    onClose();
                } else {
                    showToast({ title: 'Error processing lightning payment', type: 'error' });
                }
            } else {
                // Process receiving ecash token
                // Implementation depends on how your app handles receiving ecash tokens
                showToast({ title: 'Ecash token received, processing...', type: 'info' });
                // Add logic to process the ecash token
                onClose();
            }
        } catch (error) {
            console.error('Error processing payment from NFC:', error);
            showToast({ title: 'Error processing payment', type: 'error' });
        }
    };

    // If NFC is not supported, show a message
    if (nfcSupported === false) {
        return (
            <Modal visible={isVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>NFC Payment</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <CloseIcon width={24} height={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.content}>
                            <Text style={styles.errorText}>
                                NFC is not supported on this device.
                            </Text>
                            <Button onPress={onClose} style={styles.closeModalButton}>
                                Close
                            </Button>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={isVisible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {mode === 'send' ? 'Send via NFC' : 'Receive via NFC'}
                        </Text>


                        <Button
                            style={{
                                backgroundColor: theme.colors.primary,
                                width: '40%',
                                height: '40%',
                                borderRadius: 10,
                                marginBottom: 10,
                                maxWidth: 100,
                            }}
                            onPress={() => {
                                if (mode == "send") {
                                    setMode('receive')
                                } else {
                                    setMode('send')
                                }
                            }}>
                            {mode == "send" ? "Receive" : "Send"}
                        </Button>

                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <CloseIcon width={24} height={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        <NfcIcon
                            width={80}
                            height={80}
                            color={theme.colors.primary}
                            style={styles.nfcIcon}
                        />

                        <Text style={styles.instructions}>
                            {mode === 'send'
                                ? 'Hold your device near the receiver to send payment'
                                : 'Hold your device near the sender to receive payment'}
                        </Text>

                        <View style={styles.buttonContainer}>
                            {mode === 'send' ? (
                                <Button
                                    onPress={() => handleWriteNfc('YOUR_PAYMENT_DATA', 'ecash')}
                                    style={styles.actionButton}
                                    disabled={isWriting}
                                >
                                    {isWriting ? 'Writing...' : 'Write Payment to NFC'}
                                </Button>
                            ) : (
                                <Button
                                    onPress={handleReadNfc}
                                    style={styles.actionButton}
                                    disabled={isReading}
                                >
                                    {isReading ? 'Reading...' : 'Read Payment from NFC'}
                                </Button>
                            )}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default NfcPayment; 