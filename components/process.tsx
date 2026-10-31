import { useTranslations } from 'next-intl';
import siteContent from '@/content/site.json';
import { Locale } from '@/lib/i18n';
import { ProcessTimeline } from './process-timeline';

export function Process({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const stageKeys = ['discover', 'design', 'build', 'launch'] as const;

  const steps = siteContent.process.map((step, index) => ({
    title: step.title[locale],
    description: step.desc[locale],
    aside: t(`process.stages.${stageKeys[index]}.aside`),
    artifact: t(`process.stages.${stageKeys[index]}.artifact`),
  }));

  return (
    <section id="process" aria-labelledby="process-heading" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)] md:items-end md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
              {t('sections.process')}
            </p>
            <h2
              id="process-heading"
              className="mt-5 max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl"
            >
              {t('process.heading')}
            </h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-zinc-400 md:pb-1">
            {t('process.body')}
          </p>
        </div>

        <ProcessTimeline
          steps={steps}
          copy={{
            instruction: t('process.instruction'),
            sliderLabel: t('process.sliderLabel'),
            progressLabel: t('process.progressLabel'),
            previewLabel: t('process.previewLabel'),
            previewTitle: t('process.previewTitle'),
            launchTitle: t('process.launchTitle'),
            previewButton: t('process.previewButton'),
            live: t('process.live'),
          }}
        />
      </div>
    </section>
  );
}
