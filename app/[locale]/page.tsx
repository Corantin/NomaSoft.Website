import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { About } from '@/components/about';
import { ContactForm } from '@/components/contact-form';
import { Hero } from '@/components/hero';
import { Portfolio } from '@/components/portfolio';
import { Process } from '@/components/process';
import { Services } from '@/components/services';
import { getCaptchaClientConfig } from '@/lib/captcha';
import { getHomeJsonLd } from '@/lib/schema';
import { Locale, isLocale } from '@/lib/i18n';
import siteContent from '@/content/site.json';

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  unstable_setRequestLocale(locale);

  const contactCopy = await getTranslations({ locale, namespace: 'contact' });

  const captcha = getCaptchaClientConfig();

  return (
    <>
      <Hero locale={locale as Locale} />
      <div
        className="border-y border-zinc-900 px-4 py-5 sm:px-6 lg:px-8"
        aria-label={locale === 'fr' ? 'Projets sélectionnés' : 'Selected projects'}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-widest text-zinc-500">
          {siteContent.portfolio.slice(0, 4).map((project) => (
            <span key={project.title}>{project.title}</span>
          ))}
        </div>
      </div>
      <Services locale={locale as Locale} />
      <Process locale={locale as Locale} />
      <Portfolio locale={locale as Locale} />
      <About />
      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="border-t border-zinc-900 bg-zinc-900/40 py-20 sm:py-28"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
            {contactCopy('subtitle')}
          </span>
          <h2
            id="contact-heading"
            className="text-3xl font-bold tracking-tight text-white sm:text-5xl"
          >
            {contactCopy('title')}
          </h2>
        </div>
        <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6 lg:px-8">
          <ContactForm locale={locale} captcha={captcha} />
        </div>
      </section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: getHomeJsonLd(locale as Locale) }}
      />
    </>
  );
}
