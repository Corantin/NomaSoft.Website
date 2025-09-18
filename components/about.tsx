import Image from 'next/image';
import siteContent from '@/content/site.json';
import {useTranslations} from 'next-intl';

const stack = [
  {name: 'Next.js', src: '/images/stack/nextjs.svg'},
  {name: 'TypeScript', src: '/images/stack/typescript.svg'},
  {name: 'Tailwind CSS', src: '/images/stack/tailwindcss.svg'},
  {name: 'Solidity', src: '/images/stack/solidity.svg'},
  {name: 'PostgreSQL', src: '/images/stack/postgresql.svg'}
];

export function About() {
  const t = useTranslations('about');

  return (
    <section id="about" aria-labelledby="about-heading" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-light">
          {t('stack')}
        </span>
        <h2 id="about-heading" className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          {siteContent.site.name}
        </h2>
        <p className="mt-4 text-lg text-zinc-300">{t('lead')}</p>
        <p className="mt-4 text-sm text-zinc-400">{t('body')}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-5">
          {stack.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
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
