import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { TanstackProvider, NostrProvider } from 'afk_nostr_sdk';
import { PostDetail } from '@/screens/PostDetail';
import Sidebar from '@/modules/Layout/sidebar';
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
        <NostrProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
            // drawerContent={(props) => <Sidsebar {...props} />}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            {/* <Stack.Screen name="PostDetails" component={PostDetail} /> */}
          </Stack>
        </NostrProvider>
      </TanstackProvider>
      <StatusBar style="auto" />
    </ThemeProvider >
  );
}
