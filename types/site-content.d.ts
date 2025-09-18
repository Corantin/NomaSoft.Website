// TypeScript types for siteContent JSON structure

export type LocalizedString = {
  en: string;
  fr: string;
  [key: string]: string;
};

export type LocalizedStringArray = {
  en: string[];
  fr: string[];
  [key: string]: string[];
};

export interface SiteContent {
  site: {
    name: string;
    tagline: string;
    locales: string[];
    contact: {
      email: string;
      calendly: string;
    };
    social: { github: string };
  };
  hero: {
    headline: LocalizedString;
    subhead: LocalizedString;
    primaryCta: LocalizedString;
    secondaryCta: LocalizedString;
  };
  services: Array<{
    key: string;
    title: LocalizedString;
    summary: LocalizedString;
    bullets: LocalizedStringArray;
  }>;
  process: Array<{
    title: LocalizedString;
    desc: LocalizedString;
  }>;
  portfolio: Array<{
    title: string;
    desc: LocalizedString;
    tags: string[];
    link: string;
  }>;
}
