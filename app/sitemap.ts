import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nomasoft.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/contact', '/legal/privacy', '/legal/terms'];
  const lastModified = new Date();

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified,
    })),
  );
}
