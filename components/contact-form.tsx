'use client';

import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CaptchaClientConfig } from '@/lib/captcha';
import siteContent from '@/content/site.json';
import { createContactSchema, MAX_MESSAGE_LENGTH } from '@/lib/validators';

interface Props {
  locale: string;
  defaultService?: string;
  captcha?: CaptchaClientConfig | null;
}

type Status = 'idle' | 'validating' | 'submitting' | 'success' | 'error';
const serviceOrder = ['web', 'mobile', 'web3', 'ai'];

declare global {
  interface Window {
    nomasoftOnHcaptcha?: (token: string) => void;
    nomasoftOnTurnstile?: (token: string) => void;
    hcaptcha?: {
      reset: (widgetId?: string) => void;
      execute: (
        widgetId: undefined,
        options: { async: true },
      ) => Promise<{ response: string; key: string }>;
    };
    turnstile?: { reset: (element: HTMLElement) => void };
  }
}

export function ContactForm({ locale, defaultService, captcha }: Props) {
  const t = useTranslations();
  const contactT = useTranslations('contact');
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const contactEmail = siteContent.site.contact.email;
  const [mailtoHref, setMailtoHref] = useState(() => `mailto:${contactEmail}`);

  const captchaType = captcha?.type ?? null;

  useEffect(() => {
    if (captchaType === 'hcaptcha') {
      window.nomasoftOnHcaptcha = (token: string) => setCaptchaToken(token);
    } else if (captchaType === 'turnstile') {
      window.nomasoftOnTurnstile = (token: string) => setCaptchaToken(token);
    }
    return () => {
      window.nomasoftOnHcaptcha = undefined;
      window.nomasoftOnTurnstile = undefined;
    };
  }, [captchaType]);

  const schema = useMemo(() => createContactSchema((key) => t(key)), [t]);

  const resetCaptcha = () => {
    if (captchaType === 'hcaptcha' && window.hcaptcha) {
      window.hcaptcha.reset();
    }
    if (captchaType === 'turnstile') {
      const el = document.querySelector('.cf-turnstile') as HTMLElement | null;
      if (el && window.turnstile) {
        window.turnstile.reset(el);
      }
    }
    setCaptchaToken(undefined);
  };

  const buildMailtoHref = (data: {
    name: string;
    email: string;
    company?: string;
    message: string;
    service: string;
  }) => {
    const serviceTitle =
      siteContent.services.find((service) => service.key === data.service)?.title[
        locale as keyof (typeof siteContent.services)[number]['title']
      ] ?? data.service;

    const detailLines = [
      `${contactT('name')}: ${data.name}`,
      data.company ? `${contactT('company')}: ${data.company}` : null,
      `${contactT('service')}: ${serviceTitle}`,
    ].filter((line): line is string => Boolean(line));

    const body = `${detailLines.join('\n')}\n\n${contactT('message')}:\n${data.message}`;
    const subject = contactT('mailSubject');

    return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setStatus('validating');
    setErrors({});

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      company: formData.get('company') || undefined,
      message: formData.get('message'),
      service: formData.get('service'),
      token: captchaToken,
      honeypot: formData.get('company-website'),
      file: undefined,
    };

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === 'string') {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setStatus('idle');
      return;
    }

    const fallbackMailto = buildMailtoHref(parsed.data);

    try {
      let verifiedToken = parsed.data.token;
      if (captchaType === 'hcaptcha') {
        if (!window.hcaptcha?.execute) {
          throw new Error('Captcha is not ready');
        }
        const result = await window.hcaptcha.execute(undefined, { async: true });
        verifiedToken = result.response;
      }

      setStatus('submitting');
      const submission = new FormData();
      submission.append('name', parsed.data.name);
      submission.append('email', parsed.data.email);
      if (parsed.data.company) submission.append('company', parsed.data.company);
      submission.append('message', parsed.data.message);
      submission.append('service', parsed.data.service);
      if (verifiedToken) submission.append('token', verifiedToken);
      if (parsed.data.file) submission.append('file', parsed.data.file);
      submission.append('locale', locale);

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: submission,
      });

      if (!response.ok) {
        throw new Error('Failed');
      }

      setStatus('success');
      formElement.reset();
      resetCaptcha();
      setMailtoHref(`mailto:${contactEmail}`);
    } catch (error) {
      console.error(error);
      setMailtoHref(fallbackMailto);
      setStatus('error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-7 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-12"
      noValidate
    >
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-bold uppercase tracking-widest text-zinc-500"
          >
            {contactT('name')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={contactT('namePlaceholder')}
            className="mt-3 w-full border-b border-zinc-700 bg-transparent px-0 py-3 text-base text-white outline-none placeholder:text-zinc-500 focus:border-brand-light"
            required
          />
          {errors.name ? (
            <p className="mt-2 text-xs text-red-400">{errors.name}</p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-widest text-zinc-500"
          >
            {contactT('email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={contactT('emailPlaceholder')}
            className="mt-3 w-full border-b border-zinc-700 bg-transparent px-0 py-3 text-base text-white outline-none placeholder:text-zinc-500 focus:border-brand-light"
            required
          />
          {errors.email ? (
            <p className="mt-2 text-xs text-red-400">{errors.email}</p>
          ) : null}
        </div>
      </div>
      <div>
        <label
          htmlFor="service"
          className="block text-xs font-bold uppercase tracking-widest text-zinc-500"
        >
          {contactT('service')}
        </label>
        <select
          id="service"
          name="service"
          defaultValue={defaultService ?? 'web'}
          className="mt-3 w-full border-b border-zinc-700 bg-transparent px-0 py-3 text-base text-white outline-none focus:border-brand-light [&>option]:bg-zinc-950"
          required
        >
          {serviceOrder.map((key) => (
            <option key={key} value={key}>
              {contactT(`serviceOptions.${key}`)}
            </option>
          ))}
        </select>
        {errors.service ? (
          <p className="mt-2 text-xs text-red-400">{errors.service}</p>
        ) : null}
      </div>
      <div>
        <label
          htmlFor="message"
          className="block text-xs font-bold uppercase tracking-widest text-zinc-500"
        >
          {contactT('message')}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={contactT('messagePlaceholder')}
          className="mt-3 w-full resize-y border-b border-zinc-700 bg-transparent px-0 py-3 text-base text-white outline-none placeholder:text-zinc-500 focus:border-brand-light"
          required
        />
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span className="text-red-400">{errors.message ?? ''}</span>
          <span>{MAX_MESSAGE_LENGTH} max</span>
        </div>
      </div>
      <div aria-hidden="true" className="hidden">
        <label htmlFor="company-website">Company Website</label>
        <input
          id="company-website"
          name="company-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {captchaType === 'hcaptcha' && captcha?.siteKey ? (
        <div>
          <Script src="https://js.hcaptcha.com/1/api.js" async defer />
          <div
            className="h-captcha"
            data-sitekey={captcha.siteKey}
            data-callback="nomasoftOnHcaptcha"
            data-size="invisible"
          />
        </div>
      ) : null}
      {captchaType === 'turnstile' && captcha?.siteKey ? (
        <div className="flex justify-center">
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async
            defer
          />
          <div
            className="cf-turnstile"
            data-sitekey={captcha.siteKey}
            data-callback="nomasoftOnTurnstile"
            data-theme="dark"
          />
        </div>
      ) : null}
      <button
        type="submit"
        className="w-full rounded-full bg-brand px-6 py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        disabled={status === 'submitting' || status === 'validating'}
      >
        {status === 'validating'
          ? contactT('validating')
          : status === 'submitting'
            ? contactT('sending')
            : contactT('submit')}
      </button>
      <p className="text-center text-xs text-zinc-600">{contactT('subtitle')}</p>
      <div role="status" aria-live="polite" className="text-sm">
        {status === 'success' ? (
          <p className="text-brand-light">{contactT('success')}</p>
        ) : null}
        {status === 'error' ? (
          <div className="space-y-2">
            <p className="text-red-400">{contactT('error')}</p>
            <a
              href={mailtoHref}
              className="transition text-blue-400 hover:text-dodgerblue-600"
            >
              {siteContent.site.contact.email}
            </a>
          </div>
        ) : null}
      </div>
    </form>
  );
}
