import { create } from 'zustand';
import { ArgentTMA } from '@argent/tma-wallet';
import {
  connect,
  disconnect,
  connect as nextConnect,
  StarknetWindowObject,
} from 'starknetkit-next';
import { buildSessionAccount, createSessionRequest, openSession } from '@argent/x-sessions';
import { useEffect, useMemo } from 'react';

import { stark } from 'starknet';
import { dappKey, allowedMethods, provider, expiry, metaData } from 'common';

// Separate configuration for Argent TMA initialization
const ARGENT_CONFIG = {
  environment: 'sepolia',
  appName: 'Hello world',
  appTelegramUrl:
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ||
    process.env.EXPO_PUBLIC_TELEGRAM_BOT_URL ||
    'https://t.me/afk_aligned_dev_bot',
  sessionParams: {
    allowedMethods: [
      {
        contract:
          process.env.NEXT_PUBLIC_CANVAS_STARKNET_CONTRACT_ADDRESS ||
          process.env.NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS ||
          process.env.EXPO_PUBLIC_STARKNET_CONTRACT_ADDRESS ||
          '0x1c3e2cae24f0f167fb389a7e4c797002c4f0465db29ecf1753ed944c6ae746e',
        selector: 'place_pixel',
      },
      // ... other methods
    ],
    validityDays: 90,
  },
};

// Utility function to initialize Argent TMA
const initArgentTMA = () => {
  if (
    typeof window !== 'undefined' &&
    window?.Telegram &&
    // @ts-ignore
    window?.Telegram?.WebApp?.isActive &&
    // @ts-ignore
    window?.Telegram?.WebApp?.platform !== 'unknown'
  ) {
    return ArgentTMA.init(ARGENT_CONFIG as any);
  }
  return null;
};

// Define the types for the store
interface WalletState {
  wallet: StarknetWindowObject | null;
  connectorData: any | null;
  connector: any | null;
  connected: boolean;
  isTelegram: boolean;
  account: any | null;
  isSessionable: boolean;
  queryAddress: string;
  address: string | null;
  usingSessionKeys: boolean;
  sessionRequest: any | null;
  accountSessionSignature: any | null;
  dappKey: { privateKey: Uint8Array; publicKey: string } | null;

  setWallet: (wallet: any) => void;
  setIsTelegram: (isTelegram: boolean) => void;
  setConnectorData: (connectorData: any) => void;
  setConnector: (connector: any) => void;
  setConnected: (connected: boolean) => void;
  setAccount: (account: any) => void;
  setIsSessionable: (isSessionable: boolean) => void;
  setQueryAddress: (queryAddress: string) => void;
  setAddress: (address: string) => void;
  setUsingSessionKeys: (usingSessionKeys: boolean) => void;
  setSessionRequest: (sessionRequest: any) => void;
  setAccountSessionSignature: (accountSessionSignature: any) => void;
  setDappKey: (dappKey: { publicKey: string; privateKey: Uint8Array }) => void;

  disconnectWallet: (devnetMode?: boolean) => void;
  connectWallet: (provider: any, devnetMode?: boolean) => Promise<void>;
  startSession: (provider: any) => Promise<void>;
}

const canSession = (wallet: any) => {
  let sessionableIds = [
    'argentX',
    'ArgentX',
    'argent',
    'Argent',
    'argentMobile',
    'ArgentMobile',
    'argentWebWallet',
    'ArgentWebWallet',
  ];
  if (sessionableIds.includes(wallet.id)) {
    return true;
  }
  return false;
};

