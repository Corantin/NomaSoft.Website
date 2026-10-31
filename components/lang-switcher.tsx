'use client';

import { useLocale } from 'next-intl';
import { createNavigation } from 'next-intl/navigation';
import { useTransition } from 'react';
import { languageCookieName, locales } from '@/lib/i18n';

export function LangSwitcher({
  label,
  variant = 'pill',
}: {
  label: string;
  variant?: 'pill' | 'footer';
}) {
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

  if (variant === 'footer') {
    return (
      <div
        role="group"
        aria-label={label}
        aria-busy={isPending}
        className="flex items-center gap-5"
      >
        {(['fr', 'en'] as const).map((option, index) => (
          <div key={option} className="flex items-center gap-5">
            {index > 0 ? (
              <span aria-hidden="true" className="text-zinc-800">
                /
              </span>
            ) : null}
            <button
              type="button"
              lang={option}
              aria-pressed={locale === option}
              disabled={isPending}
              onClick={() => handleChange(option)}
              className={`text-xs font-bold uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-light disabled:cursor-wait ${
                locale === option ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {option === 'fr' ? 'Français' : 'English'}
            </button>
          </div>
        ))}
      </div>
    );
  }

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
