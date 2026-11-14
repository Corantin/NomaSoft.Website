// A profile can later be selected by slug for individual team cards.
export type CardProfile = {
  id: string;
  name: string;
  role: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  website: string;
  websiteDisplay: string;
  url: string;
  vcardPath: string;
  qrPath: string;
  linkedin?: string;
};

export const companyCard: CardProfile = {
  id: 'nomasoft',
  name: 'NomaSoft',
  role: 'Software Engineering',
  phone: '+15142987682',
  phoneDisplay: '514-298-7682',
  email: 'team@nomasoft.dev',
  website: 'https://nomasoft.dev',
  websiteDisplay: 'nomasoft.dev',
  url: 'https://nomasoft.dev/card',
  vcardPath: '/card/contact.vcf',
  qrPath: '/images/nomasoft-card-qr.svg',
};