export const useWalletStore = create<WalletState>()((set, get) => ({
  wallet: null,
  connectorData: null,
  connector: null,
  connected: false,
  account: null,
  isSessionable: false,
  queryAddress: '0',
  address: null,
  usingSessionKeys: false,
  sessionRequest: null,
  accountSessionSignature: null,
  dappKey: null,
  isTelegram: false,

  setWallet: (wallet) => set({ wallet }),
  setConnectorData: (connectorData) => set({ connectorData }),
  setConnector: (connector) => set({ connector }),
  setConnected: (connected) => set({ connected }),
  setAccount: (account) => set({ account }),
  setIsSessionable: (isSessionable) => set({ isSessionable }),
  setQueryAddress: (queryAddress) => set({ queryAddress }),
  setAddress: (address) => set({ address }),
  setUsingSessionKeys: (usingSessionKeys) => set({ usingSessionKeys }),
  setSessionRequest: (sessionRequest) => set({ sessionRequest }),
  setAccountSessionSignature: (accountSessionSignature) => set({ accountSessionSignature }),
  setDappKey: (dappKey) => set({ dappKey }),
  setIsTelegram: (isTelegram) => set({ isTelegram }),

  connectWallet: async (provider, devnetMode = false) => {
    const state = get();

    if (devnetMode) {
      set({ connected: true });
      return;
    }

    //If in telegram context
    if (state?.isTelegram) {
      const argentTMA = initArgentTMA();
      console.log("argentTma", argentTMA)
      if (!argentTMA) return;
      try {
        const res = await argentTMA.connect()

        if (!res) {
          // Not connected
          // setConnected(false);
          return;
        }

        const { account, callbackData } = res;

        if (account.getSessionStatus() !== 'VALID') {
          // Session has expired or scope (allowed methods) has changed
          // setAccount(account);
          // setConnected(false);
          return;
        }

        // const chainId = await account?.getChainId();
        // setConnectorData({
        //   account: account.address,
        //   chainId: chainId ? BigInt(chainId).toString() : undefined,
        // });

        // setAccount(account);
        // setConnected(true);
        // await connectArgent()
        // await argentTMA.requestConnection({
        //   callbackData: 'custom_callback_data',
        //   approvalRequests: [
        //     // {
        //     //   tokenAddress: '0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7',
        //     //   amount: BigInt(1000000000000000000).toString(),
        //     //   spender: 'spender_address',
        //     // }
        //   ],
        // });

        // await argentTMA.requestConnection("custom_callback", [
        //   // {
        //   //   token: {
        //   //     // Token address that you need approved
        //   //     address: "0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7",
        //   //     name: "Ethereum",
        //   //     symbol: "ETH",
        //   //     decimals: 18,
        //   //   },
        //   //   amount: BigInt(100000).toString(),
        //   //   // Your dapp contract
        //   //   spender: "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
        //   // },
        // ]);

        // await argentTMA.requestConnection({
        //   callbackData: '',
        //   approvalRequests: [],
        // });


      } catch (error) {
        console.log(error, 'err');
      }
    }

    try {
      const { wallet, connectorData, connector } = await nextConnect({
        modalMode: 'alwaysAsk',
        webWalletUrl: process.env.NEXT_PUBLIC_ARGENT_WEBWALLET_URL,
        argentMobileOptions: {
          dappName: 'Afk/lfg',
          url: window.location.hostname,
          chainId:
            process.env.NEXT_PUBLIC_CHAIN_ID || process.env.EXPO_PUBLIC_CHAIN_ID || ('' as any),
          icons: [],
        },
      });

      if (wallet && connectorData && connector) {
        const new_account = await connector.account(provider);

        set({
          wallet,
          connectorData: {
            account: connectorData?.account,
            chainId: connectorData.chainId ? BigInt(connectorData.chainId).toString() : undefined,
          },
          connector,
          connected: true,
          account: new_account,
          address: connectorData?.account,
          isSessionable: canSession(wallet),
        });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      // Optionally handle connection errors
      set({
        connected: false,
        connectorData: null,
        queryAddress: '0',
      });
    }
  },
  startSession: async () => {
    const { wallet, address, connectorData } = get();

    if (!wallet || !address || !connectorData) {
      console.error('Missing required session parameters');
      return;
    }

    try {
      const sessionParams = {
        allowedMethods,
        expiry: expiry,
        metaData: metaData(false),
        publicDappKey: dappKey.publicKey,
      };

      const chainId = await provider.getChainId();
      const accountSessionSignature = await openSession({
        wallet,
        sessionParams: sessionParams as any,
        chainId,
      });

      const sessionRequest = createSessionRequest(
        allowedMethods,
        expiry as any,
        metaData(false),
        dappKey.publicKey,
      );

      if (!accountSessionSignature || !sessionRequest) {
        console.error('Session request failed');
        return;
      }

      set({
        sessionRequest,
        accountSessionSignature,
      });

      const sessionAccount = await buildSessionAccount({
        accountSessionSignature: stark.formatSignature(accountSessionSignature),
        sessionRequest,
        // @ts-ignore
        provider,
        chainId,
        address,
        dappKey: dappKey,
        argentSessionServiceBaseUrl:
          process.env.NEXT_PUBLIC_ARGENT_SESSION_SERVICE_BASE_URL ||
          process.env.EXPO_PUBLIC_ARGENT_SESSION_SERVICE_BASE_URL,
      });

      if (!sessionAccount) {
        console.error('Session account creation failed');
        return;
      }

      set({
        account: sessionAccount,
        usingSessionKeys: true,
      });
    } catch (error) {
      console.error('Session start failed:', error);
      set({
        usingSessionKeys: false,
        sessionRequest: null,
        accountSessionSignature: null,
      });
    }
  },

  disconnectWallet: (devnetMode = false) => {
    // If in devnet mode, simply set connected to false
    if (devnetMode) {
      set({ connected: false });
      return;
    }
    // Reset all wallet-related state
    set({
      wallet: null,
      connectorData: null,
      connected: false,
      account: null,
      sessionRequest: null,
      accountSessionSignature: null,
      usingSessionKeys: false,
      isSessionable: false,
      queryAddress: '0',
      address: null,
    });
    disconnect();
  },
}));

export const useAutoConnect = () => {
  const { setWallet, setConnector, setConnectorData, connectorData, setIsSessionable, setAccount } =
    useWalletStore();

  useEffect(() => {
    const autoConnect = async () => {
      try {
        const {
          wallet: connectedWallet,
          connector,
          connectorData,
        } = await connect({
          modalMode: 'neverAsk',
          webWalletUrl:
            process.env.NEXT_PUBLIC_ARGENT_WEBWALLET_URL ||
            process.env.EXPO_PUBLIC_ARGENT_WEBWALLET_URL,
          argentMobileOptions: {
            dappName: 'Afk/lfg',
            url: window.location.hostname,
            chainId:
              process.env.EXPO_PUBLIC_CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || ('' as any),
            icons: [],
          },
        });
        const new_account = await connector?.account(provider as any);
        setAccount(new_account);
        setConnector(connector);
        setWallet(connectedWallet);
        setIsSessionable(canSession(connectedWallet));
        setConnectorData({
          account: connectorData?.account,
          chainId: connectorData?.chainId ? BigInt(connectorData?.chainId).toString() : undefined,
        });

        if (!connectedWallet) {
          return;
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
      }
    };

    if (!connectorData) {
      autoConnect();
    }
  }, [setConnector, setConnectorData, connectorData, setIsSessionable, setWallet, setAccount]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('wallet_disconnected', async () => {
        setWallet(null);
        setConnectorData(null);
        setConnector(null);
      });
    }
  }, []);
};

