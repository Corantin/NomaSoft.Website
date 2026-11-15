import { createHmac, timingSafeEqual } from 'node:crypto';

export const CAPTCHA_SESSION_COOKIE = 'nomasoft_human_verified';
export const CONTACT_SUBMISSION_COOKIE = 'nomasoft_contact_submitted';
export const CAPTCHA_SESSION_MAX_AGE = 24 * 60 * 60;

type CaptchaSessionConfig = {
  type: 'hcaptcha' | 'turnstile';
  secret: string;
};

type SessionKind = 'human' | 'submitted';

function sign(payload: string, config: CaptchaSessionConfig) {
  return createHmac('sha256', config.secret)
    .update(`nomasoft-contact-captcha:${payload}`)
    .digest('base64url');
}

export function createCaptchaSession(
  config: CaptchaSessionConfig,
  kind: SessionKind,
  now = Date.now(),
) {
  const payload = `v1.${config.type}.${kind}.${Math.floor(now / 1000)}`;
  return `${payload}.${sign(payload, config)}`;
}

export function isCaptchaSessionValid(
  value: string | undefined,
  config: CaptchaSessionConfig,
  kind: SessionKind,
  now = Date.now(),
) {
  if (!value) return false;

  const [version, type, signedKind, issuedAt, signature, extra] = value.split('.');
  if (version !== 'v1' || type !== config.type || signedKind !== kind || extra || !/^\d+$/.test(issuedAt ?? '')) {
    return false;
  }

  const age = Math.floor(now / 1000) - Number(issuedAt);
  if (age < 0 || age > CAPTCHA_SESSION_MAX_AGE) return false;

  const expected = Buffer.from(sign(`${version}.${type}.${signedKind}.${issuedAt}`, config));
  const actual = Buffer.from(signature ?? '');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
