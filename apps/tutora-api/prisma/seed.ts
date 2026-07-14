import { PlanTier, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DISTRICTS = ['Nasimi', 'Yasamal', 'Sabail', 'Narimanov', 'Binagadi'];
const LANGUAGES: Array<[name: string, code: string]> = [
  ['Azerbaijani', 'az'],
  ['English', 'en'],
  ['Russian', 'ru'],
  ['Turkish', 'tr'],
];
const CATEGORIES: Array<{ name: string; slug: string; subjects: Array<[string, string]> }> = [
  {
    name: 'Sciences',
    slug: 'sciences',
    subjects: [
      ['Mathematics', 'mathematics'],
      ['Physics', 'physics'],
      ['Chemistry', 'chemistry'],
    ],
  },
  {
    name: 'Languages',
    slug: 'languages',
    subjects: [
      ['English', 'english'],
      ['Russian Language', 'russian-language'],
    ],
  },
];
const PLANS: Array<{ tier: PlanTier; name: string; priceMonthly: number }> = [
  { tier: PlanTier.FREE, name: 'Free', priceMonthly: 0 },
  { tier: PlanTier.PRO, name: 'Pro', priceMonthly: 19.99 },
];

// Baseline platform configuration (#70) so the admin Settings section is
// populated on a fresh install. Each is a starting point admins can tune.
const FEATURE_FLAGS: Array<{
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
}> = [
  {
    key: 'tutor_instant_booking',
    description: 'Let students book a lesson slot without a tutor confirmation step.',
    enabled: false,
    rolloutPercentage: 0,
  },
  {
    key: 'in_app_payments',
    description: 'Master switch for in-app subscription checkout.',
    enabled: true,
    rolloutPercentage: 100,
  },
  {
    key: 'ai_tutor_matching',
    description: 'Rank search results with the experimental matching model.',
    enabled: true,
    rolloutPercentage: 25,
  },
];

const SYSTEM_SETTINGS: Array<{ key: string; value: Prisma.InputJsonValue; description: string }> = [
  {
    key: 'support_email',
    value: 'support@tutora.app',
    description: 'Address shown to users for help and disputes.',
  },
  {
    key: 'max_active_applications_default',
    value: 3,
    description: 'Fallback cap on a student’s concurrent applications when no plan applies.',
  },
  {
    key: 'maintenance_mode',
    value: { enabled: false, message: '' },
    description: 'Toggle a read-only maintenance banner across the apps.',
  },
];

async function main(): Promise<void> {
  for (const name of DISTRICTS) {
    const slug = name.toLowerCase();
    await prisma.district.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  for (const [name, code] of LANGUAGES) {
    await prisma.language.upsert({ where: { code }, update: {}, create: { name, code } });
  }

  for (const category of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { name: category.name, slug: category.slug },
    });
    for (const [subjectName, subjectSlug] of category.subjects) {
      await prisma.subject.upsert({
        where: { slug: subjectSlug },
        update: { categoryId: created.id },
        create: { name: subjectName, slug: subjectSlug, categoryId: created.id },
      });
    }
  }

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: { name: plan.name, priceMonthly: plan.priceMonthly },
      create: { tier: plan.tier, name: plan.name, priceMonthly: plan.priceMonthly },
    });
  }

  for (const flag of FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }

  for (const setting of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(
    'Seed complete: districts, languages, categories, subjects, plans, feature flags, settings.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
