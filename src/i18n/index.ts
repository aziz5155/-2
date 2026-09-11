import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';
import { useLocaleStore } from '@/stores/locale.store';

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

const initialLocale = useLocaleStore.getState().locale;

i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
});

useLocaleStore.subscribe((state, prevState) => {
  if (state.locale !== prevState.locale) {
    i18n.changeLanguage(state.locale);
  }
});

export default i18n;
