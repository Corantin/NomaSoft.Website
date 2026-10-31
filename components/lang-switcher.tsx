'use client';

import { useLocale } from 'next-intl';
import { createNavigation } from 'next-intl/navigation';
import { useTransition } from 'react';
import { languageCookieName, locales } from '@/lib/i18n';

export function LangSwitcher({ label }: { label: string }) {
  const navigation = createNavigation();
  const locale = useLocale();
  const pathname = navigation.usePathname();
  const router = navigation.useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextLocale: (typeof locales)[number]) => {
    if (nextLocale === locale || isPending) return;

    document.cookie = `${languageCookieName}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;

    startTransition(() => {
      router.push(pathname, { locale: nextLocale });
    });
  };

  return (
    <div
      role="group"
      aria-label={label}
      aria-busy={isPending}
      className="inline-flex items-center rounded-full border border-zinc-700/80 bg-zinc-900/80 p-1"
    >
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-label={option === 'en' ? 'English' : 'Français'}
          aria-pressed={locale === option}
          disabled={isPending}
          onClick={() => handleChange(option)}
          className={`min-w-10 rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait ${
            locale === option
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
