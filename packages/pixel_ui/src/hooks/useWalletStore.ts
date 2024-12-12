
import { create } from 'zustand'
import { connect, disconnect, connect as nextConnect, StarknetWindowObject } from 'starknetkit-next';
import { buildSessionAccount, createSessionRequest, openSession } from '@argent/x-sessions';
import { useEffect } from 'react';

import { stark } from 'starknet';
import { allowedMethods, dappKey, expiry, metaData, provider } from '../utils/Consts';

// Define the types for the store
interface WalletState {
    wallet: StarknetWindowObject  | null
    connectorData: any | null
    connector: any | null
    connected: boolean
    account: any | null
    isSessionable: boolean
    queryAddress: string
    address: string | null
    usingSessionKeys: boolean
    sessionRequest: any | null
    accountSessionSignature: any | null
    dappKey: { privateKey: Uint8Array, publicKey: string } | null
    
  
    setWallet: (wallet: any) => void
    setConnectorData: (connectorData: {account:string, chainId:string}) => void
    setConnector: (connector: any) => void
    setConnected: (connected: boolean) => void
    setAccount: (account: any) => void
    setIsSessionable: (isSessionable: boolean) => void
    setQueryAddress: (queryAddress: string) => void
    setAddress: (address: string) => void
    setUsingSessionKeys: (usingSessionKeys: boolean) => void
    setSessionRequest: (sessionRequest: any) => void
    setAccountSessionSignature: (accountSessionSignature: any) => void
    setDappKey: (dappKey: { publicKey: string, privateKey }) => void

    disconnectWallet: (devnetMode?: boolean) => void
    connectWallet: (provider: any, devnetMode?: boolean) => Promise<void>
    startSession: (provider: any) => Promise<void>
}



const canSession = (wallet) => {
    let sessionableIds = [
      'argentX',
      'ArgentX',
      'argent',
      'Argent',
      'argentMobile',
      'ArgentMobile',
      'argentWebWallet',
      'ArgentWebWallet'
    ];
    if (sessionableIds.includes(wallet.id)) {
      return true;
    }
    return false;
  };


  export const useWalletStore = create<WalletState>()(
      (set, get) => ({
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
  
        connectWallet: async (provider, devnetMode = false) => {
        if (devnetMode) {
             set({ connected: true });
            return;
        }
  
        try {
         const { wallet, connectorData, connector } = await nextConnect({
          modalMode: 'alwaysAsk',
          webWalletUrl: process.env.NEXT_PUBLIC_ARGENT_WEBWALLET_URL,
          argentMobileOptions: {
            dappName: 'Afk/lfg',
            url: window.location.hostname,
            chainId: process.env.NEXT_PUBLIC_CHAIN_ID || "",
            icons: []
          }
        });
  
        if (wallet && connectorData && connector) {

          const new_account = await connector.account(provider);
          set({
            wallet,
            connectorData:{account:connectorData?.account,chainId: connectorData.chainId ? BigInt(connectorData.chainId).toString(): undefined},
            connector,
            connected: true,
            account: new_account,
            address: connectorData?.account,
            isSessionable: canSession(wallet)
          });
          
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
        // Optionally handle connection errors
        set({ 
          connected: false, 
          connectorData: null,
          queryAddress: '0' 
        });
      }
    },
    startSession: async () => {
        const { 
          wallet, 
          address, 
          connectorData,
        } = get()
    
        if (!wallet || !address || !connectorData) {
          console.error('Missing required session parameters');
          return;
        }
    
        try {
          const sessionParams = {
            allowedMethods,
            expiry: expiry,
            metaData: metaData(false),
            publicDappKey: dappKey.publicKey
          };
    
          const chainId = await provider.getChainId();
          const accountSessionSignature = await openSession({
            wallet,
            sessionParams: sessionParams as any,
            chainId
          });
    
          const sessionRequest = createSessionRequest(
            allowedMethods,
            expiry as any,
            metaData(false),
            dappKey.publicKey
          );
    
          if (!accountSessionSignature || !sessionRequest) {
            console.error('Session request failed');
            return;
          }
    
          set({ 
            sessionRequest, 
            accountSessionSignature 
          });
    
          const sessionAccount = await buildSessionAccount({
            accountSessionSignature: stark.formatSignature(accountSessionSignature),
            sessionRequest,
            provider,
            chainId,
            address,
            dappKey: dappKey,
            argentSessionServiceBaseUrl: process.env.NEXT_PUBLIC_ARGENT_SESSION_SERVICE_BASE_URL
          });
    
          if (!sessionAccount) {
            console.error('Session account creation failed');
            return;
          }
    
          set({ 
            account: sessionAccount, 
            usingSessionKeys: true 
          });
    
        } catch (error) {
          console.error('Session start failed:', error);
          set({ 
            usingSessionKeys: false,
            sessionRequest: null,
            accountSessionSignature: null 
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
            address: null
          });
          disconnect()
        }
      }),
  )

  export const useAutoConnect = () => {
    const {setWallet, setConnector, setConnectorData,connectorData, setIsSessionable,
      } = useWalletStore()
  
    useEffect(() => {
      const autoConnect = async () => {
        try {
          const { wallet: connectedWallet, connector, connectorData } = await connect({
            modalMode: 'neverAsk',
            webWalletUrl: process.env.NEXT_PUBLIC_ARGENT_WEBWALLET_URL,
            argentMobileOptions: {
              dappName: 'Afk/lfg',
              url: window.location.hostname,
              chainId: process.env.NEXT_PUBLIC_CHAIN_ID || "",
              icons: []
            }
          });
  
          setConnector(connector);
          setWallet(connectedWallet)
          setIsSessionable(canSession(connectedWallet))
          setConnectorData({
            account:connectorData.account,
            chainId: connectorData.chainId ? BigInt(connectorData.chainId).toString(): undefined
          });
  
          if (!connectedWallet) {
            return
          }
        } catch (error) {
          console.error("Auto-connect failed:", error);
        }
      };
  
      if (!connectorData) {
        autoConnect();
      }
    }, [setConnector, setConnectorData, connectorData, setIsSessionable, setWallet]);

    useEffect(() => {
        if (typeof window !== "undefined") {
          document.addEventListener("wallet_disconnected", async () => {
            setWallet(null)
            setConnectorData(null)
            setConnector(null)
          })
        }
      }, [])
  };
  

  export const useQueryAddressEffect = () => {
    const { 
      connectorData, 
      connected, 
      setQueryAddress, 
      setAddress 
    } = useWalletStore()
    useEffect(() => {
      const devnetMode = process.env.NEXT_PUBLIC_DEVNET_MODE === 'true'
      if (devnetMode) {
        setQueryAddress(
          connected 
            ? '0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0'
            : '0'
        )
      } else {
        if (!connectorData) {
          setQueryAddress('0')
        } else {
          const formattedQueryAddress = connectorData?.account
            ?.slice(2)
            .toLowerCase()
            .padStart(64, '0')
          
          setQueryAddress(formattedQueryAddress)
          setAddress(connectorData?.account)
        }
      }
    }, [connectorData, connected])
  }
