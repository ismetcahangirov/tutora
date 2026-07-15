import { describe, expect, it } from 'vitest';

import en from '@/messages/en.json';
import { FOOTER_COLUMNS, NAV_ITEMS, SECTION_IDS } from '../constants';

const navLabels = en.nav as Record<string, string>;
const footerColumns = en.footer.columns as Record<string, string>;
const footerLinks = en.footer.links as Record<string, string>;
const sectionIds = new Set<string>(Object.values(SECTION_IDS));

/** Anchor hrefs (`#id`) must target a known section; other hrefs are external. */
function anchorId(href: string): string | null {
  return href.startsWith('#') && href.length > 1 ? href.slice(1) : null;
}

describe('landing section ids', () => {
  it('are unique', () => {
    const values = Object.values(SECTION_IDS);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('header navigation', () => {
  it('every item has a label in the catalog and targets a real section', () => {
    for (const item of NAV_ITEMS) {
      expect(navLabels[item.labelKey], `nav.${item.labelKey}`).toBeTruthy();
      expect(sectionIds.has(anchorId(item.href) ?? '')).toBe(true);
    }
  });
});

describe('footer navigation', () => {
  it('column headings resolve in the catalog', () => {
    for (const column of FOOTER_COLUMNS) {
      expect(footerColumns[column.headingKey], `footer.columns.${column.headingKey}`).toBeTruthy();
    }
  });

  it('link labels resolve and on-page anchors target real sections', () => {
    for (const column of FOOTER_COLUMNS) {
      for (const link of column.links) {
        expect(footerLinks[link.labelKey], `footer.links.${link.labelKey}`).toBeTruthy();
        const id = anchorId(link.href);
        if (id) {
          expect(sectionIds.has(id), `${link.href} targets a section`).toBe(true);
        }
      }
    }
  });
});
