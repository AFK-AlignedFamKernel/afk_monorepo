// App.ts
// PaymentScreen.ts
import {useStripe} from '@stripe/stripe-react-native';
import {StripeProvider} from '@stripe/stripe-react-native';
import {initStripe} from '@stripe/stripe-react-native';
import {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {Button} from '../../../components';
const API_URL = process.env.EXPO_PUBLIC_INDEXER_BACKEND_URL;

export function PaymentStripeScreen() {
  const [publishableKey, setPublishableKey] = useState('');

  const fetchPublishableKey = async () => {
    //   const key = await fetchKey(); // fetch key from your server here
    //   setPublishableKey(key);
  };

  useEffect(() => {
    fetchPublishableKey();
  }, []);
  useEffect(() => {
    initStripe({
      publishableKey,
      merchantIdentifier: 'merchant.identifier',
      urlScheme: 'your-url-scheme',
    });
  }, []);

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.identifier" // required for Apple Pay
      //   urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
    >
      <PaymentScreen />
    </StripeProvider>
  );
}

function PaymentScreen() {
  const {initPaymentSheet, presentPaymentSheet} = useStripe();

  const setup = async () => {
    const response = await fetch(`${API_URL}/payment-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const {paymentIntent} = await response.json();
    const {error} = await initPaymentSheet({
      merchantDisplayName: 'Example, Inc.',
      paymentIntentClientSecret: paymentIntent, // retrieve this from your server
    });
    if (error) {
      // handle error
    }
  };

  useEffect(() => {
    setup();
  }, []);

  const checkout = async () => {
    const {error} = await presentPaymentSheet();

    if (error) {
      // handle error
    } else {
      // success
    }
  };

  return (
    <View>
      <Button onPress={checkout}>
        <Text>Checkout</Text>
      </Button>
    </View>
  );
}
