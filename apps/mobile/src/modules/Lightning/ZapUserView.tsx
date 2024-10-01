import '../../../applyGlobalPolyfills';
import React, {SetStateAction} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from 'react-native';
import stylesheet from './styles';
import {ZAPType} from '.';
import {useStyles} from '../../hooks';

export function ZapUserView({
  isLoading,
  setIsZapModalVisible,
  setZapAmount,
  setZapRecipient,
  zapAmount,
  zapRecipient,
  handleZap,
  setNostrLnRecipient,
  nostrLnRecipient,
  zapType,
  generatedInvoice,
  setZapType,
}: {
  zapRecipient: any;
  nostrLnRecipient: any;
  zapType: ZAPType;
  setZapType: React.Dispatch<SetStateAction<any>>;
  setNostrLnRecipient: React.Dispatch<SetStateAction<any>>;
  setZapRecipient: React.Dispatch<SetStateAction<any>>;
  zapAmount: string;
  setZapAmount: React.Dispatch<SetStateAction<any>>;
  handleZap: (zapAmount: string, zapRecipient: string) => void;
  setIsZapModalVisible: React.Dispatch<SetStateAction<any>>;
  isLoading: boolean;
  generatedInvoice?: string;
}) {
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Zap a User</Text>

        {zapType == ZAPType.INVOICE ? (
          <View style={styles.content}>
            <TextInput
              placeholder="Invoice"
              value={zapRecipient}
              onChangeText={setZapRecipient}
              style={styles.input}
            />
          </View>
        ) : (
          <View style={styles.content}>
            <TextInput
              placeholder="Recipient (Nostr address)"
              value={nostrLnRecipient}
              onChangeText={setNostrLnRecipient}
              style={styles.input}
            />
          </View>
        )}

        <View style={styles.content}>
          <TextInput
            placeholder="Amount (sats)"
            value={zapAmount}
            onChangeText={setZapAmount}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabledButton]}
          onPress={() => handleZap(zapAmount, zapRecipient)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Processing...' : 'Send Zap'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={() => setIsZapModalVisible(false)}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
