import { createSign } from 'node:crypto';

const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
const encodedAccount = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_B64;
if (!issuerId || !/^\d+$/.test(issuerId) || !encodedAccount) {
  throw new Error('Set GOOGLE_WALLET_ISSUER_ID and GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_B64 first.');
}

const account = JSON.parse(Buffer.from(encodedAccount, 'base64').toString('utf8'));
if (account.type !== 'service_account' || !account.client_email || !account.private_key) {
  throw new Error('The Google Wallet service account JSON is incomplete.');
}

const classId = `${issuerId}.nomasoft_business_card`;
const objectId = `${issuerId}.nomasoft_business_card_shared`;
const localized = (value) => ({ defaultValue: { language: 'en-US', value } });

function signJwt(claims) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(claims)}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(account.private_key, 'base64url')}`;
}

const now = Math.floor(Date.now() / 1000);
const assertion = signJwt({
  iss: account.client_email,
  scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600,
});
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  }),
});
if (!tokenResponse.ok) throw new Error(`Google OAuth failed (${tokenResponse.status}).`);
const { access_token: accessToken } = await tokenResponse.json();
if (!accessToken) throw new Error('Google OAuth did not return an access token.');

const api = 'https://walletobjects.googleapis.com/walletobjects/v1';
async function getOrCreate(kind, id, body) {
  const url = `${api}/${kind}/${encodeURIComponent(id)}`;
  const headers = { Authorization: `Bearer ${accessToken}` };
  const existing = await fetch(url, { headers });
  if (existing.ok) return { created: false, value: await existing.json() };
  if (existing.status !== 404) throw new Error(`Reading ${kind} failed (${existing.status}).`);

  const created = await fetch(`${api}/${kind}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!created.ok) {
    const message = await created.text();
    throw new Error(`Creating ${kind} failed (${created.status}): ${message.slice(0, 500)}`);
  }
  return { created: true, value: await created.json() };
}

const passClass = await getOrCreate('genericClass', classId, {
  id: classId,
  multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',
});
if (passClass.value.multipleDevicesAndHoldersAllowedStatus !== 'MULTIPLE_HOLDERS') {
  throw new Error('The existing class must allow MULTIPLE_HOLDERS for a shared business card.');
}

const passObject = await getOrCreate('genericObject', objectId, {
  id: objectId,
  classId,
  state: 'ACTIVE',
  cardTitle: localized('NomaSoft'),
  header: localized('Software Engineering'),
  subheader: localized('Digital business card'),
  hexBackgroundColor: '#000000',
  logo: {
    sourceUri: { uri: 'https://nomasoft.dev/images/NomaSoftLogo.png' },
    contentDescription: localized('NomaSoft hexagonal logo'),
  },
  barcode: { type: 'QR_CODE', value: 'https://nomasoft.dev/card', alternateText: 'nomasoft.dev/card' },
  textModulesData: [
    { id: 'phone', header: 'Phone', body: '514-298-7682' },
    { id: 'email', header: 'Email', body: 'contact@nomasoft.dev' },
    { id: 'website', header: 'Website', body: 'nomasoft.dev' },
  ],
  linksModuleData: {
    uris: [
      { uri: 'https://nomasoft.dev', description: 'nomasoft.dev', id: 'website' },
      { uri: 'https://nomasoft.dev/card', description: 'Digital card', id: 'card' },
    ],
  },
});
if (passObject.value.classId !== classId || passObject.value.barcode?.value !== 'https://nomasoft.dev/card') {
  throw new Error('The existing object does not match the NomaSoft card.');
}

console.log(`Google Wallet class ${passClass.created ? 'created' : 'verified'}: ${classId}`);
console.log(`Google Wallet object ${passObject.created ? 'created' : 'verified'}: ${objectId}`);
console.log('After testing save and receiving publishing access, set GOOGLE_WALLET_READY=true.');
