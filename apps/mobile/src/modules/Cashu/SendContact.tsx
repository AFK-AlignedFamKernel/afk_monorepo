import {LightningAddress} from '@getalby/lightning-tools';
import {Picker} from '@react-native-picker/picker';
import {Contact, useCashuStore} from 'afk_nostr_sdk';
import React, {useState} from 'react';
import {Button, Text, TextInput, View} from 'react-native';

import {useStyles} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {usePayment} from '../../hooks/usePayment';
import stylesheet from './styles';

// Type definition for SendModalProps
interface SendModalProps {
  onClose?: () => void;
}

const SendNostrContact: React.FC<SendModalProps> = ({onClose}) => {
  const {showToast} = useToast();
  const styles = useStyles(stylesheet);
  const {contacts, setContacts} = useCashuStore();
  const [amount, setAmount] = useState<string>('');
  const [contactSelected, setContactSelected] = useState<Contact | undefined>();
  const [recipient, setRecipient] = useState<string>('');
  const [step, setStep] = useState<'amount' | 'recipient' | 'confirm'>('amount');
  const [invoice, setInvoice] = useState<string | undefined>();
  const {handlePayInvoice} = usePayment();

  const handleNext = () => {
    if (step === 'amount' && amount) {
      setStep('recipient');
    } else if (step === 'recipient' && recipient) {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'recipient') {
      setStep('amount');
    } else if (step === 'confirm') {
      setStep('recipient');
    }
  };

  const onTipPress = async (contact: Contact) => {
    if (!amount) {
      showToast({title: 'Zap send', type: 'error'});
      return;
    }

    if (!contact?.lud16) {
      showToast({
        title: "This profile doesn't have a lud16 Lightning address",
        type: 'error',
      });
      return;
    }

    const ln = new LightningAddress(contact.lud16);
    await ln.fetch();
    const invoice = await ln.requestInvoice({satoshi: Number(amount)});

    setInvoice(invoice?.paymentRequest);
    if (!invoice) {
      return showToast({title: 'Invoice creation failed', type: 'error'});
    }

    const response = await handlePayInvoice(invoice.paymentRequest);
    if (response) {
      showToast({title: 'Payment sent', type: 'success'});
    }
  };

  const handleConfirm = async () => {
    if (!contactSelected) {
      return showToast({title: 'Please select a contact', type: 'error'});
    }
    onTipPress(contactSelected);
  };

  return (
    <View style={styles.container}>
      {step === 'amount' && (
        <View>
          <Text style={styles.label}>Amount (sats)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(text) => setAmount(text)}
            placeholder="Enter amount"
            value={amount}
          />
        </View>
      )}

      {step === 'recipient' && (
        <View>
          <Text style={styles.label}>Recipient</Text>
          <Picker
            selectedValue={recipient}
            onValueChange={(itemValue) => {
              setRecipient(itemValue);
              const find = contacts?.find((c) => c?.pubkey === itemValue);
              if (find) setContactSelected(find);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select a contact" value="" />
            {contacts?.map((contact) => (
              <Picker.Item
                key={contact?.pubkey}
                label={contact?.displayName || contact?.lud16 || contact?.pubkey}
                value={contact?.pubkey}
              />
            ))}
          </Picker>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setRecipient(text)}
            placeholder="Or paste an address"
            value={recipient}
          />
        </View>
      )}

      {step === 'confirm' && (
        <View style={styles.confirmContainer}>
          <Text style={styles.confirmText}>
            Confirm payment of {amount} sats to {recipient}
          </Text>
          <Button title="Confirm Payment" onPress={handleConfirm} />
        </View>
      )}

      <View style={styles.buttonContainer}>
        {step !== 'amount' && <Button title="Back" onPress={handleBack} color="#777" />}
        {step !== 'confirm' && (
          <Button
            title="Next"
            onPress={handleNext}
            disabled={(!amount && step === 'amount') || (!recipient && step === 'recipient')}
          />
        )}
      </View>
    </View>
  );
};

export default SendNostrContact;
