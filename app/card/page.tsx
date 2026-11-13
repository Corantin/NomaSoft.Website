import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isLocale, languageCookieName } from '@/lib/i18n';

export default function CardEntry() {
  const preferred = cookies().get(languageCookieName)?.value;
  redirect(`/${isLocale(preferred) ? preferred : 'en'}/card`);
}
