'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {useEffect} from 'react';

export default function LocaleError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-center text-zinc-100">
      <h1 className="text-4xl font-semibold">{t('errorTitle')}</h1>
      <p className="max-w-xl text-sm text-zinc-400">{t('errorBody')}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
        >
          {t('retry')}
        </button>
        <Link
          href="."
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-brand hover:text-white"
        >
          {t('goHome')}
        </Link>
      </div>
    </section>
  );
}
