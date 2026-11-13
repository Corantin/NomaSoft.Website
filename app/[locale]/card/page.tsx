import type { Metadata } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CardExperience } from '@/components/card-experience';
import { companyCard } from '@/lib/card';
import { isLocale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';
import { getWalletAvailability } from '@/lib/wallet/config';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'card' });
  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: `/${locale}/card`,
  });
}

export default async function CardPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  if (!isLocale(locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'card' });

  return <CardExperience profile={companyCard} wallet={getWalletAvailability()} labels={{
    eyebrow: t('eyebrow'), title: t('title'), intro: t('intro'),
    flip: t('flip'), flipBack: t('flipBack'),
    call: t('call'), email: t('email'), website: t('website'),
    linkedin: t('linkedin'), save: t('save'), share: t('share'),
    copied: t('copied'), shareError: t('shareError'),
    qrTitle: t('qrTitle'), qrDescription: t('qrDescription'),
    permanent: t('permanent'),
    appleWallet: t('appleWallet'), googleWallet: t('googleWallet'),
  }} />;
}
