import { StripeProvider } from '@stripe/stripe-react-native';
import { PropsWithChildren, useEffect, useState } from 'react';

const EXPO_PUBLIC_MERCHANT_ID_APPLE=process.env.EXPO_PUBLIC_MERCHANT_ID_APPLE
export const StripeProviderContext: React.FC<PropsWithChildren> = ({ children }) => {
    const [publishableKey, setPublishableKey] = useState('');

    const fetchPublishableKey = async () => {
        // const key = await fetchKey(); // fetch key from your server here
        // setPublishableKey(key);
    };

    useEffect(() => {
        fetchPublishableKey();
    }, []);

    return (
        <StripeProvider
            publishableKey={publishableKey}
            merchantIdentifier={EXPO_PUBLIC_MERCHANT_ID_APPLE ?? "merchant.identifier"} // required for Apple Pay
            urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
        >
            {children}

        </StripeProvider>
    );
}