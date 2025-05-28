import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {PropsWithChildren} from 'react';

const queryClient = new QueryClient({
  defaultOptions: {queries: {retry: 2}},
});

export const TanstackProvider: React.FC<PropsWithChildren> = ({children}) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
