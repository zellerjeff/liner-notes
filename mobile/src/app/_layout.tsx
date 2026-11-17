import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Accent, Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { PlayerProvider } from '@/lib/player';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;

  return (
    <Stack>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Liner Notes' }} />
        <Stack.Screen
          name="item/[id]"
          options={{ title: 'Note', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen name="import" options={{ title: 'Import', presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={status !== 'signedIn'}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

function navTheme(scheme: 'light' | 'dark') {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const palette = Colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: Accent,
      background: palette.background,
      card: palette.background,
      text: palette.text,
      border: palette.backgroundSelected,
    },
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme(colorScheme === 'dark' ? 'dark' : 'light')}>
        <AuthProvider>
          <PlayerProvider>
            <RootNavigator />
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
