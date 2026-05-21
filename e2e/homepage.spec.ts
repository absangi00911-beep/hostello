import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads with correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HostelLo/i);
  });

  test('hero section is visible', async ({ page }) => {
    await page.goto('/');
    // The HeroSearch component renders inside the hero — its search input is the anchor
    const searchInput = page.getByRole('searchbox').or(
      page.getByPlaceholder(/city|search|hostel/i)
    );
    await expect(searchInput.first()).toBeVisible();
  });

  test('navigation contains a link to hostels search', async ({ page }) => {
    await page.goto('/');
    const hostelsLink = page.getByRole('link', { name: /find hostels|browse|hostels/i }).first();
    await expect(hostelsLink).toBeVisible();
  });

  test('navigating to /hostels from homepage works', async ({ page }) => {
    await page.goto('/');
    await page.goto('/hostels');
    await expect(page).toHaveURL(/\/hostels/);
    await expect(page.getByRole('main', { name: 'Search results' })).toBeVisible();
  });
});