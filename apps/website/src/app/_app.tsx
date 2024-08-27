import './index.css';

import type {Metadata} from 'next';

import StarknetProvider from '@/context/StarknetProvider';

export const metadata: Metadata = {
  title: 'afk community portal',
  description: 'afk community portal',
};
import {AppProps} from 'next/app';

import Providers from './providers';
function MyApp({Component, pageProps}: AppProps) {
  return (
    <Providers>
      <StarknetProvider>
        <Component {...pageProps} />
      </StarknetProvider>
    </Providers>
  );
}

export default MyApp;
