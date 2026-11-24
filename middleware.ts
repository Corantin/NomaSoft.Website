import createMiddleware from 'next-intl/middleware';
import { defaultLocale, languageCookieName, localePrefix, locales } from '@/lib/i18n';

import { authorized } from '@/lib/crm/auth';
import { NextRequest, NextResponse } from 'next/server';

const localize = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  localeDetection: true,
  localeCookie: {
    name: languageCookieName,
  },
});

export default function middleware(req: NextRequest) {
  if (/^\/(api\/)?crm(?:\/|$)/.test(req.nextUrl.pathname)) {
    if (!authorized(req.headers.get('authorization'))) {
      return new NextResponse('Sign in to the NomaSoft workspace.', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="NomaSoft CRM", charset="UTF-8"',
          'Cache-Control': 'private, no-store',
        },
      });
    }
    return NextResponse.next();
  }
  return localize(req);
}

export const config = {
  matcher: ['/crm/:path*', '/api/crm/:path*', '/', '/contact', '/(en|fr)/:path*'],
};
