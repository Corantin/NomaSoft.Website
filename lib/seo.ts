import type { Metadata, ResolvingMetadata } from 'next';
import siteContent from '@/content/site.json';
import { Locale, locales } from './i18n';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://novasoft.dev';
const siteName = siteContent.site.name;
const defaultDescription = {
  en: siteContent.hero.subhead.en,
  fr: siteContent.hero.subhead.fr,
} satisfies Record<Locale, string>;

const localeToOg = {
  en: 'en_US',
  fr: 'fr_FR',
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
  path = '',
}: BuildMetadataParams): Metadata {
  const canonical = new URL(path.replace(/^\/+/g, ''), siteUrl).toString();
  const descriptionText = description || defaultDescription[locale];

  const alternates: Metadata['alternates'] = {
    canonical,
    languages: Object.fromEntries(
      locales.map((language) => [
        language,
        new URL(`/${language}${path}`, siteUrl).toString(),
      ]),
    ),
  };

  return {
    title,
    description: descriptionText,
    alternates,
    openGraph: {
      url: canonical,
      siteName: siteName || undefined,
      title: title || undefined,
      description: descriptionText || undefined,
      locale: localeToOg[locale] || undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title || undefined,
      description: descriptionText || undefined,
    },
  } satisfies Metadata;
}

export async function resolveChildMetadata(
  parent: ResolvingMetadata,
  overrides: Metadata,
): Promise<Metadata> {
  const resolved = await parent;

  // Remove fields we handle manually
  const {
    robots: resolvedRobots,
    alternates: resolvedAlternates,
    ...restResolved
  } = resolved as Metadata;
  const {
    robots: overrideRobots,
    alternates: overrideAlternates,
    ...restOverrides
  } = overrides as Metadata;

  const result: Partial<Metadata> = {
    ...restResolved,
    ...restOverrides,
  };

  // Robots
  if (overrideRobots !== undefined) {
    result.robots = overrideRobots;
  } else if (resolvedRobots !== undefined) {
    result.robots = resolvedRobots as Metadata['robots'];
  }

  // Alternates
  if (overrideAlternates !== undefined) {
    result.alternates = overrideAlternates;
  } else if (resolvedAlternates !== undefined) {
    result.alternates = resolvedAlternates as Metadata['alternates'];
  }

  // OpenGraph: merge and drop null url
  const ogResolved = (resolved.openGraph ?? undefined) as
    | Metadata['openGraph']
    | undefined;
  const ogOverrides = (overrides.openGraph ?? undefined) as
    | Metadata['openGraph']
    | undefined;

  if (ogResolved || ogOverrides) {
    const merged = { ...(ogResolved as object), ...(ogOverrides as object) } as Record<
      string,
      unknown
    >;
    const { url, ...restOg } = merged as { url?: string | URL | null };
    result.openGraph = {
      ...restOg,
      ...(url != null ? { url: url as string | URL } : {}),
    } as Metadata['openGraph'];
  }

  // Twitter: simple merge
  const twResolved = (resolved.twitter ?? undefined) as Metadata['twitter'] | undefined;
  const twOverrides = (overrides.twitter ?? undefined) as Metadata['twitter'] | undefined;

  if (twResolved || twOverrides) {
    result.twitter = {
      ...(twResolved as object),
      ...(twOverrides as object),
    } as Metadata['twitter'];
  }

  return result as Metadata;
}
