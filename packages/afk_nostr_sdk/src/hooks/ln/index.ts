import {Invoice, LightningAddress} from '@getalby/lightning-tools';
import {webln} from '@getalby/sdk';
import {SendPaymentResponse} from '@webbtc/webln-types';
import {useEffect, useState} from 'react';

import {useAuth} from '../../store';
import {useWebLN} from '../shared/useWebLN';

export const useLN = () => {
  const {publicKey, setNWCUrl: setNwcUrlStore, nwcUrl: nwcUrlProps} = useAuth();
  const {
    nostrWebLNState: nostrWebLN,
    setNostrWebLN,
    isExtensionAvailable,
    connectionStatus,
    balance,
    connectWithAlby,
    fetchData,
  } = useWebLN();

  const [nwcUrl, setNwcUrl] = useState(nwcUrlProps);
  const [nwcAuthUrl, setNwcAuthUrl] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState(publicKey);
  
  // Keep your existing functions but remove duplicate state
  const handleZap = async (zapAmount: string, zapRecipient: string) => {
    // Your existing implementation
  };

  const payInvoice = async (zapRecipient: string) => {
    // Your existing implementation
  };

  // ... rest of your existing functions

  return {
    nostrWebLN,
    connectionStatus,
    balance,
    nwcUrl,
    nwcAuthUrl,
    // ... rest of your return values
  };
};