import React, { createContext, useContext, ReactNode } from 'react';
import { useCashu } from '@/hooks/useCashu';

// Define the shape of our context
type CashuContextType = ReturnType<typeof useCashu>;

// Create the context with a default undefined value
const CashuContext = createContext<CashuContextType | undefined>(undefined);

// Provider component
export const CashuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const cashu = useCashu();
  
  return <CashuContext.Provider value={cashu}>{children}</CashuContext.Provider>;
};

// Hook to use the context
export const useCashuContext = (): CashuContextType => {
  const context = useContext(CashuContext);
  
  if (context === undefined) {
    throw new Error('useCashuContext must be used within a CashuProvider');
  }
  
  return context;
}; 