import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import siteContent from '@/content/site.json';
import type { SiteContent } from '@/types/site-content';
import { Locale } from '@/lib/i18n';
import { OutboundLink } from './outbound-link';

type Project = SiteContent['portfolio'][number];
const projects = (siteContent as SiteContent).portfolio;

const imageMap: Record<string, { src: string; alt: string; aspectRatio: number }> = {
  'EV TrustSeal': {
    src: '/images/portfolio/ev-trustseal.png',
    alt: 'EV TrustSeal battery health certificate preview',
    aspectRatio: 1200 / 630,
  },
  Gardens: {
    src: '/images/portfolio/gardens.png',
    alt: 'Gardens dashboard',
    aspectRatio: 1414 / 821,
  },
  '1Hive Quests': {
    src: '/images/portfolio/quests.png',
    alt: '1Hive Quests overview',
    aspectRatio: 1519 / 1019,
  },
  'Oneway Catering': {
    src: '/images/portfolio/oneway-catering.png',
    alt: 'Oneway Catering website',
    aspectRatio: 1525 / 1016,
  },
  Deed3: {
    src: '/images/portfolio/deed3.png',
    alt: 'Deed3 tokenized real estate platform interface',
    aspectRatio: 1524 / 1021,
  },
};

function ProjectCard({
  project,
  index,
  locale,
  full,
}: {
  project: Project;
  index: number;
  locale: Locale;
  full: boolean;
}) {
  const t = useTranslations('portfolio');
  const image = imageMap[project.title];
  const href = project.site ?? project.doc ?? project.github;
  const isUnlinked = !href;
  const wide = full && isUnlinked;
  const span = wide
    ? 'lg:col-span-12'
    : index % 4 === 0 || index % 4 === 3
      ? 'lg:col-span-7'
      : 'lg:col-span-5';
  const imageClass =
    'object-cover object-top transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.02] motion-reduce:group-hover:scale-100';

  return (
    <article data-project={project.title} className={`group ${span}`}>
      <div
        className={
          wide
            ? 'overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]'
            : ''
        }
      >
        {image ? (
          href ? (
            <OutboundLink
              href={href as Route}
              aria-label={t('visitProject', { name: project.title })}
              style={{ aspectRatio: image.aspectRatio }}
              className="relative block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className={imageClass}
                priority={index === 0}
              />
            </OutboundLink>
          ) : (
            <div
              style={{ aspectRatio: image.aspectRatio }}
              className="relative overflow-hidden bg-zinc-900"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover object-top"
              />
            </div>
          )
        ) : null}
        <div className={wide ? 'flex flex-col justify-between p-8 sm:p-10' : 'mt-6'}>
          <p className="font-mono text-xs uppercase tracking-wide text-brand-light">
            {String(index + 1).padStart(2, '0')} / {project.tags[0]}
          </p>
          <div className={wide ? 'mt-10' : 'mt-2'}>
            <h3 className={`font-semibold text-white ${wide ? 'text-3xl' : 'text-2xl'}`}>
              {href ? (
                <OutboundLink
                  href={href as Route}
                  className="inline-flex items-center rounded-sm hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {project.title}
                </OutboundLink>
              ) : (
                project.title
              )}
            </h3>
            <p
              className={`mt-2 leading-relaxed text-zinc-400 ${wide ? 'max-w-sm text-lg' : 'max-w-xl text-sm sm:text-base'}`}
            >
              {project.desc[locale]}
            </p>
          </div>
          {wide ? <div className="mt-10 h-px w-full bg-zinc-800" /> : null}
        </div>
      </div>
    </article>
  );
}

export function PortfolioGrid({
  locale,
  full = false,
}: {
  locale: Locale;
  full?: boolean;
}) {
  const visibleProjects = full ? projects : projects.slice(0, 4);

  return (
    <div className="grid gap-x-10 gap-y-16 lg:grid-cols-12">
      {visibleProjects.map((project, index) => (
        <ProjectCard
          key={project.title}
          project={project}
          index={index}
          locale={locale}
          full={full}
        />
      ))}
    </div>
  );
}

export function Portfolio({ locale }: { locale: Locale }) {
  const t = useTranslations();

  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="border-t border-zinc-900 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
              {t('sections.portfolio')}
            </p>
            <h2
              id="portfolio-heading"
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              {t('portfolio.all')}
            </h2>
          </div>
          <Link
            href={`/${locale}/portfolio` as Route}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-sm font-semibold text-brand-light underline decoration-brand/50 underline-offset-8 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {t('portfolio.viewAll')}
          </Link>
        </div>
        <PortfolioGrid locale={locale} />
      </div>
    </section>
  );
}
