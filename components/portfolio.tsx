import Image from 'next/image';
import siteContent from '@/content/site.json';
import type { SiteContent } from '@/types/site-content';

const typedSiteContent = siteContent as SiteContent;
import { Locale } from '@/lib/i18n';
import { useTranslations } from 'next-intl';
import { OutboundLink } from './outbound-link';

const imageMap: Record<string, { src: string; alt: string }> = {
  Gardens: {
    src: '/images/portfolio/gardens.png',
    alt: 'Gardens dashboard illustration',
  },
  Deed3: {
    src: '/images/portfolio/deed3.png',
    alt: 'Deed3 interface mockup',
  },
  '1Hive Quests': {
    src: '/images/portfolio/quests.png',
    alt: '1Hive Quests overview',
  },
  'Oneway Catering': {
    src: '/images/portfolio/oneway-catering.png',
    alt: 'Oneway Catering website screenshot',
  },
};

interface PortfolioProps {
  locale: Locale;
}

export function Portfolio({ locale }: PortfolioProps) {
  const t = useTranslations();

  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-light">
            {t('sections.portfolio')}
          </span>
          <h2
            id="portfolio-heading"
            className="text-3xl font-semibold text-white sm:text-4xl"
          >
            {typedSiteContent.hero.secondaryCta[locale]}
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {typedSiteContent.portfolio.map((item) => {
            const image = imageMap[item.title];
            return (
              <article
                key={item.title}
                className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-900/40 shadow-lg shadow-black/30"
              >
                {image ? (
                  <div className="relative h-40 w-full overflow-hidden bg-zinc-900">
                    <a
                      href={item.site ?? item.doc}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-top brightness-50"
                        priority={false}
                      />
                    </a>
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <header className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-zinc-300">{item.desc[locale]}</p>
                  </header>
                  <ul className="flex flex-wrap gap-2 text-xs text-brand-light">
                    {item.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-brand/30 px-3 py-1"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                  <OutboundLink
                    href={item.doc ?? (item.github as any)}
                    className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {item.doc ? t('portfolio.open') : t('portfolio.github')}
                    <span aria-hidden="true">→</span>
                  </OutboundLink>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
