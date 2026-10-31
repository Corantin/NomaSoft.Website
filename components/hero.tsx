import Image from 'next/image';
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
      className="relative isolate overflow-hidden pb-24 pt-20 sm:pt-28 lg:pb-36 lg:pt-32"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute -right-32 top-8 -z-10 h-[38rem] w-[42rem] rounded-full bg-brand/15 blur-[120px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14 lg:px-8">
        <div className="relative z-10 max-w-2xl">
          <p className="inline-flex items-center gap-3 text-sm font-semibold text-brand-light">
            <span className="h-2 w-2 rounded-full bg-brand-light" aria-hidden="true" />
            {hero.eyebrow[locale]}
          </p>
          <h1
            id="hero-heading"
            className="mt-7 text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.75rem] xl:text-[5.25rem]"
          >
            {hero.headline[locale]}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
            {hero.subhead[locale]}
          </p>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
            <a
              href={siteContent.site.contact.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-bold text-zinc-950 transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
            >
              {hero.primaryCta[locale]}
            </a>
            <Link
              href={`/${locale}/portfolio` as Route}
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-zinc-400 hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {hero.secondaryCta[locale]}
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div className="pointer-events-none absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-brand/25 via-brand/5 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-2xl shadow-black/50 sm:rounded-3xl">
            <Image
              src="/images/portfolio/ev-trustseal.png"
              alt="EV TrustSeal website and battery certificate preview"
              width={1200}
              height={630}
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="block h-auto w-full"
              priority
            />
          </div>
          <div className="absolute -bottom-14 -left-9 hidden w-[56%] overflow-hidden rounded-2xl border border-white/20 bg-zinc-900 shadow-2xl shadow-black/70 md:block lg:-left-14">
            <Image
              src="/images/portfolio/gardens.png"
              alt="Gardens community governance website preview"
              width={1414}
              height={821}
              sizes="(min-width: 1024px) 30vw, 50vw"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
