export type CaptchaProvider = 'hcaptcha' | 'turnstile';

interface CaptchaEnv {
  hcaptchaSecret?: string;
  hcaptchaSiteKey?: string;
  turnstileSecret?: string;
  turnstileSiteKey?: string;
}

const HCAPTCHA_DEV_SITE_KEY = '10000000-ffff-ffff-ffff-000000000001';
const HCAPTCHA_DEV_SECRET = '0x0000000000000000000000000000000000000000';

interface CaptchaConfig {
  type: CaptchaProvider;
  siteKey: string;
  secret: string;
}

export interface CaptchaClientConfig {
  type: CaptchaProvider;
  siteKey: string;
}

let hasLoggedPartialConfig = false;

function readCaptchaEnv(): CaptchaEnv {
  const isProd = process.env.NODE_ENV === 'production';
  const useProdHcaptchaInDev = process.env.HCAPTCHA_USE_PROD_KEYS_IN_DEV === 'true';

  const hcaptchaSecretEnv = process.env.HCAPTCHA_SECRET?.trim() || undefined;
  const hcaptchaSiteKeyEnv = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY?.trim() || undefined;

  const shouldUseDevFallback = !isProd && !useProdHcaptchaInDev;

  return {
    hcaptchaSecret: shouldUseDevFallback ? HCAPTCHA_DEV_SECRET : hcaptchaSecretEnv,
    hcaptchaSiteKey: shouldUseDevFallback ? HCAPTCHA_DEV_SITE_KEY : hcaptchaSiteKeyEnv,
    turnstileSecret: process.env.TURNSTILE_SECRET?.trim() || undefined,
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined
  };
}

function logPartialConfiguration(env: CaptchaEnv) {
  if (hasLoggedPartialConfig) return;

  const hcaptchaPartial = Boolean(env.hcaptchaSecret) !== Boolean(env.hcaptchaSiteKey);
  const turnstilePartial = Boolean(env.turnstileSecret) !== Boolean(env.turnstileSiteKey);

  if (hcaptchaPartial || turnstilePartial) {
    console.warn(
      'Captcha environment variables are partially configured. Skipping verification until both public and secret keys are set.'
    );
    hasLoggedPartialConfig = true;
  }
}

function getCaptchaConfig(): CaptchaConfig | null {
  const env = readCaptchaEnv();

  if (env.turnstileSecret && env.turnstileSiteKey) {
    return {
      type: 'turnstile',
      siteKey: env.turnstileSiteKey,
      secret: env.turnstileSecret
    };
  }

  if (env.hcaptchaSecret && env.hcaptchaSiteKey) {
    return {
      type: 'hcaptcha',
      siteKey: env.hcaptchaSiteKey,
      secret: env.hcaptchaSecret
    };
  }

  logPartialConfiguration(env);
  return null;
}

export function getCaptchaClientConfig(): CaptchaClientConfig | null {
  const config = getCaptchaConfig();
  if (!config) {
    return null;
  }

  return {
    type: config.type,
    siteKey: config.siteKey
  };
}

export async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  const config = getCaptchaConfig();
  if (!config) {
    return true;
  }

  if (!token) {
    return false;
  }

  if (config.type === 'hcaptcha') {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        secret: config.secret,
        response: token
      })
    });
    const result = (await response.json()) as {success: boolean};
    return result.success;
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      secret: config.secret,
      response: token
    })
  });
  const result = (await response.json()) as {success: boolean};
  return result.success;
}
