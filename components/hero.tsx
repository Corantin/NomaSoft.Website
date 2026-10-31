import Link from 'next/link';
import type { Route } from 'next';
import siteContent from '@/content/site.json';
import { Locale } from '@/lib/i18n';

interface HeroProps {
  locale: Locale;
}

export function Hero({ locale }: HeroProps) {
  const hero = siteContent.hero;

  return (
    <section
      className="relative overflow-hidden pb-20 pt-20 sm:pt-24 lg:pb-28 lg:pt-32"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute -right-48 top-0 -z-10 h-[600px] w-[800px] rounded-full bg-brand/10 blur-[120px]" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
        <aside className="hidden border-r border-zinc-800 pr-8 text-xs text-zinc-500 lg:col-span-2 lg:block">
          <div className="space-y-5">
            <p className="font-mono uppercase tracking-widest">
              <span className="text-brand">{'//'}</span> NOMASOFT
            </p>
            <ol className="space-y-3 font-medium">
              <li>01. Web</li>
              <li>02. Mobile</li>
              <li>03. Web3</li>
              <li>04. AI</li>
            </ol>
          </div>
        </aside>
        <div className="lg:col-span-10 lg:pl-12">
          <p className="mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
            {siteContent.site.tagline}
          </p>
          <h1
            id="hero-heading"
            className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tighter text-white sm:text-6xl lg:text-[5.5rem]"
          >
            {hero.headline[locale]}
            <span className="text-brand-light">.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-zinc-400 sm:text-2xl">
            {hero.subhead[locale]}
          </p>
          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row">
            <a
              href={siteContent.site.contact.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-bold text-zinc-950 transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
            >
              {hero.primaryCta[locale]}
            </a>
            <Link
              href={`/${locale}/portfolio` as Route}
              className="inline-flex items-center justify-center rounded-full border border-zinc-800 px-8 py-4 text-sm font-semibold text-white transition-colors hover:border-zinc-500 hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {hero.secondaryCta[locale]}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
