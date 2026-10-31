import { useTranslations } from 'next-intl';

const benefitKeys = ['direction', 'presence', 'collaboration'] as const;

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
          {t('eyebrow')}
        </span>
        <h2
          id="about-heading"
          className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {t('title')}
        </h2>
        <p className="mt-6 max-w-3xl text-xl leading-relaxed text-zinc-300">{t('lead')}</p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">{t('body')}</p>
        <div className="mt-12 grid gap-8 border-t border-zinc-800 pt-9 md:grid-cols-3 md:gap-0">
          {benefitKeys.map((key, index) => (
            <div
              key={key}
              className={index === 0 ? 'md:pr-8' : 'md:border-l md:border-zinc-800 md:px-8'}
            >
              <span className="mb-6 block h-1 w-10 rounded-full bg-brand" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-white">{t(`benefits.${key}.title`)}</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
                {t(`benefits.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
