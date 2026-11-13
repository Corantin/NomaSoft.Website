import { companyCard } from '@/lib/card';

function escapeVCard(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function GET() {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCard(companyCard.name)}`,
    `ORG:${escapeVCard(companyCard.name)}`,
    `TITLE:${escapeVCard(companyCard.role)}`,
    `TEL;TYPE=WORK,VOICE:${companyCard.phone}`,
    `EMAIL;TYPE=WORK:${companyCard.email}`,
    `URL:${companyCard.website}`,
    `URL;TYPE=PROFILE:${companyCard.url}`,
    ...(companyCard.linkedin ? [`URL;TYPE=LINKEDIN:${companyCard.linkedin}`] : []),
    'END:VCARD',
  ];

  return new Response(`${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="NomaSoft.vcf"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
