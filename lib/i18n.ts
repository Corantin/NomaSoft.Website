import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import siteContent from '@/content/site.json';

export const languageCookieName = 'NEXT_LOCALE';
export const locales = siteContent.site.locales;
export type Locale = 'en' | 'fr';
export const defaultLocale = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en') as Locale;
export const localePrefix = 'always';

export const routing = {
  locales,
  defaultLocale,
  localePrefix,
};

export function isLocale(locale: string | undefined): locale is Locale {
  return Boolean(locale && locales.includes(locale));
}

export function getAlternateLocale(locale: Locale): Locale {
  return (locales.find((item) => item !== locale) as Locale) || defaultLocale;
}

export default getRequestConfig(async ({ locale }) => {
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = (await import(`@/public/locales/${locale}/common.json`)).default;

  return {
    locale,
    messages,
  };
});
