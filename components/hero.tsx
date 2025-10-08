import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import siteContent from '@/content/site.json';
import type { SiteContent } from '@/types/site-content';

const typedSiteContent = siteContent as SiteContent;
import { Locale } from '@/lib/i18n';

interface HeroProps {
  locale: Locale;
}

export function Hero({ locale }: HeroProps) {
  const hero = typedSiteContent.hero;

  return (
    <section
      className="relative overflow-hidden pb-24 pt-20"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-x-0 top-0 -z-10 h-[480px] bg-gradient-to-b from-brand/20 via-brand/5 to-transparent blur-3xl" />
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-stretch lg:gap-12 lg:px-8">
        <div className="relative hidden flex-shrink-0 self-stretch overflow-hidden lg:block lg:w-[500px] lg:h-[475px] lg:-mt-[4.5rem]">
          <Image
            src="/images/NomaSoft.png"
            alt="NomaSoft logo"
            fill
            priority
            sizes="(min-width: 1024px) 500px"
            className="object-contain"
          />
        </div>
        <div className="flex flex-1 flex-col gap-8">
          <span className="flex items-center gap-2 text-sm font-medium text-brand-light">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {siteContent.site.tagline}
          </span>
          <div className="space-y-6">
            <h1
              id="hero-heading"
              className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
            >
              {hero.headline[locale]}
            </h1>
            <p className="max-w-2xl text-lg text-zinc-300 sm:text-xl">
              {hero.subhead[locale]}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href={siteContent.site.contact.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {hero.primaryCta[locale]}
            </a>
            <Link
              href="#portfolio"
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {hero.secondaryCta[locale]}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
