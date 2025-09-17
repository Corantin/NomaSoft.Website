import type {ComponentType, SVGProps} from 'react';
import {Bot, Boxes, Globe, Smartphone} from 'lucide-react';
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import siteContent from '@/content/site.json';
import {Locale} from '@/lib/i18n';

const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  web3: Boxes,
  web: Globe,
  mobile: Smartphone,
  ai: Bot
};

interface ServicesProps {
  locale: Locale;
}

export function Services({locale}: ServicesProps) {
  const t = useTranslations();
  const services = siteContent.services;
  const cta = t('sections.servicesCta');

  return (
    <section id="services" aria-labelledby="services-heading" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl space-y-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-light">
            {t('sections.services')}
          </span>
          <h2 id="services-heading" className="text-3xl font-semibold text-white sm:text-4xl">
            {siteContent.hero.headline[locale]}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => {
            const Icon = iconMap[service.key] ?? Globe;
            return (
              <article
                key={service.key}
                className="group flex h-full flex-col justify-between rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-brand/60 hover:bg-zinc-900/70"
              >
                <div className="space-y-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">
                      {service.title[locale]}
                    </h3>
                    <p className="text-sm text-zinc-300">{service.summary[locale]}</p>
                  </div>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    {service.bullets[locale].map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={`/${locale}/contact?service=${service.key}`}
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-brand/50 px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
