import { expect, test } from '@playwright/test';

const LOGIN_HEADING_EN = 'Sign in to Tutora Admin';

/**
 * Critical admin journeys that need no backend (issue #98): the route guard
 * fails closed to the sign-in screen, the public login screen renders, and the
 * global i18n + theme controls work. Authenticated flows depend on the API and
 * are out of scope for this suite.
 */
test.describe('Admin auth gate', () => {
  test('redirects an unauthenticated visitor to the sign-in screen', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: LOGIN_HEADING_EN })).toBeVisible();
  });

  test('redirects a deep link into a protected section to sign-in', async ({ page }) => {
    await page.goto('/users');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: LOGIN_HEADING_EN })).toBeVisible();
  });

  test('renders the sign-in screen with the admin-only notice', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: LOGIN_HEADING_EN })).toBeVisible();
    await expect(
      page.getByText('Use your administrator Google account to continue.'),
    ).toBeVisible();
    await expect(page.getByText('Access is restricted to Tutora administrators.')).toBeVisible();
    // With no Google client ID configured the button degrades to a clear notice
    // instead of a dead area.
    await expect(page.getByText('Google sign-in is not configured.')).toBeVisible();
  });
});

test.describe('Admin login controls', () => {
  test('switches the interface language', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Select language' }).click();
    // Radio items are labelled with each language's autonym, so the selector is
    // stable across the active locale.
    await page.getByRole('menuitemradio', { name: 'Русский' }).click();

    await expect(page.getByRole('heading', { name: 'Вход в Tutora Admin' })).toBeVisible();
  });

  test('applies the dark theme', async ({ page }) => {
    await page.goto('/login');

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/\bdark\b/);

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.getByRole('menuitemradio', { name: 'Dark' }).click();

    await expect(html).toHaveClass(/\bdark\b/);
  });
});
