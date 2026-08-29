import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { LocaleCode, LocaleStrings } from './types';
import { nb } from './locales/nb';

// Registry of available locales. Add new locales here as they are created.
const LOCALES: Record<LocaleCode, LocaleStrings> = { nb };

const DEFAULT_LOCALE: LocaleCode = 'nb';

interface I18nContextValue {
  locale: LocaleCode;
  strings: LocaleStrings;
  /** Present so a language switcher can be wired up later without refactoring. */
  setLocale: (locale: LocaleCode) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<LocaleCode>(DEFAULT_LOCALE);
  const value = useMemo<I18nContextValue>(
    () => ({ locale, strings: LOCALES[locale], setLocale }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The only supported way to read UI text. */
export function useStrings(): LocaleStrings {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useStrings must be used within an I18nProvider');
  return ctx.strings;
}

export function useLocale(): Pick<I18nContextValue, 'locale' | 'setLocale'> {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLocale must be used within an I18nProvider');
  return { locale: ctx.locale, setLocale: ctx.setLocale };
}
