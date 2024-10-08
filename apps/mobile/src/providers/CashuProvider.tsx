import React, {createContext, useContext} from 'react';
import {useCashu} from 'afk_nostr_sdk';
import {ICashu} from 'afk_nostr_sdk';

const CashuContext = createContext<ICashu | undefined>(undefined);

export const CashuProvider = ({children}: {children: React.ReactNode}) => {
  const cashu = useCashu();

  return <CashuContext.Provider value={cashu}>{children}</CashuContext.Provider>;
};

export const useCashuContext = () => {
  return useContext(CashuContext);
};
