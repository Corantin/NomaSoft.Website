import type {Metadata, ResolvingMetadata} from 'next';
import siteContent from '@/content/site.json';
import {Locale, locales} from './i18n';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://novasoft.dev';
const siteName = siteContent.site.name;
const defaultDescription = {
  en: siteContent.hero.subhead.en,
  fr: siteContent.hero.subhead.fr
};

const localeToOg = {
  en: 'en_US',
  fr: 'fr_FR'
} satisfies Record<Locale, string>;

type BuildMetadataParams = {
  locale: Locale;
  title: string;
  description?: string;
  path?: string;
};

export function buildMetadata({
  locale,
  title,
  description,
  path = ''
}: BuildMetadataParams): Metadata {
  const canonical = new URL(path.replace(/^\/+/, ''), siteUrl).toString();
  const descriptionText = description || defaultDescription[locale];

  const alternates: Metadata['alternates'] = {
    canonical,
    languages: Object.fromEntries(
      locales.map((language) => [language, new URL(`/${language}${path}`, siteUrl).toString()])
    )
  };

  return {
    title,
    description: descriptionText,
    alternates,
    openGraph: {
      url: canonical,
      siteName,
      title,
      description: descriptionText,
      locale: localeToOg[locale],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: descriptionText
    }
  } satisfies Metadata;
}

export async function resolveChildMetadata(
  parent: ResolvingMetadata,
  overrides: Metadata
): Promise<Metadata> {
  const resolved = await parent;
  return {
    ...resolved,
    ...overrides,
    openGraph: {
      ...resolved.openGraph,
      ...overrides.openGraph
    },
    twitter: {
      ...resolved.twitter,
      ...overrides.twitter
    }
  };
}