export const useQueryAddressEffect = () => {
  const { connectorData, connected, setQueryAddress, setAddress } = useWalletStore();
  useEffect(() => {
    const devnetMode =
      process.env.NEXT_PUBLIC_DEVNET_MODE || process.env.EXPO_PUBLIC_DEVNET_MODE === 'true';
    if (devnetMode) {
      setQueryAddress(
        connected ? '0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0' : '0',
      );
    } else {
      if (!connectorData) {
        setQueryAddress('0');
      } else {
        const formattedQueryAddress = connectorData?.account
          ?.slice(2)
          .toLowerCase()
          .padStart(64, '0');

        setQueryAddress(formattedQueryAddress);
        setAddress(connectorData?.account);
      }
    }
  }, [connectorData, connected]);
};

/**
 * Connection for telegram context
 */
export const useConnectArgent = () => {
  const argentTMA = useMemo(() => initArgentTMA(), []);
  const { setAccount, setConnected, setConnectorData, setIsTelegram } = useWalletStore();
  async function connectArgent() {
    try {
      if (!argentTMA) return;

      setIsTelegram(true);
      const res = await argentTMA.connect();

      if (!res) {
        // Not connected
        setConnected(false);
        return;
      }

      const { account, callbackData } = res;

      if (account.getSessionStatus() !== 'VALID') {
        // Session has expired or scope (allowed methods) has changed
        setAccount(account);
        setConnected(false);
        return;
      }

      const chainId = await account?.getChainId();
      setConnectorData({
        account: account.address,
        chainId: chainId ? BigInt(chainId).toString() : undefined,
      });

      setAccount(account);
      setConnected(true);

      // Custom data passed to the requestConnection() method is available here
      console.log('callback data:', callbackData);
    } catch (error) {
      console.error('Failed to connect:', error);
      // localStorage.removeItem('telegramAccountAddress');
    }
  }
  useEffect(() => {


    connectArgent();
  }, []);

  return {
    connectArgent
  }
};
