import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { NostrProvider, TanstackProvider, useSearch } from 'afk_nostr_sdk';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }
  const notesForYou = useSearch({
    kinds: [1],
    limit: 10,
    // authors: [...contacts?.data?.map((c) => c) || [], ...followersPubkey]
  });
  console.log("notesForYou", notesForYou);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TanstackProvider>
          <NostrProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          </Stack>
        </NostrProvider>
      </TanstackProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
