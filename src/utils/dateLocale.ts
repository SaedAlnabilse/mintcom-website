import { arEG } from 'date-fns/locale/ar-EG';

export const getDateLocale = (locale: string) => {
  return locale === 'ar' ? arEG : undefined;
};

export { arEG };
