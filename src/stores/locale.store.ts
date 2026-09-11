import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
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

/** Applies the native RTL layout direction and reloads the app if it changed. */
export function syncNativeDirection(locale: AppLocale) {
  const shouldBeRTL = isRTL(locale);
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
