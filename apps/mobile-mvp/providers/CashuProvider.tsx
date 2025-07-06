import {useCashu} from 'afk_nostr_sdk';
import {ICashu} from 'afk_nostr_sdk';
import React, {createContext, useContext} from 'react';

const CashuContext = createContext<ICashu>({} as ICashu);

export const CashuProvider = ({children}: {children: React.ReactNode}) => {
  const cashu = useCashu();

  return <CashuContext.Provider value={cashu}>{children}</CashuContext.Provider>;
};

export const useCashuContext = () => {
  const ctx = useContext(CashuContext);
  if (!ctx) {
    throw new Error('useCashuContext must be used within a CashuProvider');
  }
  return ctx;
};
