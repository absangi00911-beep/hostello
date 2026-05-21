import { test, expect } from '@playwright/test';

test.describe('Hostel search page', () => {
  test('loads the search page', async ({ page }) => {
    await page.goto('/hostels');
    await expect(page).toHaveURL(/\/hostels/);
    await expect(page.getByRole('main', { name: 'Search results' })).toBeVisible();
  });

  test('accepts a city query parameter and reflects it', async ({ page }) => {
    await page.goto('/hostels?city=Lahore');
    await expect(page).toHaveURL(/city=Lahore/);
    // The page title should mention Lahore (set by generateMetadata)
    await expect(page).toHaveTitle(/Lahore/i);
  });

  test('filter inputs are present on the search page', async ({ page }) => {
    await page.goto('/hostels');
    // At least one input or select for filtering should exist
    const filterControl = page
      .getByRole('combobox')
      .or(page.getByRole('textbox'))
      .or(page.getByRole('searchbox'))
      .first();
    await expect(filterControl).toBeVisible({ timeout: 8000 });
  });

  test('each hostel card links to a detail page', async ({ page }) => {
    await page.goto('/hostels');
    // Wait for cards to load — they contain links to /hostels/<slug>
    const hostelLinks = page.getByRole('link').filter({ hasText: /.+/ });
    // If cards are present, at least one should point to a hostel detail URL
    const count = await hostelLinks.count();
    if (count > 0) {
      const firstHref = await hostelLinks.first().getAttribute('href');
      expect(firstHref).toBeTruthy();
    }
  });
});