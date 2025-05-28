import * as React from 'react';
import NDK, { NDKEvent, NDKFilter, NDKKind, NDKNip07Signer, NDKNwc, NDKPrivateKeySigner, NDKRelay, NDKRelaySet, NDKSubscription, NDKTag, NDKUser } from '@nostr-dev-kit/ndk';
import NDKWallet, { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';

// Import types from SDK 
export * from '../src/context';
export * from '../src/hooks';
export * from '../src/store';
export * from '../src/utils';

// NostrContext types
export interface NostrContextType {
  ndk: NDK;
  nip07Signer?: NDKNip07Signer;
  nwcNdk?: NDKNwc;
  ndkCashuWallet?: NDKCashuWallet;
  ndkWallet?: NDKWallet;
}

// Context components
export const NostrContext: React.Context<NostrContextType | null>;
export const NostrProvider: React.FC<React.PropsWithChildren>;
export const TanstackProvider: React.FC<React.PropsWithChildren>;

// Hooks
export function useNostrContext(): NostrContextType;
export function useAuth(selector: (state: any) => any): any;
export function useSettingsStore(selector: (state: any) => any): any;
export function useNip07Extension(): any;
export function useCashu(): any;
export function useCashuStore(): any;
export function useLN(): any;

// Other hooks (minimal exports for common use cases)
export function useProfile(options: any): any;
export function useGetLiveEvents(options?: any): any;
export function useLiveActivity(eventId?: string): any;
export function useContacts(options?: any): any;
export function useAllProfiles(options?: any): any;
export function useSearch(options?: any): any;
export function useSearchSince(options?: any): any;
export function useIncomingMessageUsers(options?: any): any;
export function useMyGiftWrapMessages(options?: any): any;
export function useRoomMessages(options?: any): any;
export function useSendPrivateMessage(): any;
export function useEditContacts(): any;
export function useGetVideos(options?: any): any;

// Utility exports
export const AFK_RELAYS: string[];
export const NostrKeyManager: any;

// Export types from dependencies
export {
  NDK,
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKNip07Signer,
  NDKPrivateKeySigner,
  NDKRelay,
  NDKRelaySet,
  NDKSubscription,
  NDKTag,
  NDKUser,
  NDKWallet,
  NDKCashuWallet
};
