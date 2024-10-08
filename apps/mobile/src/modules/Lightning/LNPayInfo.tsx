import '../../../applyGlobalPolyfills';
import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from 'react-native';
import {useStyles, useTheme} from '../../hooks';
import stylesheet from './styles';
import {Input} from '../../components';
import {useToast} from '../../hooks/modals';
import * as Clipboard from 'expo-clipboard';
import {CopyIconStack} from '../../assets/icons';

export function LNPayInfo({
  setIsInvoiceModalVisible,
  setInvoiceAmount,
  setInvoiceMemo,
  invoiceAmount,
  invoiceMemo,
  isLoading,
  generateInvoice,
  invoiceGenerated,
}: {
  setIsInvoiceModalVisible: any;
  invoiceMemo: string;
  setInvoiceMemo: any;
  setInvoiceAmount: any;
  invoiceAmount: string;
  isLoading?: boolean;
  generateInvoice: (invoiceAmount?: string) => void;
  invoiceGenerated?: string;
}) {
  const styles = useStyles(stylesheet);
  console.log('invoiceGenerated', invoiceGenerated);
  const {showToast} = useToast();
  const {theme} = useTheme();

  const handleCopyInvoice = async () => {
    if (invoiceGenerated) {
      await Clipboard.setStringAsync(invoiceGenerated);
      showToast({type: 'info', title: 'Invoice copied to the clipboard'});
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Receive Satoshi</Text>
        <View style={styles.content}>
          <TextInput
            placeholder="Amount (sats)"
            value={invoiceAmount}
            keyboardType="numeric"
            onChangeText={setInvoiceAmount}
            style={styles.input}
          />
        </View>
        <View style={styles.content}>
          <TextInput
            placeholder="Notes"
            value={invoiceMemo}
            onChangeText={setInvoiceMemo}
            style={styles.input}
          />
        </View>

        {invoiceGenerated && (
          <Input
            value={invoiceGenerated}
            editable={false}
            right={
              <TouchableOpacity
                onPress={() => handleCopyInvoice()}
                style={{
                  marginRight: 10,
                }}
              >
                <CopyIconStack color={theme.colors.primary} />
              </TouchableOpacity>
            }
          />
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabledButton]}
          onPress={() => generateInvoice(invoiceAmount)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Processing...' : 'Generate Invoice'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsInvoiceModalVisible(false)}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
