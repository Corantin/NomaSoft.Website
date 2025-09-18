import Link from 'next/link';
import {useTranslations} from 'next-intl';
import type siteContent from '@/content/site.json';
import {Locale} from '@/lib/i18n';
import {LangSwitcher} from './lang-switcher';

interface FooterProps {
  locale: Locale;
  site: typeof siteContent;
}

export default function Footer({locale, site}: FooterProps) {
  const t = useTranslations();
  const languageLabel = t('language.label');
  const year = new Date().getFullYear().toString();

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950/90 py-8 text-sm text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-base font-semibold text-zinc-100">{site.site.name}</p>
          <p className="max-w-md text-xs text-zinc-400">
            {t('footer.rights', {year})}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <a href={`mailto:${site.site.contact.email}`} className="transition hover:text-zinc-50">
              {site.site.contact.email}
            </a>
            <a href={site.site.social.github} target="_blank" rel="noopener noreferrer" className="transition hover:text-zinc-50">
              GitHub
            </a>
          </div>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <LangSwitcher label={languageLabel} />
          <div className="flex gap-4 text-xs">
            <Link href={`/${locale}/legal/privacy`} className="transition hover:text-zinc-50">
              {t('nav.privacy')}
            </Link>
            <Link href={`/${locale}/legal/terms`} className="transition hover:text-zinc-50">
              {t('nav.terms')}
            </Link>
            <Link href={`/${locale}/contact`} className="transition hover:text-zinc-50">
              {t('nav.contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
