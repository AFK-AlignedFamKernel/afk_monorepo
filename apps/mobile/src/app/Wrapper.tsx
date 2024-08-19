import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Host as PortalizeProvider } from 'react-native-portalize';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootScreenContainer } from '../components';
import { DialogProvider } from '../context/Dialog';
import { KeyModalProvider } from '../context/KeysModal';
import { ThemeProvider } from '../context/Theme';
import { TipModalProvider } from '../context/TipModal';
import { ToastProvider } from '../context/Toast/ToastContext';
import { TransactionModalProvider } from '../context/TransactionModal';
import { WalletModalProvider } from '../context/WalletModal';
import App from './App';
import { StarknetProvider } from './StarknetProvider';
// import { NostrProvider } from '../context/NostrContext';
import { TanstackProvider } from 'afk_nostr_sdk';
import { NostrProvider } from 'afk_nostr_sdk';
import { TipModalStarknetProvider } from '../context/TipModalStarknet';
import { TokenCreateModalProvider } from '../context/TokenCreateModal';
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2 } },
});

const ModalProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      <WalletModalProvider>
        <TransactionModalProvider>
          <TipModalProvider>
            <TipModalStarknetProvider>
              <TokenCreateModalProvider>
                <KeyModalProvider>{children}</KeyModalProvider>
              </TokenCreateModalProvider>
            </TipModalStarknetProvider>
          </TipModalProvider>
        </TransactionModalProvider>
      </WalletModalProvider>
    </ToastProvider>
  );
};

export const Wrapper: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NostrProvider>
          <TanstackProvider>

            {/* <NostrProvider> */}

            {/* <QueryClientProvider client={queryClient}> */}
            <SafeAreaProvider>
              <RootScreenContainer>
                <PortalizeProvider>
                  <DialogProvider>
                    <StarknetProvider>
                      <ModalProviders>
                        <App />
                      </ModalProviders>
                    </StarknetProvider>
                  </DialogProvider>
                </PortalizeProvider>
              </RootScreenContainer>
            </SafeAreaProvider>
            {/* </QueryClientProvider> */}
            {/* </NostrProvider> */}
          </TanstackProvider>

        </NostrProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};
