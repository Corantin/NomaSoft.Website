'use client';

import { useLocale } from 'next-intl';
import { createNavigation } from 'next-intl/navigation';
import { ChangeEvent, useTransition } from 'react';
import { languageCookieName, locales } from '@/lib/i18n';

export function LangSwitcher({ label }: { label: string }) {
  const navigation = createNavigation();
  const locale = useLocale();
  const pathname = navigation.usePathname();
  const router = navigation.useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;
    document.cookie = `${languageCookieName}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;

    startTransition(() => {
      router.push(pathname, { locale: nextLocale });
    });
  };

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
      <span className="sr-only sm:not-sr-only">{label}</span>
      <select
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
        onChange={handleChange}
        value={locale}
        aria-label={label}
        disabled={isPending}
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {option.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
