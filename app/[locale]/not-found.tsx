import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/lib/i18n';

export default async function LocaleNotFound({ params }: { params: { locale: string } }) {
  const locale = params?.locale;

  if (!isLocale(locale)) {
    unstable_setRequestLocale('en');
  } else {
    unstable_setRequestLocale(locale);
  }

  const errors = await getTranslations({
    locale: isLocale(locale) ? locale : 'en',
    namespace: 'errors',
  });

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-center text-zinc-100">
      <h1 className="text-4xl font-semibold">{errors('notFoundTitle')}</h1>
      <p className="max-w-xl text-sm text-zinc-400">{errors('notFoundBody')}</p>
      <Link
        href={`/${isLocale(locale) ? locale : 'en'}`}
        className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
      >
        {errors('goHome')}
      </Link>
    </section>
  );
}
