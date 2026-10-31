import type { Metadata } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PortfolioGrid } from '@/components/portfolio';
import siteContent from '@/content/site.json';
import { isLocale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'meta' });
  return buildMetadata({
    locale,
    title: t('portfolioTitle'),
    description: t('portfolioDescription'),
    path: `/${locale}/portfolio`,
  });
}

export default async function PortfolioPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  if (!isLocale(locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <>
      <section
        className="relative overflow-hidden border-b border-zinc-900 pb-16 pt-24 sm:pb-24 lg:pt-32"
        aria-labelledby="portfolio-page-heading"
      >
        <div className="pointer-events-none absolute -right-48 top-0 -z-10 h-[520px] w-[720px] rounded-full bg-brand/10 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
            {siteContent.site.name} / {t('nav.portfolio')}
          </p>
          <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
            <h1
              id="portfolio-page-heading"
              className="text-5xl font-bold leading-[1.02] tracking-tighter text-white sm:text-7xl lg:text-[6rem]"
            >
              {t('sections.portfolio')}
              <span className="text-brand-light">.</span>
            </h1>
            <p className="max-w-sm text-lg leading-relaxed text-zinc-400">
              {t('portfolio.intro')}
            </p>
          </div>
          <div className="mt-16 flex items-center justify-between border-t border-zinc-800 pt-5 font-mono text-xs uppercase tracking-widest text-zinc-500">
            <span>{t('portfolio.count', { count: siteContent.portfolio.length })}</span>
            <span>{t('portfolio.explore')} ↓</span>
          </div>
        </div>
      </section>

      <section
        id="work"
        className="py-20 sm:py-28"
        aria-labelledby="all-projects-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
                01 / {t('nav.portfolio')}
              </p>
              <h2
                id="all-projects-heading"
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                {t('portfolio.all')}
              </h2>
            </div>
            <p className="hidden max-w-xs text-right text-sm text-zinc-500 sm:block">
              {t('portfolio.summary')}
            </p>
          </div>
          <PortfolioGrid locale={locale} full />
        </div>
      </section>

      <section
        className="border-t border-zinc-900 bg-zinc-900/40 py-20 sm:py-28"
        aria-labelledby="portfolio-contact-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
              02 / {t('portfolio.nextLabel')}
            </p>
            <h2
              id="portfolio-contact-heading"
              className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
              {t('portfolio.nextTitle')}
            </h2>
            <p className="mt-5 text-lg text-zinc-400">{t('portfolio.nextBody')}</p>
          </div>
          <a
            href={siteContent.site.contact.calendly}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center justify-center rounded-full bg-brand px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {siteContent.hero.primaryCta[locale]}{' '}
            <span aria-hidden="true" className="ml-4">
              ↗
            </span>
          </a>
        </div>
      </section>
    </>
  );
}
