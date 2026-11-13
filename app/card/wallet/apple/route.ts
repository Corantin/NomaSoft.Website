import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PKPass } from 'passkit-generator';
import { companyCard } from '@/lib/card';
import { getAppleWalletConfig } from '@/lib/wallet/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getAppleWalletConfig();
  if (!config) {
    return new Response('Apple Wallet is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    const asset = (name: string) => readFileSync(join(process.cwd(), 'wallet/assets', name));
    const pass = new PKPass(
      {
        'icon.png': asset('icon.png'),
        'icon@2x.png': asset('icon@2x.png'),
        'logo.png': asset('logo.png'),
        'logo@2x.png': asset('logo@2x.png'),
      },
      {
        signerCert: config.signerCert,
        signerKey: config.signerKey,
        wwdr: config.wwdrCert,
        signerKeyPassphrase: config.signerKeyPassphrase,
      },
      {
        formatVersion: 1,
        passTypeIdentifier: config.passTypeId,
        teamIdentifier: config.teamId,
        serialNumber: companyCard.id,
        organizationName: companyCard.name,
        description: `${companyCard.name} digital business card`,
        logoText: companyCard.name,
        backgroundColor: 'rgb(0, 0, 0)',
        foregroundColor: 'rgb(255, 255, 255)',
        labelColor: 'rgb(190, 190, 190)',
      },
    );

    pass.type = 'generic';
    pass.primaryFields.push({ key: 'role', label: 'SOFTWARE ENGINEERING', value: companyCard.name });
    pass.secondaryFields.push({ key: 'phone', label: 'PHONE', value: companyCard.phoneDisplay });
    pass.secondaryFields.push({ key: 'email', label: 'EMAIL', value: companyCard.email });
    pass.backFields.push({ key: 'website', label: 'WEBSITE', value: companyCard.website });
    pass.backFields.push({ key: 'card', label: 'DIGITAL CARD', value: companyCard.url });
    pass.setBarcodes({
      format: 'PKBarcodeFormatQR',
      message: companyCard.url,
      messageEncoding: 'iso-8859-1',
      altText: 'nomasoft.dev/card',
    });

    return new Response(new Uint8Array(pass.getAsBuffer()), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="NomaSoft.pkpass"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Apple Wallet pass generation failed', error);
    return new Response('Apple Wallet pass is temporarily unavailable.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
