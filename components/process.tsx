import Link from 'next/link';
import siteContent from '@/content/site.json';
import type { SiteContent } from '@/types/site-content';

const typedSiteContent = siteContent as SiteContent;
import { Locale } from '@/lib/i18n';
import { useTranslations } from 'next-intl';

interface ProcessProps {
  locale: Locale;
}

export function Process({ locale }: ProcessProps) {
  const t = useTranslations();

  return (
    <section id="process" aria-labelledby="process-heading" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-light">
              {t('sections.process')}
            </span>
            <h2
              id="process-heading"
              className="text-3xl font-semibold text-white sm:text-4xl"
            >
              {typedSiteContent.hero.subhead[locale]}
            </h2>
          </div>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center justify-center rounded-full border border-brand/60 px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t('process.cta')}
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {typedSiteContent.process.map((step, index) => (
            <article
              key={step.title.en}
              className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-inner shadow-black/40"
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-brand-light">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {step.title[locale]}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{step.desc[locale]}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
