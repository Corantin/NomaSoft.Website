import { createSign } from 'node:crypto';
import type { GoogleWalletConfig } from './config';

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function createGoogleWalletSaveUrl(config: GoogleWalletConfig) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: config.clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: now,
    origins: ['https://nomasoft.dev', 'https://www.nomasoft.dev'],
    payload: { genericObjects: [{ id: config.objectId, classId: config.classId }] },
  };
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(claims)}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `https://pay.google.com/gp/v/save/${unsigned}.${signer.sign(config.privateKey, 'base64url')}`;
}
