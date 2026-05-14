import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic site functionality
 * Run: npm run test:e2e
 */

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Should load without errors
    await expect(page).toHaveTitle(/Peak Rentals/i);
  });

  test('browse page is accessible', async ({ page }) => {
    await page.goto('/browse');

    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('auth pages redirect unauthenticated users appropriately', async ({ page }) => {
    // Dashboard should redirect to login
    await page.goto('/dashboard');

    // Should either redirect to login or show auth required message
    await expect(page.url()).toMatch(/auth|login|signin/i);
  });

  test('API health check', async ({ request }) => {
    // Equipment endpoint should return JSON (even if empty)
    const response = await request.get('/api/equipment');

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('static assets load correctly', async ({ page }) => {
    await page.goto('/');

    // Check for CSS loading (page should have some styling)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check no major console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');

    // Filter out expected errors (like missing env vars in test)
    const criticalErrors = errors.filter(e =>
      !e.includes('NEXTAUTH') &&
      !e.includes('STRIPE')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Navigation', () => {
  test('main navigation links work', async ({ page }) => {
    await page.goto('/');

    // Check for nav elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('mobile navigation is responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('404 page for non-existent routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');

    // Should return 404 or show error page
    expect(response?.status()).toBe(404);
  });

  test('API returns proper error for bad requests', async ({ request }) => {
    // Try to access protected endpoint without auth
    const response = await request.get('/api/peaks/balance');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});
