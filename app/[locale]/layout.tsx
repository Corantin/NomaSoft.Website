import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import {notFound} from 'next/navigation';
import type {ReactNode} from 'react';
import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import {PlausibleAnalytics} from '@/components/plausible-analytics';
import {LocaleLang} from '@/components/locale-lang';
import siteContent from '@/content/site.json';
import {buildMetadata} from '@/lib/seo';
import {Locale, isLocale, locales} from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params
}: {
  params: {locale: string};
}): Promise<Metadata> {
  const {locale} = params;
  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: 'meta'});

  return buildMetadata({
    locale,
    title: t('homeTitle'),
    description: t('homeDescription'),
    path: `/${locale}`
  });
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: {locale: string};
}) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages({locale});
  const navMessages = await getTranslations({locale, namespace: 'nav'});

  const skipToContent = navMessages('skip');

  return (
    <NextIntlClientProvider locale={locale as Locale} messages={messages} timeZone="UTC">
      <LocaleLang locale={locale} />
      <PlausibleAnalytics />
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-zinc-50 focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-zinc-900"
        >
          {skipToContent}
        </a>
        <Navbar locale={locale as Locale} site={siteContent} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer locale={locale as Locale} site={siteContent} />
      </div>
    </NextIntlClientProvider>
  );
}
