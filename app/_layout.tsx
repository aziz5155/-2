import '@/i18n';

import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LoadingState } from '@/design-system/components/LoadingState';
import { ThemeProvider, useTheme } from '@/design-system/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { useAuthStore } from '@/stores/auth.store';
import { syncNativeDirection, useLocaleStore } from '@/stores/locale.store';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Apply the stored language's writing direction before the first paint. On
// a fresh install this is a no-op (device default already matches); it only
// reloads when the persisted preference disagrees with the native flag.
const initialLocale = useLocaleStore.getState().locale;
syncNativeDirection(initialLocale);

function RootNavigator() {
  const theme = useTheme();
  const isLoading = useAuthStore((s) => s.isLoading);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(parent)" />
        <Stack.Screen name="(child)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, direction: I18nManager.isRTL ? 'rtl' : 'ltr' }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryProvider>
            <RootNavigator />
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
