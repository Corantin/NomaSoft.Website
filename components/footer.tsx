import Image from 'next/image';
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
    <footer className="border-t border-zinc-900 bg-zinc-950 px-4 py-12 text-sm text-zinc-400 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/images/NomaSoftLogo.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 opacity-70"
          />
          <span className="text-xs text-zinc-500">{t('footer.rights', { year })}</span>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-zinc-500">
          <a href={`mailto:${site.site.contact.email}`} className="hover:text-white">
            {site.site.contact.email}
          </a>
          <a
            href={site.site.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            GitHub
          </a>
          <Link href={`/${locale}/legal/privacy`} className="hover:text-white">
            {t('nav.privacy')}
          </Link>
          <Link href={`/${locale}/legal/terms`} className="hover:text-white">
            {t('nav.terms')}
          </Link>
          <LangSwitcher label={t('language.label')} />
        </div>
      </div>
    </footer>
  );
}
