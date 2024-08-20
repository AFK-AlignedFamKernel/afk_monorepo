import './index.css';

import type {Metadata} from 'next';

import Providers from './providers';

export const metadata: Metadata = {
  title: 'afk community portal',
  description: 'afk community portal',
};
import {AppProps} from 'next/app';
import { launchBot } from '@/services/telegram';

function MyApp({Component, pageProps}: AppProps) {
  console.log("process.env.TELEGRAM_BOT_TOKEN)", process.env.TELEGRAM_BOT_TOKEN)
  launchBot(process.env.TELEGRAM_BOT_TOKEN)
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}

export default MyApp;
