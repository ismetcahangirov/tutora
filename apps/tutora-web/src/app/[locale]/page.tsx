import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type LocaleParams = { locale: string };

export default async function Home({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('tagline')}</p>
      <LanguageSwitcher />
    </main>
  );
}
