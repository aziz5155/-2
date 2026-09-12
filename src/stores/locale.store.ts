import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AppLocale = 'ar' | 'en';

interface LocaleState {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'ar',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'app-locale',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const isRTL = (locale: AppLocale) => locale === 'ar';

/**
 * Reactive RTL check. On web, syncNativeDirection sets the document's `dir`
 * directly instead of flipping I18nManager.isRTL (see below), so any code
 * that read I18nManager.isRTL directly was silently always-LTR on web —
 * use this everywhere layout/icon direction needs to follow the current
 * language instead.
 */
export function useIsRTL() {
  return useLocaleStore((s) => isRTL(s.locale));
}

/** Applies the native RTL layout direction and reloads the app if it changed. */
export function syncNativeDirection(locale: AppLocale) {
  const shouldBeRTL = isRTL(locale);

  // react-native-web doesn't persist I18nManager.isRTL across reloads, so the
  // native force-RTL-then-restart dance would reload forever. The web build
  // instead sets the document direction directly, no restart needed.
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = shouldBeRTL ? 'rtl' : 'ltr';
    }
    return false;
  }

  if (I18nManager.isRTL === shouldBeRTL) return false;

  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);
  try {
    Updates.reloadAsync();
  } catch {
    // Reload isn't available (e.g. Expo Go dev client without a build) —
    // the direction still takes effect on the next manual app restart.
  }
  return true;
}
