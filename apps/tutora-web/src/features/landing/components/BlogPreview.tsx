import { Clock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Card, Section, SectionHeading } from '@shared/components';

import { SECTION_IDS } from '../constants';
import type { BlogPost } from '../types';

const HEADING_ID = 'blog-heading';

/** Blog preview — curated post cards with a "coming soon" badge until the blog
 *  ships, so nothing implies a link that doesn't exist yet. */
export async function BlogPreview() {
  const t = await getTranslations('blog');
  const posts = t.raw('posts') as BlogPost[];

  return (
    <Section id={SECTION_IDS.blog} surface ariaLabelledby={HEADING_ID}>
      <SectionHeading
        id={HEADING_ID}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />
      <div className="mt-6 flex justify-center">
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
          {t('badge')}
        </span>
      </div>

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <li key={post.title}>
            <Card className="flex h-full flex-col gap-4">
              <div
                className="flex h-36 items-center justify-center rounded-md bg-primary-tint"
                aria-hidden
              >
                <span className="size-10 rounded-full bg-primary/20" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                {post.category}
              </span>
              <h3 className="text-lg font-semibold text-foreground text-balance">{post.title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="size-3.5" aria-hidden />
                {post.readingTime}
              </span>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
