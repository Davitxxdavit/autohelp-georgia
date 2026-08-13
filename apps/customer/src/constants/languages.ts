export const LANGUAGE_IDS = ['ka', 'en', 'ru', 'tr'] as const;

export type LanguageId = (typeof LANGUAGE_IDS)[number];

export const DEFAULT_LANGUAGE: LanguageId = 'ka';

export type LanguageOption = {
  id: LanguageId;
  /** English label — stable for future i18n keys */
  nameKey: string;
  /** Native script display name */
  nativeName: string;
};

export const LANGUAGES: LanguageOption[] = [
  { id: 'ka', nameKey: 'Georgian', nativeName: 'ქართული' },
  { id: 'en', nameKey: 'English', nativeName: 'English' },
  { id: 'ru', nameKey: 'Russian', nativeName: 'Русский' },
  { id: 'tr', nameKey: 'Turkish', nativeName: 'Türkçe' },
];
