/**
 * Shapes of the structured content pulled from the i18n catalogs via `t.raw`.
 * These carry translatable text only — icons and other presentational choices
 * live in the section components and are zipped in by index.
 */

export type FeatureItem = {
  title: string;
  description: string;
};

export type HowItWorksStep = {
  title: string;
  description: string;
};

export type Stat = {
  value: string;
  label: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type BlogPost = {
  category: string;
  title: string;
  excerpt: string;
  readingTime: string;
};

export type ComparisonRow = {
  problem: string;
  solution: string;
};
