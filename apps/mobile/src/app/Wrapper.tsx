import { QueryClient } from '@tanstack/react-query';
import { TanstackProvider } from 'afk_nostr_sdk';
import { NostrProvider } from 'afk_nostr_sdk';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Host as PortalizeProvider } from 'react-native-portalize';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootScreenContainer } from '../components';
import { DialogProvider } from '../context/Dialog';
import { KeyModalProvider } from '../context/KeysModal';
import { ThemeProvider } from '../context/Theme';
import { TipModalProvider } from '../context/TipModal';
import { TipModalStarknetProvider } from '../context/TipModalStarknet';
import { ToastProvider } from '../context/Toast/ToastContext';
import { TokenCreateModalProvider } from '../context/TokenCreateModal';
import { TransactionModalProvider } from '../context/TransactionModal';
import { WalletModalProvider } from '../context/WalletModal';
import App from './App';
import { StarknetProvider } from './StarknetProvider';
import { ModalParentProvider } from '../context/modal/ModalParent';
import { EVMProvider } from './EVMProvider';
import { WalletModalEVMProvider } from '../context/WalletModalEvmProvider';
import { CashuProvider } from '../providers/CashuProvider';
import { dynamicClient } from './DynamicClient';
import { SwapModalEVMProvider } from '../context/SwapModalProvider';
import { LoginModalProvider } from '../context/LoginModalProvider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2 } },
});

const ModalProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      <WalletModalEVMProvider>
        <SwapModalEVMProvider>
          <WalletModalProvider>
            <TransactionModalProvider>
              <TipModalProvider>
                <TipModalStarknetProvider>
                  <TokenCreateModalProvider>
                    <KeyModalProvider>
                      <LoginModalProvider>
                        <ModalParentProvider>{children}</ModalParentProvider>
                      </LoginModalProvider>
                    </KeyModalProvider>
                  </TokenCreateModalProvider>
                </TipModalStarknetProvider>
              </TipModalProvider>
            </TransactionModalProvider>
          </WalletModalProvider>
        </SwapModalEVMProvider>
      </WalletModalEVMProvider>
    </ToastProvider>
  );
};

export const Wrapper: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NostrProvider>
          <TanstackProvider>
            <SafeAreaProvider>
              <RootScreenContainer>
                <PortalizeProvider>
                  <DialogProvider>
                    <StarknetProvider>
                      <EVMProvider>
                        <CashuProvider>
                          {/* <dynamicClient.reactNative.WebView /> */}
                          {/* <DynamicProvider> */}
                          <ModalProviders>
                            <App />
                          </ModalProviders>
                          {/* </DynamicProvider> */}
                        </CashuProvider>
                      </EVMProvider>
                    </StarknetProvider>
                  </DialogProvider>
                </PortalizeProvider>
              </RootScreenContainer>
            </SafeAreaProvider>
          </TanstackProvider>
        </NostrProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};
