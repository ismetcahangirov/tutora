import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { env } from '@shared/config/env';
import { APP_NAME } from '@shared/constants';
import {
  buildLanguageAlternates,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  JsonLdScript,
  localePath,
} from '@shared/seo';
import { routing } from '@/i18n/routing';

import '../globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

type LocaleParams = { locale: string };

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: { default: t('title'), template: `%s · ${APP_NAME}` },
    description: t('description'),
    applicationName: APP_NAME,
    keywords: t('keywords')
      .split(',')
      .map((keyword) => keyword.trim()),
    alternates: {
      canonical: localePath(locale),
      languages: buildLanguageAlternates(routing.locales, routing.defaultLocale),
    },
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      title: t('title'),
      description: t('description'),
      url: localePath(locale),
      locale,
      images: [{ url: '/og', width: 1200, height: 630, alt: t('title') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Enables static rendering for this locale.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const description = t('description');

  return (
    <html lang={locale} className={plusJakarta.variable}>
      <body>
        <JsonLdScript
          data={[
            buildOrganizationJsonLd({ siteUrl, description }),
            buildWebSiteJsonLd({ siteUrl, description, locale }),
          ]}
        />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
