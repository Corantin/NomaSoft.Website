import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type siteContent from '@/content/site.json';
import { Locale } from '@/lib/i18n';
import { LangSwitcher } from './lang-switcher';

interface FooterProps {
  locale: Locale;
  site: typeof siteContent;
}

export default function Footer({ locale, site }: FooterProps) {
  const t = useTranslations();
  const year = new Date().getFullYear().toString();

  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 px-4 py-16 text-sm text-zinc-400 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-12 border-b border-zinc-900 pb-16 lg:flex-row lg:items-start lg:justify-between lg:pb-24">
          <div>
            <Link
              href={`/${locale}`}
              className="text-4xl font-extrabold uppercase tracking-tight text-white sm:text-6xl"
            >
              {site.site.name}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              {t('footer.tagline')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-3">
            <div className="flex flex-col gap-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                {t('footer.connect')}
              </span>
              <a
                href={site.site.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                GitHub
              </a>
              <a href={`mailto:${site.site.contact.email}`} className="hover:text-white">
                {t('footer.email')}
              </a>
            </div>
            <div className="flex flex-col gap-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                {t('footer.explore')}
              </span>
              <a href={`/${locale}#services`} className="hover:text-white">
                {t('nav.services')}
              </a>
              <Link href={`/${locale}/portfolio`} className="hover:text-white">
                {t('nav.portfolio')}
              </Link>
            </div>
            <div className="flex flex-col gap-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                {t('footer.legal')}
              </span>
              <Link href={`/${locale}/legal/privacy`} className="hover:text-white">
                {t('nav.privacy')}
              </Link>
              <Link href={`/${locale}/legal/terms`} className="hover:text-white">
                {t('nav.terms')}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5 pt-10 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="text-zinc-600">{t('footer.rights', { year })}</span>
          <LangSwitcher label={t('language.label')} variant="footer" />
        </div>
      </div>
    </footer>
  );
}
