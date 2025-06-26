import {createClient} from '@dynamic-labs/client';
import {ReactNativeExtension} from '@dynamic-labs/react-native-extension';

export const dynamicClient = createClient({
  environmentId: process.env.EXPO_PUBLIC_DYNAMIC_API_KEY ?? '',
  // Optional:
  appLogoUrl: 'https://demo.dynamic.xyz/favicon-32x32.png',
  appName: 'Dynamic Demo',
}).extend(ReactNativeExtension());
