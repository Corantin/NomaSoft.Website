import siteContent from '@/content/site.json';
import { Locale } from './i18n';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nomasoft.dev';
const organizationId = `${siteUrl}#organization`;
const websiteId = `${siteUrl}#website`;

type Breadcrumb = {
  name: string;
  href: string;
};

const localeToLanguage = {
  en: 'en-US',
  fr: 'fr-FR',
} satisfies Record<Locale, string>;

export function getOrganizationSchema(locale: Locale) {
  return {
    '@type': 'Organization',
    '@id': organizationId,
    name: siteContent.site.name,
    url: siteUrl,
    description:
      siteContent.hero.subhead[locale as keyof typeof siteContent.hero.subhead],
    sameAs: [siteContent.site.social.github],
  };
}

export function getServicesSchema(locale: Locale) {
  return siteContent.services.map((service) => ({
    '@type': 'Service',
    name: service.title[locale as keyof typeof service.title],
    description: service.summary[locale as keyof typeof service.summary],
    serviceType: service.title[locale as keyof typeof service.title],
    provider: {
      '@id': organizationId,
    },
    areaServed: 'Worldwide',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      url: `${siteUrl}/contact`,
    },
  }));
}

export function getPortfolioSchema(locale: Locale) {
  return siteContent.portfolio.map((item) => ({
    '@type': 'CreativeWork',
    name: item.title,
    description: item.desc[locale as keyof typeof item.desc],
    url: item.doc || item.site || item.github,
    keywords: item.tags.join(', '),
  }));
}

export function getWebsiteSchema(locale: Locale) {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    url: siteUrl,
    name: siteContent.site.name,
    inLanguage: localeToLanguage[locale as keyof typeof localeToLanguage],
    description:
      siteContent.hero.subhead[locale as keyof typeof siteContent.hero.subhead],
    potentialAction: {
      '@type': 'ContactAction',
      target: `${siteUrl}/contact`,
    },
  };
}

export function getBreadcrumbList(locale: Locale, items: Breadcrumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}/${locale}${item.href}`,
    })),
  };
}

export function getHomeJsonLd(locale: Locale) {
  return JSON.stringify(
    [
      getOrganizationSchema(locale),
      getWebsiteSchema(locale),
      ...getServicesSchema(locale),
      ...getPortfolioSchema(locale),
      getBreadcrumbList(locale, [{ name: 'Home', href: '' }]),
    ],
    null,
    2,
  );
}

export function getContactJsonLd(locale: Locale) {
  return JSON.stringify(
    [
      getOrganizationSchema(locale),
      getWebsiteSchema(locale),
      getBreadcrumbList(locale, [
        { name: 'Home', href: '' },
        { name: 'Contact', href: '/contact' },
      ]),
    ],
    null,
    2,
  );
}

export function getLegalJsonLd(locale: Locale, slug: string, title: string) {
  return JSON.stringify(
    [
      getOrganizationSchema(locale),
      getWebsiteSchema(locale),
      getBreadcrumbList(locale, [
        { name: 'Home', href: '' },
        { name: title, href: slug },
      ]),
    ],
    null,
    2,
  );
}
