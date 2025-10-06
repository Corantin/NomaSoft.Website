import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type siteContent from '@/content/site.json';
import { Locale } from '@/lib/i18n';
import { LangSwitcher } from './lang-switcher';

const navItems = [
  { href: '#services', key: 'services' },
  { href: '#process', key: 'process' },
  { href: '#portfolio', key: 'portfolio' },
  { href: '#about', key: 'about' },
];

type Props = {
  locale: Locale;
  site: typeof siteContent;
};

export default function Navbar({ locale, site }: Props) {
  const t = useTranslations('nav');
  const languageLabel = useTranslations('language')('label');

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-brand">
            NS
          </span>
          <span className="hidden text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400 sm:inline">
            {site.site.tagline}
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-300 md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={`/${locale}${item.href}`}
              className="transition hover:text-zinc-50"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitcher label={languageLabel} />
          <Link
            href={`/${locale}/contact`}
            className="rounded-full border border-brand/40 bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t('contact')}
          </Link>
        </div>
      </div>
    </header>
  );
}
