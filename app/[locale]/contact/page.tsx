import type { Metadata } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ContactSection } from '@/components/contact-section';
import { getCaptchaClientConfig } from '@/lib/captcha';
import { getContactJsonLd } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';
import { Locale, isLocale } from '@/lib/i18n';
import siteContent from '@/content/site.json';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;

  if (!isLocale(locale)) {
    notFound();
  }

  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    title: meta('contactTitle'),
    description: meta('homeDescription'),
    path: `/${locale}/contact`,
  });
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { service?: string };
}) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  unstable_setRequestLocale(locale);

  const defaultService = siteContent.services.find(
    (service) => service.key === searchParams?.service,
  )?.key;

  const captcha = getCaptchaClientConfig();

  return (
    <>
      <ContactSection
        locale={locale as Locale}
        defaultService={defaultService}
        captcha={captcha}
        headingLevel="h1"
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: getContactJsonLd(locale as Locale) }}
      />
    </>
  );
}
