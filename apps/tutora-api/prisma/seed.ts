import { PlanTier, PrismaClient } from '@prisma/client';

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

  console.log('Seed complete: districts, languages, categories, subjects, plans.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
