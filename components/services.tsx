import type { ComponentType, SVGProps } from 'react';
import { Bot, Boxes, Globe, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import siteContent from '@/content/site.json';
import type { SiteContent } from '@/types/site-content';

const typedSiteContent = siteContent as SiteContent;
import { Locale } from '@/lib/i18n';

const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  web3: Boxes,
  web: Globe,
  mobile: Smartphone,
  ai: Bot,
};

interface ServicesProps {
  locale: Locale;
}

export function Services({ locale }: ServicesProps) {
  const t = useTranslations();
  const services = typedSiteContent.services;
  const cta = t('sections.servicesCta');

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="border-t border-zinc-900 bg-zinc-900/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl space-y-3">
          <span
            id="services-heading"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light"
          >
            {t('sections.services')}
          </span>
        </div>
        <div className="grid overflow-hidden rounded-2xl border border-zinc-800 md:grid-cols-2">
          {services.map((service) => {
            const Icon = iconMap[service.key] ?? Globe;
            return (
              <article
                key={service.key}
                className="group flex h-full flex-col justify-between border-b border-zinc-800 bg-zinc-950/40 p-7 transition-colors last:border-b-0 hover:bg-zinc-900/70 md:border-r md:p-9 md:[&:nth-child(2n)]:border-r-0 md:[&:nth-last-child(-n+2)]:border-b-0"
              >
                <div className="space-y-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand-light">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-white">
                      {service.title[locale]}
                    </h3>
                    <p className="text-sm text-zinc-300">{service.summary[locale]}</p>
                  </div>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    {service.bullets[locale].map((bullet: string) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span
                          className="mt-1 h-1.5 w-1.5 rounded-full bg-brand"
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={`/${locale}/contact?service=${service.key}`}
                  className="mt-8 inline-flex w-fit items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {cta}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
