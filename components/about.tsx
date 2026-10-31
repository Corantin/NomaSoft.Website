import Image from 'next/image';
import siteContent from '@/content/site.json';
import { useTranslations } from 'next-intl';

const stack = [
  { name: 'Next.js', src: '/images/stack/nextjs.svg' },
  { name: 'TypeScript', src: '/images/stack/typescript.svg' },
  { name: 'Tailwind CSS', src: '/images/stack/tailwindcss.svg' },
  { name: 'Solidity', src: '/images/stack/solidity.svg' },
  { name: 'PostgreSQL', src: '/images/stack/postgresql.svg' },
];

export function About() {
  const t = useTranslations('about');

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="border-y border-zinc-900 bg-zinc-900/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
          {t('stack')}
        </span>
        <h2
          id="about-heading"
          className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {siteContent.site.name}
        </h2>
        <p className="mt-6 max-w-3xl text-xl text-zinc-300">{t('lead')}</p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">
          {t('body')}
        </p>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stack.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                width={120}
                height={40}
                className="h-8 w-auto"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
