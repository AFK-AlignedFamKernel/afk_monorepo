// afk_nostr_sdk adapter for use with React Native
const React = require('react');
const { createContext, useContext, useState, useEffect } = require('react');

// Create a minimally viable implementation of the key components
const NostrContext = createContext(null);

const NostrProvider = ({ children }) => {
  const [ndk, setNdk] = useState({});
  return React.createElement(
    NostrContext.Provider,
    { value: { ndk } },
    children
  );
};

const TanstackProvider = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

// Basic hook implementations
const useNostrContext = () => {
  const context = useContext(NostrContext);
  if (!context) {
    console.warn('useNostrContext must be used within a NostrProvider');
    return {};
  }
  return context;
};

const useAuth = (selector) => {
  return selector ? selector({}) : {};
};

const useSettingsStore = (selector) => {
  return selector ? selector({}) : {};
};

// Export everything
module.exports = {
  NostrProvider,
  TanstackProvider,
  useNostrContext,
  useAuth,
  useSettingsStore,
  // Add other hooks as needed
  useProfile: () => ({}),
  useGetLiveEvents: () => ({}),
  useLiveActivity: () => ({}),
  useContacts: () => ({}),
  useAllProfiles: () => ({}),
  useSearch: () => ({}),
  useSearchSince: () => ({}),
  useIncomingMessageUsers: () => ({}),
  useMyGiftWrapMessages: () => ({}),
  useRoomMessages: () => ({}),
  useSendPrivateMessage: () => ({}),
  useEditContacts: () => ({}),
  useGetVideos: () => ({}),
  NostrKeyManager: {},
  AFK_RELAYS: []
}; 