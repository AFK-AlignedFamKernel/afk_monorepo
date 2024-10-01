import {NDKUserProfile} from '@nostr-dev-kit/ndk';
import {MintQuoteResponse, MintQuoteState, Proof} from '@cashu/cashu-ts';

export interface Contact extends NDKUserProfile {
  handle?: string;
  avatarUrl?: string;
  pubkey?: string;
  nprofile?: string;
  eventId?: string;
}

export interface Notification {
  id: number;
  message: string;
  date: Date;
  read: boolean;
}

export interface ICashuInvoice {
  bolt11?: string;
  quote?: string;
  amount: number;
  date?: number;
  mint?: string;
  unit?: string;
  state?: string | MintQuoteState;
  direction?: 'in' | 'out'; // receive or send
  quoteResponse?: MintQuoteResponse;
  type?: 'ecash' | 'lightning';
}

export interface ProofInvoice extends Proof, ICashuInvoice {}
