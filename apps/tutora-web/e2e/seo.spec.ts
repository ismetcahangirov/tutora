import { expect, test } from '@playwright/test';

/**
 * SEO guarantees for the landing site (issue #98) — the landing epic's whole
 * point is discoverability, so metadata, crawler directives, and structured
 * data are treated as critical paths.
 */
test.describe('SEO', () => {
  test('exposes localized title, description, and canonical', async ({ page }) => {
    await page.goto('/en');

    await expect(page).toHaveTitle('Tutora — Find a trusted tutor in minutes');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Tutora connects students and parents with verified tutors/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en$/);
  });

  test('emits Organization and FAQPage structured data', async ({ page }) => {
    await page.goto('/en');

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const combined = jsonLd.join('\n');

    expect(combined).toContain('"@type":"Organization"');
    expect(combined).toContain('"@type":"FAQPage"');
  });

  test('serves an allow-all robots.txt pointing at the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Allow: /');
    expect(body).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/);
  });

  test('serves a sitemap with one entry per locale', async ({ request }) => {
    const response = await request.get('/sitemap.xml');

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<urlset');
    // Default locale (az) is unprefixed; en/ru carry their prefix.
    expect(body).toContain('/en</loc>');
    expect(body).toContain('/ru</loc>');
  });
});
