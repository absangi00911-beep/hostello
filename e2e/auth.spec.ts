import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  });

  test('submit button is present', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page
      .getByRole('button', { name: /sign in|log in|login/i })
      .first();
    await expect(submitBtn).toBeVisible();
  });

  test('empty form submission — button is disabled until fields are filled', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page
      .getByRole('button', { name: /sign in|log in|login/i })
      .first();
    // Login form disables submit until email + password are entered
    await expect(submitBtn).toBeDisabled();
  });

  test('invalid credentials show an error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('notauser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword123');
    const submitBtn = page
      .getByRole('button', { name: /sign in|log in|login/i })
      .first();
    await submitBtn.click();
    const errorMsg = page
      .getByRole('alert')
      .or(page.getByText(/incorrect|invalid|wrong|try again/i))
      .first();
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });

  test('register page is reachable from login', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page
      .getByRole('link', { name: /register|sign up|create account/i })
      .first();
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/\/(register|signup)/i);
  });
});