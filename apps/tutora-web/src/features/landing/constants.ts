import { CONTACT_EMAIL } from '@shared/constants';

/** Anchor ids for every landing section — the single source of truth shared by
 *  the sections, the header navigation, and the skip link. */
export const SECTION_IDS = {
  hero: 'hero',
  why: 'why',
  howItWorks: 'how-it-works',
  advantages: 'advantages',
  stats: 'stats',
  tutors: 'tutors',
  students: 'students',
  app: 'app',
  testimonials: 'testimonials',
  faq: 'faq',
  blog: 'blog',
  download: 'download',
} as const;

export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

/** Primary header navigation. `labelKey` resolves against the `nav` namespace. */
export const NAV_ITEMS: ReadonlyArray<{ href: string; labelKey: string }> = [
  { href: `#${SECTION_IDS.why}`, labelKey: 'why' },
  { href: `#${SECTION_IDS.howItWorks}`, labelKey: 'howItWorks' },
  { href: `#${SECTION_IDS.advantages}`, labelKey: 'advantages' },
  { href: `#${SECTION_IDS.tutors}`, labelKey: 'tutors' },
  { href: `#${SECTION_IDS.faq}`, labelKey: 'faq' },
];

type FooterLink = { href: string; labelKey: string };
type FooterColumn = { headingKey: string; links: ReadonlyArray<FooterLink> };

/** Footer navigation columns. Labels resolve against `footer.links.*`; headings
 *  against `footer.columns.*`. Product links are on-page anchors; legal routes
 *  are placeholders until those pages ship. */
export const FOOTER_COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    headingKey: 'product',
    links: [
      { href: `#${SECTION_IDS.howItWorks}`, labelKey: 'howItWorks' },
      { href: `#${SECTION_IDS.advantages}`, labelKey: 'advantages' },
      { href: `#${SECTION_IDS.tutors}`, labelKey: 'tutors' },
      { href: `#${SECTION_IDS.students}`, labelKey: 'students' },
      { href: `#${SECTION_IDS.faq}`, labelKey: 'faq' },
    ],
  },
  {
    headingKey: 'company',
    links: [
      { href: `#${SECTION_IDS.why}`, labelKey: 'about' },
      { href: `#${SECTION_IDS.blog}`, labelKey: 'blog' },
      { href: `mailto:${CONTACT_EMAIL}`, labelKey: 'contact' },
    ],
  },
  {
    headingKey: 'legal',
    links: [
      { href: '#', labelKey: 'privacy' },
      { href: '#', labelKey: 'terms' },
    ],
  },
];
