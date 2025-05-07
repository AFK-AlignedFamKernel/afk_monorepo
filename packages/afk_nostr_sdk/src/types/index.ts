import {GetInfoResponse, MintActiveKeys, MintAllKeysets, MintQuoteResponse, MintQuoteState, Proof} from '@cashu/cashu-ts';
import {NDKUserProfile} from '@nostr-dev-kit/ndk';
/**
 * NIP-60: https://nips.nostr.com/60
 * Spending History Event: https://nips.nostr.com/60#spending-history-event
 */

export type EventMarker = 'destroyed' | 'created' | 'redeemed';

export interface MintData {
  url: string;
  alias: string;
  keys: MintActiveKeys;
  keysets: MintAllKeysets;
  info: GetInfoResponse;
  units: string[];
}


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
  id?:string;
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
  paid?:boolean;
  request?:string;
  expiry?:number;
}

export interface ProofInvoice extends Omit<Proof, 'id'>, ICashuInvoice {}

// Export all type declarations
export * from './global.d';

// Add any other type exports here
