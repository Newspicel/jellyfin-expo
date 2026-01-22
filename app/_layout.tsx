import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/query-client';
import { initializeApiClient, configureApiClient } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Shared screen options for Liquid Glass effect
const liquidGlassScreenOptions = {
  headerTransparent: true,
  headerBlurEffect: 'systemChromeMaterial' as const,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  headerStyle: {
    backgroundColor: 'transparent',
  },
};

function AppContent() {
  const colorScheme = useColorScheme();
  const isLoading = useAuthStore((state) => state.isLoading);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);
  const getCredentials = useAuthStore((state) => state.getCredentials);
  const currentServerId = useServerStore((state) => state.currentServerId);

  useEffect(() => {
    async function init() {
      await initializeApiClient();
      configureApiClient();
      setIsLoading(false);
    }
    init();
  }, [setIsLoading]);

  if (isLoading) {
    return null; // Or a loading screen
  }

  // Check if user is authenticated for the current server
  const hasValidAuth = currentServerId !== null && getCredentials(currentServerId) !== null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          ...liquidGlassScreenOptions,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} redirect={!hasValidAuth} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} redirect={hasValidAuth} />
        <Stack.Screen
          name="(player)"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen name="item" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
            headerShown: true,
            ...liquidGlassScreenOptions,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
