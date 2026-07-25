import { createI18n } from '@mister-guiiug/dev-wpa-config/react/i18n';
import { messages } from './messages';

/** Clé localStorage de persistance du choix de langue (partagée avec le SW). */
export const LOCALE_STORAGE_KEY = 'cim10_locale';

export const { I18nProvider, useI18n } = createI18n({
  messages,
  locales: ['fr', 'en'],
  fallbackLocale: 'fr',
  storageKey: LOCALE_STORAGE_KEY,
});

export type { Locale, Messages } from './messages';
