'use client';

import React, {createContext, useContext} from 'react';

import {useArgentTMA} from '@/hooks/useArgent';

type ArgentTMAContextType = ReturnType<typeof useArgentTMA>;

const ArgentTMAContext = createContext<ArgentTMAContextType | undefined>(undefined);

export function ArgentTMAProvider({children}: {children: React.ReactNode}) {
  const argentTMAValue = useArgentTMA();

  return <ArgentTMAContext.Provider value={argentTMAValue}>{children}</ArgentTMAContext.Provider>;
}

export function useArgentTMAContext() {
  const context = useContext(ArgentTMAContext);
  if (context === undefined) {
    throw new Error('useArgentTMAContext must be used within a ArgentTMAProvider');
  }
  return context;
}
