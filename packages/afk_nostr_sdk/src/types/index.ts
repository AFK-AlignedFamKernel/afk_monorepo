import { NDKUserProfile } from "@nostr-dev-kit/ndk";

export interface Transaction {
    id: number;
    amount: number;
    date: Date;
    description: string;
    status: "completed" | "pending" | "failed";
    recipient?: string;
    sender?: string;
    fee?: number;
}
export interface Contact extends NDKUserProfile {
    handle?: string;
    avatarUrl?: string;
    pubkey?:string;
    nprofile?:string;
    eventId?:string;
}

export interface Notification {
    id: number;
    message: string;
    date: Date;
    read: boolean;
}

import { MintQuoteResponse, MintQuoteState } from "@cashu/cashu-ts";

export interface ICashuInvoice extends MintQuoteResponse {
  bolt11?: string;
//   quote?: string;
  amount?: string;
  date?: number;
  mint?: string;
  unit?: string;
  direction?: "in" | "out"; // receive or send
  quoteResponse?:MintQuoteResponse;
}
