import { expect, test } from '@playwright/test';

/**
 * Critical landing-page journeys (issue #98). These run against the production
 * build, so they double as a smoke test that the SSG output renders, next-intl
 * locale routing works, and the key conversion paths are present.
 */
test.describe('Landing page', () => {
  test('renders the hero and primary calls to action', async ({ page }) => {
    await page.goto('/en');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Find the right tutor, fast' }),
    ).toBeVisible();

    // Both hero CTAs are on-page anchors to the app-download and tutors sections.
    const hero = page.locator('#hero');
    await expect(hero.getByRole('link', { name: 'Find a tutor' })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Become a tutor' })).toBeVisible();
  });

  test('redirects the bare path to a locale-prefixed home', async ({ page }) => {
    await page.goto('/');

    // The middleware negotiates the locale from Accept-Language, so assert the
    // invariant rather than a specific locale: it lands on a prefixed home and
    // the document language matches the chosen prefix.
    await expect(page).toHaveURL(/\/(az|en|ru)$/);
    const locale = new URL(page.url()).pathname.replace('/', '');
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
  });

  test('header navigation jumps to the FAQ section', async ({ page }) => {
    await page.goto('/en');

    // Scope to the header so we don't match the duplicate FAQ link in the footer.
    await page.getByRole('banner').getByRole('link', { name: 'FAQ' }).click();

    await expect(page).toHaveURL(/#faq$/);
    await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible();
  });

  test('FAQ accordion reveals an answer on click', async ({ page }) => {
    await page.goto('/en');

    const firstItem = page.locator('#faq details').first();
    const answer = firstItem.getByText('Every tutor completes identity verification');

    // Native <details>: the answer is collapsed until the summary is clicked.
    await expect(answer).toBeHidden();
    await firstItem.locator('summary').click();
    await expect(answer).toBeVisible();
  });

  test('language switcher changes the active locale', async ({ page }) => {
    await page.goto('/en');

    await page.getByRole('button', { name: 'Select language' }).click();
    // Menu items are labelled with each language's native name, so the selector
    // is stable regardless of the current locale.
    await page.getByRole('menuitem', { name: 'Русский' }).click();

    await expect(page).toHaveURL(/\/ru$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  });

  test('footer is present with the brand tagline', async ({ page }) => {
    await page.goto('/en');

    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    await expect(footer.getByText('Find a trusted tutor in minutes')).toBeVisible();
  });
});
