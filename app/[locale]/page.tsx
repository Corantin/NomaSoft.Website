import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { About } from '@/components/about';
import { ContactSection } from '@/components/contact-section';
import { Hero } from '@/components/hero';
import { Portfolio } from '@/components/portfolio';
import { Process } from '@/components/process';
import { Services } from '@/components/services';
import { getCaptchaClientConfig } from '@/lib/captcha';
import { getHomeJsonLd } from '@/lib/schema';
import { Locale, isLocale } from '@/lib/i18n';

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  unstable_setRequestLocale(locale);

  const captcha = getCaptchaClientConfig();

  return (
    <>
      <Hero locale={locale as Locale} />
      <Services locale={locale as Locale} />
      <Process locale={locale as Locale} />
      <Portfolio locale={locale as Locale} />
      <About />
      <ContactSection locale={locale as Locale} captcha={captcha} />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: getHomeJsonLd(locale as Locale) }}
      />
    </>
  );
}
