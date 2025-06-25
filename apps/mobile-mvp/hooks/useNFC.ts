import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import NfcManager, { Ndef, NfcEvents, NfcTech } from "react-native-nfc-manager";
import { useToast } from "./modals";

export const useNFC = () => {
    const [isNfcSupported, setIsNfcSupported] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");


    const [hasNfc, setHasNFC] = useState(null);
    const { showToast } = useToast();
    const [isReading, setIsReading] = useState(false);
    const [isWriting, setIsWriting] = useState(false);
    const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);


    useEffect(() => {
        if ("NDEFReader" in window) {
            setIsNfcSupported(true);
        } else {
            setMessage("WebNFC is not supported on this device.");
        }
    }, []);

    const scanPermission = async () => {
        try {
            if (Platform.OS === "web") {
                if (!isNfcSupported) {
                    setMessage("NFC is not supported.");
                    return;
                }

                try {
                    console.log("scanPermission web")
                    const ndef = new (window as any).NDEFReader();
                    await ndef.scan(); // Requests permission when called inside a user interaction
                    setMessage("NFC permission granted. Ready to scan.");
                } catch (error) {
                    setMessage("Error requesting NFC permission: " + (error as Error).message);
                }
            } else {
                await NfcManager.requestTechnology(NfcTech.Ndef);

            }
        } catch (err) {
            console.warn(err);
        }
    }
    const readNFCInvoice = async () => {
        try {
            await NfcManager.requestTechnology(NfcTech.Ndef);
            const tag = await NfcManager.getTag();
            if (tag && tag.ndefMessage) {
                const invoice = tag.ndefMessage.map(record =>
                    //   NfcManager.bytesToString(record.payload)
                    Ndef.text.decodePayload(record.payload as any)

                ).join("");

                Alert.alert("Invoice Retrieved", invoice);
                // TODO: Handle payment with Cashu
            }
        } catch (err) {
            console.warn(err);
        } finally {
            NfcManager.cancelTechnologyRequest();
        }
    };
    const checkIsSupported = async () => {
        const deviceIsSupported = await NfcManager.isSupported()
        console.log('deviceIsSupported', deviceIsSupported)
        setHasNFC(deviceIsSupported)
        if (deviceIsSupported) {
            console.log('NFC is supported')
            await NfcManager.start()
        }
    }
    useEffect(() => {


        checkIsSupported()
        // NfcManager.start();
    }, []);

    useEffect(() => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
            console.log('tag found')
        })

        return () => {
            NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        }
    }, [])


    const readTag = async () => {
        await NfcManager.registerTagEvent();
    }

    // Function to handle reading NFC tags (for receiving payments)
    const handleReadNfc = async () => {
        try {

            await checkIsSupported();
            setIsReading(true);
            showToast({ title: 'Ready to read NFC payment', type: 'info' });

            // Uncomment when NFC Manager is installed
            // // Request NFC technology
            await NfcManager.requestTechnology(NfcTech.Ndef);

            // Read NDEF message from tag
            const tag = await NfcManager.getTag();
            const ndefRecords = tag?.ndefMessage || [];

            if (ndefRecords.length > 0) {
                // Parse the first record as text
                const textRecord = ndefRecords[0];
                const textBytes = textRecord.payload;
                // Skip the first 3 bytes (language code length and language code)
                const text = Ndef.text.decodePayload(textBytes as any);

                return text;


            } else {
                showToast({ title: 'No data found on NFC tag', type: 'error' });
            }

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
    const writeNFCWeb = async (invoice: string) => {

        if (typeof window === 'undefined') {
            return;
        }
        // @ts-ignore
        const ndef = new NDEFReader();
        if (!("NDEFReader" in window || !ndef)) {
            //   this.ndef = new window.NDEFReader();

            alert("Web NFC is not supported.");
            return;
        }
        // @ts-ignore
        window.NFC = ndef;
        try {
            // @ts-ignore
            await ndef.write({
                records: [{ recordType: "text", data: invoice }]
            });
            //   await ndef.write(invoice);
            alert("Invoice written to NFC tag!");
        } catch (error) {
            console.error("NFC Write Error:", error);
        }
    };

    const handleReadNfcWeb = async () => {
        try {
            // @ts-ignore
            const ndef = new NDEFReader();
            await ndef.scan();
            console.log("Ready to scan NFC tags...");

            ndef.onreading = event => {
                const decoder = new TextDecoder();
                for (const record of event.message.records) {
                    console.log("Record:", record);
                    console.log("Data:", decoder.decode(record.data));
                }
            };
        } catch (error) {
            console.error("Error reading NFC tag:", error);
        }


    }


    const handleWriteNfc = async (data: string, paymentType: 'lightning' | 'ecash') => {
        if (hasNfc) {
            return handleWriteNfcNative(data, paymentType)
        } else {
            return writeNFCWeb(data)
        }
    }
    // Function to handle writing to NFC tags (for sending payments)
    const handleWriteNfcNative = async (data: string, paymentType: 'lightning' | 'ecash') => {
        try {
            await checkIsSupported();

            setIsWriting(true);
            showToast({ title: 'Ready to write NFC payment', type: 'info' });

            // Uncomment when NFC Manager is installed
            // // Request NFC technology
            await NfcManager.requestTechnology(NfcTech.Ndef, {
                alertMessage: 'Hold your device near the receiver to send payment'
            });

            // Prepare data with proper prefix
            // const prefix = paymentType === 'lightning' ? 'lightning:' : 'cashu:';
            const recordData = data;

            // Format as NDEF Text Record
            const bytes = Ndef.encodeMessage([Ndef.textRecord(recordData)]);

            if (bytes) {
                await NfcManager.ndefHandler.writeNdefMessage(bytes);
                showToast({ title: 'Payment data written to NFC tag', type: 'success' });
            }

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



    return {
        readNFCInvoice,
        handleWriteNfc,
        handleReadNfc,
        checkIsSupported,
        isReading,
        isWriting,
        nfcSupported,
        scanPermission,
    }
}