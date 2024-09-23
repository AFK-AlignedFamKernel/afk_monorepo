import './index.css';
import '@rainbow-me/rainbowkit/styles.css';

import type {Metadata} from 'next';
export const metadata: Metadata = {
  title: 'afk community portal',
  description: 'afk community portal',
};
import {AppProps} from 'next/app';

import Providers from './providers';
function MyApp({Component, pageProps}: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}

export default MyApp;
