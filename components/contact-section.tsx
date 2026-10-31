import { CalendarDays, Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import siteContent from '@/content/site.json';
import type { CaptchaClientConfig } from '@/lib/captcha';
import type { Locale } from '@/lib/i18n';
import { ContactForm } from './contact-form';

type ContactSectionProps = {
  locale: Locale;
  captcha: CaptchaClientConfig | null;
  defaultService?: string;
  headingLevel?: 'h1' | 'h2';
};

export async function ContactSection({
  locale,
  captcha,
  defaultService,
  headingLevel: Heading = 'h2',
}: ContactSectionProps) {
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative overflow-hidden border-t border-zinc-900 bg-zinc-950 py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-[120px]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-20 lg:px-8">
        <div className="lg:pt-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-light">
            {t('eyebrow')}
          </p>
          <Heading
            id="contact-heading"
            className="mt-6 max-w-xl text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {t('title')}
          </Heading>
          <p className="mt-9 max-w-lg text-lg leading-relaxed text-zinc-400 sm:text-xl">
            {t('lead')}
          </p>
          <div className="mt-12 space-y-6">
            <a
              href={siteContent.site.contact.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-fit items-center gap-4 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-light"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-950 transition-transform group-hover:scale-105 motion-reduce:transition-none">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">
                  {t('bookCall')}
                </span>
                <span className="mt-1 block text-sm text-zinc-500">
                  {t('bookCallDetail')}
                </span>
              </span>
            </a>
            <a
              href={`mailto:${siteContent.site.contact.email}`}
              className="group flex w-fit items-center gap-4 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-light"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform group-hover:scale-105 motion-reduce:transition-none">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">
                  {t('emailDirect')}
                </span>
                <span className="mt-1 block text-sm text-zinc-500">
                  {siteContent.site.contact.email}
                </span>
              </span>
            </a>
          </div>
        </div>
        <ContactForm locale={locale} defaultService={defaultService} captcha={captcha} />
      </div>
    </section>
  );
}
