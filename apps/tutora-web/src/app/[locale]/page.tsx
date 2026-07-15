import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  Advantages,
  AppShowcase,
  Benefits,
  BlogPreview,
  Cta,
  Faq,
  Footer,
  Header,
  Hero,
  HowItWorks,
  ProblemSolution,
  SECTION_IDS,
  Stats,
  Testimonials,
} from '@features/landing';

type LocaleParams = { locale: string };

export default async function Home({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  // Opt this locale into static rendering.
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60]"
      >
        {t('skipToContent')}
      </a>

      <Header />

      <main id="main">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <Advantages />
        <Stats />
        <Benefits namespace="tutors" id={SECTION_IDS.tutors} />
        <Benefits namespace="students" id={SECTION_IDS.students} surface reverse />
        <AppShowcase />
        <Testimonials />
        <Faq />
        <BlogPreview />
        <Cta />
      </main>

      <Footer />
    </>
  );
}
