import { getGoogleWalletConfig } from '@/lib/wallet/config';
import { createGoogleWalletSaveUrl } from '@/lib/wallet/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  const config = getGoogleWalletConfig();
  if (!config) {
    return new Response('Google Wallet is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    return new Response(null, {
      status: 303,
      headers: {
        Location: createGoogleWalletSaveUrl(config),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    console.error('Google Wallet link generation failed', error);
    return new Response('Google Wallet is temporarily unavailable.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
