import '../applyGlobalPolyfills';
import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { NostrProvider, TanstackProvider } from 'afk_nostr_sdk';
import { CashuProvider } from '@/providers/CashuProvider';
import { ToastProvider } from '@/context/Toast/ToastContext';
import { DialogProvider } from '@/context/Dialog';
import { LoginModalProvider } from '@/context/LoginModalProvider';
import { StarknetProvider } from '@/providers/StarknetProvider';
import { QuoteNostrModalProvider } from '@/context/QuoteNostrModal';
import { TipModalProvider } from '@/context/TipModal';
import { WalletModalProvider } from '@/context/WalletModal';
import { TransactionModalProvider } from '@/context/TransactionModal';
import { ModalParentProvider } from '@/context/modal/ModalParent';
import { SocketProvider } from '@/context/SocketContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TanstackProvider>
        <SocketProvider >
          <StarknetProvider>

            <NostrProvider>
              <CashuProvider>
                <ToastProvider>

                  <DialogProvider>
                    <LoginModalProvider>
                      <QuoteNostrModalProvider>
                        <WalletModalProvider>
                          <TransactionModalProvider
                          >
                            <ModalParentProvider
                            >
                              <TipModalProvider>
                                <Stack>
                                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                  <Stack.Screen name="+not-found" />
                                </Stack>
                              </TipModalProvider>
                            </ModalParentProvider>
                          </TransactionModalProvider>
                        </WalletModalProvider>
                      </QuoteNostrModalProvider>
                    </LoginModalProvider>
                  </DialogProvider>
                </ToastProvider>
              </CashuProvider>
            </NostrProvider>
          </StarknetProvider>
        </SocketProvider>
      </TanstackProvider>
      <StatusBar style="auto" />
    </ThemeProvider >
  );
}
