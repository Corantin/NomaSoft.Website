import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { defaultLocale, isLocale, languageCookieName } from '@/lib/i18n';

export default function ContactEntry() {
  const preferred = cookies().get(languageCookieName)?.value;
  redirect(`/${isLocale(preferred) ? preferred : defaultLocale}/contact`);
}
