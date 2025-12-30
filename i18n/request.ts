import {defaultLocale, isLocale} from '@/lib/i18n';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default
  };
});
