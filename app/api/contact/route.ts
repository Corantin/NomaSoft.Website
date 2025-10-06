import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import siteContent from '@/content/site.json';
import { Locale, defaultLocale, isLocale } from '@/lib/i18n';
import { parseFormData } from '@/lib/validators';

async function verifyCaptcha(token: string | undefined) {
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET;
  const turnstileSecret = process.env.TURNSTILE_SECRET;

  if (hcaptchaSecret) {
    if (!token) return false;
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: hcaptchaSecret,
        response: token,
      }),
    });
    const result = (await response.json()) as { success: boolean };
    return result.success;
  }

  if (turnstileSecret) {
    if (!token) return false;
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: token,
        }),
      },
    );
    const result = (await response.json()) as { success: boolean };
    return result.success;
  }

  return true;
}

async function sendEmail(payload: {
  name: string;
  email: string;
  company?: string;
  message: string;
  service: string;
}) {
  const to = process.env.CONTACT_TO_EMAIL;
  if (!to) {
    return;
  }

  const subject = `[NomaSoft] ${payload.name} — ${payload.service}`;
  const text = `Name: ${payload.name}\nEmail: ${payload.email}\nCompany: ${payload.company ?? 'N/A'}\nService: ${payload.service}\n\n${payload.message}`;

  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${siteContent.site.name} <${to}>`,
        to: [to],
        reply_to: payload.email,
        subject,
        text,
      }),
    });
    if (!response.ok) {
      throw new Error('resend_request_failed');
    }
    return;
  }

  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
    });

    await transporter.sendMail({
      to,
      from: process.env.SMTP_FROM || to,
      replyTo: payload.email,
      subject,
      text,
    });
  }
}

async function appendToSheet(data: Record<string, unknown>) {
  const webhook = process.env.SHEET_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Sheet webhook error', error);
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const localeParam = form.get('locale');
    const locale = isLocale(typeof localeParam === 'string' ? localeParam : undefined)
      ? (localeParam as Locale)
      : defaultLocale;

    // TODO: Replace with actual translation logic if needed
    const parsed = parseFormData(form, (key) => key);

    const captchaValid = await verifyCaptcha(parsed.token);
    if (!captchaValid) {
      return NextResponse.json({ error: 'captcha_failed' }, { status: 400 });
    }

    const { file, token, ...rest } = parsed;

    await sendEmail(parsed);
    await appendToSheet({
      ...rest,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}
