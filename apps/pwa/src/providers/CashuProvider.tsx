// import React, { createContext, useContext, ReactNode, useEffect } from 'react';
// import { useCashu } from '@/hooks/useCashu';
// import {ICashu} from 'afk_nostr_sdk';
// import { NostrKeyManager } from 'afk_nostr_sdk';

// // Define the shape of our context
// type CashuContextType = ICashu;

// // Create the context with a default undefined value
// const CashuContext = createContext<CashuContextType | undefined>(undefined);

// // Provider component
// export const CashuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const cashu = useCashu();
  
//   // Check for Nostr connection on mount - this helps components know if Nostr seed is available
//   useEffect(() => {
//     const checkNostrConnection = async () => {
//       try {
//         await NostrKeyManager.checkNostrSeedAvailable();
//       } catch (err) {
//         console.error('Error checking Nostr connection in CashuProvider:', err);
//       }
//     };
    
//     checkNostrConnection();
//   }, []);
  
//   return <CashuContext.Provider value={cashu}>{children}</CashuContext.Provider>;
// };

// // Custom hook to use the Cashu context
// export const useCashuContext = () => {
//   const context = useContext(CashuContext);
//   if (context === undefined) {
//     throw new Error('useCashuContext must be used within a CashuProvider');
//   }
//   return context;
// }; 
import {useCashu} from 'afk_nostr_sdk';
import {ICashu} from 'afk_nostr_sdk';
import React, {createContext, useContext} from 'react';

const CashuContext = createContext<ICashu | undefined>(undefined);

export const CashuProvider = ({children}: {children: React.ReactNode}) => {
  const cashu = useCashu();

  return <CashuContext.Provider value={cashu}>{children}</CashuContext.Provider>;
};

export const useCashuContext = () => {
  return useContext(CashuContext);
};
