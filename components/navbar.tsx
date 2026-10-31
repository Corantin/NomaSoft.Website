import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type siteContent from '@/content/site.json';
import { Locale } from '@/lib/i18n';
import { LangSwitcher } from './lang-switcher';

type Props = {
  locale: Locale;
  site: typeof siteContent;
};

export default function Navbar({ locale, site }: Props) {
  const t = useTranslations('nav');
  const languageLabel = useTranslations('language')('label');
  const items = [
    { href: `/${locale}#services`, label: t('services') },
    { href: `/${locale}#process`, label: t('process') },
    { href: `/${locale}/portfolio`, label: t('portfolio') },
    { href: `/${locale}#about`, label: t('about') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-3 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <Image
            src="/images/NomaSoftLogo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            priority
          />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-300">
            {site.site.name}
          </span>
        </Link>
        <nav
          className="hidden items-center gap-9 text-sm font-medium text-zinc-400 md:flex"
          aria-label={t('mainLabel')}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              className="transition-colors hover:text-white focus-visible:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:block">
            <LangSwitcher label={languageLabel} />
          </div>
          <a
            href={site.site.contact.calendly}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-5"
          >
            {t('contact')}
          </a>
          <details className="group relative md:hidden">
            <summary
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-zinc-700 text-zinc-200 marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={t('menu')}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </summary>
            <nav
              className="absolute right-0 top-12 w-56 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl shadow-black/40"
              aria-label={t('mobileLabel')}
            >
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900 focus-visible:bg-zinc-900"
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-zinc-800 px-3 pt-3 sm:hidden">
                <LangSwitcher label={languageLabel} />
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
