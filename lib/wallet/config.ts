import { createPrivateKey, X509Certificate } from 'node:crypto';

export type AppleWalletConfig = {
  passTypeId: string;
  teamId: string;
  signerCert: Buffer;
  signerKey: Buffer;
  wwdrCert: Buffer;
  signerKeyPassphrase?: string;
};

export type GoogleWalletConfig = {
  issuerId: string;
  clientEmail: string;
  privateKey: string;
  classId: string;
  objectId: string;
};

export const googleClassSuffix = 'nomasoft_business_card';
export const googleObjectSuffix = 'nomasoft_business_card_shared';

function decodePem(value: string | undefined): Buffer | null {
  if (!value) return null;
  try {
    const decoded = Buffer.from(value, 'base64');
    return decoded.toString('utf8').includes('-----BEGIN ') ? decoded : null;
  } catch {
    return null;
  }
}

export function getAppleWalletConfig(): AppleWalletConfig | null {
  const passTypeId = process.env.APPLE_WALLET_PASS_TYPE_ID;
  const teamId = process.env.APPLE_WALLET_TEAM_ID;
  const signerCert = decodePem(process.env.APPLE_WALLET_SIGNER_CERT_B64);
  const signerKey = decodePem(process.env.APPLE_WALLET_SIGNER_KEY_B64);
  const wwdrCert = decodePem(process.env.APPLE_WALLET_WWDR_CERT_B64);
  if (!passTypeId || !teamId || !signerCert || !signerKey || !wwdrCert) return null;

  try {
    const certificate = new X509Certificate(signerCert);
    const now = Date.now();
    if (now < Date.parse(certificate.validFrom) || now > Date.parse(certificate.validTo)) return null;
    const privateKey = createPrivateKey({ key: signerKey, passphrase: process.env.APPLE_WALLET_SIGNER_KEY_PASSPHRASE });
    if (!certificate.checkPrivateKey(privateKey)) return null;
    new X509Certificate(wwdrCert);
  } catch {
    return null;
  }

  return {
    passTypeId,
    teamId,
    signerCert,
    signerKey,
    wwdrCert,
    signerKeyPassphrase: process.env.APPLE_WALLET_SIGNER_KEY_PASSPHRASE,
  };
}

export function getGoogleWalletConfig(): GoogleWalletConfig | null {
  if (process.env.GOOGLE_WALLET_READY !== 'true') return null;
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const encoded = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_B64;
  if (!issuerId || !/^\d+$/.test(issuerId) || !encoded) return null;

  try {
    const account = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as {
      type?: string; client_email?: string; private_key?: string;
    };
    if (account.type !== 'service_account' || !account.client_email || !account.private_key) return null;
    createPrivateKey(account.private_key);
    return {
      issuerId,
      clientEmail: account.client_email,
      privateKey: account.private_key,
      classId: `${issuerId}.${googleClassSuffix}`,
      objectId: `${issuerId}.${googleObjectSuffix}`,
    };
  } catch {
    return null;
  }
}

export function getWalletAvailability() {
  return {
    apple: getAppleWalletConfig() !== null,
    google: getGoogleWalletConfig() !== null,
  };
}
