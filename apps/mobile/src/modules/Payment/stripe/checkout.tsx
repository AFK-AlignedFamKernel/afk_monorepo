import { useEffect, useState } from "react";
const API_URL = process.env.EXPO_PUBLIC_INDEXER_BACKEND_URL;
import { useStripe } from '@stripe/stripe-react-native';
import { View, ScrollView, Text } from "react-native"
import { Button } from "../../../components";

export default function CheckoutScreen() {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);

    const fetchPaymentSheetParams = async () => {
        const response = await fetch(`${API_URL}/payment-sheet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const { paymentIntent, ephemeralKey, customer } = await response.json();

        return {
            paymentIntent,
            ephemeralKey,
            customer,
        };
    };

    const initializePaymentSheet = async () => {
        const {
            paymentIntent,
            ephemeralKey,
            customer,
        } = await fetchPaymentSheetParams();

        const { error } = await initPaymentSheet({
            merchantDisplayName: "Example, Inc.",
            customerId: customer,
            customerEphemeralKeySecret: ephemeralKey,
            paymentIntentClientSecret: paymentIntent,
            // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
            //methods that complete payment after a delay, like SEPA Debit and Sofort.
            allowsDelayedPaymentMethods: true,
            defaultBillingDetails: {
                name: 'Jane Doe',
            }
        });
        if (!error) {
            setLoading(true);
        }
    };

    const openPaymentSheet = async () => {
        // see below
    };

    useEffect(() => {
        initializePaymentSheet();
    }, []);

    return (
        <View>
            <Button
                variant="primary"
                disabled={!loading}
                //   title="Checkout"
                onPress={openPaymentSheet}
            >
                <Text>Checkout</Text>
            </Button>
        </View>
    );
}