import createMiddleware from 'next-intl/middleware';
import {defaultLocale, languageCookieName, localePrefix, locales} from '@/lib/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  localeDetection: true,
  cookies: {
    name: languageCookieName
  }
});

export const config = {
  matcher: ['/', '/(en|fr)/:path*']
};
