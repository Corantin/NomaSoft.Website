import type { Metadata } from 'next';
import { allLegalDocs } from '.contentlayer/generated';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MdxContent } from '@/components/mdx-content';
import { getLegalJsonLd } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';
import { Locale, isLocale } from '@/lib/i18n';

function getDoc(locale: string) {
  return allLegalDocs.find((doc) => doc.locale === locale && doc.slug === 'privacy');
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;

  if (!isLocale(locale)) {
    notFound();
  }

  const doc = getDoc(locale);
  if (!doc) {
    notFound();
  }

  const meta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    title: meta('privacyTitle'),
    description: doc.description ?? meta('homeDescription'),
    path: `/${locale}/legal/privacy`,
  });
}

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  unstable_setRequestLocale(locale);

  const doc = getDoc(locale);
  if (!doc) {
    notFound();
  }

  return (
    <section className="bg-zinc-950 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <article className="prose prose-invert max-w-none">
          <MdxContent code={doc.body.code} />
        </article>
      </div>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: getLegalJsonLd(locale as Locale, '/legal/privacy', doc.title),
        }}
      />
    </section>
  );
}
