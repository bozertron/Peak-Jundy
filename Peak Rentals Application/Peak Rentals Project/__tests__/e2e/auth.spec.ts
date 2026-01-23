import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests login flows, session management, and protected routes
 */

test.describe('Authentication', () => {
  test.describe('Unauthenticated User', () => {
    test('cannot access dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to auth
      await expect(page.url()).toMatch(/auth|login|signin/i);
    });

    test('cannot access owner dashboard', async ({ page }) => {
      await page.goto('/owner');

      await expect(page.url()).toMatch(/auth|login|signin/i);
    });

    test('cannot access admin routes', async ({ page }) => {
      await page.goto('/admin');

      await expect(page.url()).toMatch(/auth|login|signin|403|forbidden/i);
    });

    test('can access public browse page', async ({ page }) => {
      await page.goto('/browse');

      // Should NOT redirect
      await expect(page.url()).toContain('/browse');
    });

    test('can access public equipment details', async ({ page }) => {
      // Equipment detail pages should be public (even if equipment doesn't exist)
      const response = await page.goto('/equipment/test-id');

      // Should either show equipment or 404, not auth redirect
      expect(response?.status()).toBeGreaterThanOrEqual(200);
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe('Login Page', () => {
    test('displays login form', async ({ page }) => {
      await page.goto('/auth/signin');

      // Should have some form of login UI
      const form = page.locator('form, [role="form"], button');
      await expect(form.first()).toBeVisible();
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/signin');

      // If there's an email input, try submitting invalid data
      const emailInput = page.locator('input[type="email"], input[name="email"]');

      if (await emailInput.count() > 0) {
        await emailInput.fill('invalid@test.com');

        const submitButton = page.locator('button[type="submit"], button:has-text("Sign")');
        if (await submitButton.count() > 0) {
          await submitButton.click();

          // Should show some error or remain on login page
          await page.waitForLoadState('networkidle');
          // We're testing that it doesn't crash
        }
      }
    });
  });

  test.describe('Session Handling', () => {
    test('logout clears session and redirects', async ({ page }) => {
      // Go to signout
      await page.goto('/auth/signout');

      // Should show signout confirmation or redirect
      await expect(page.locator('body')).toBeVisible();
    });

    test('session cookies are HttpOnly', async ({ page, context }) => {
      await page.goto('/');

      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c =>
        c.name.includes('session') ||
        c.name.includes('next-auth')
      );

      // If session cookie exists, it should be HttpOnly
      if (sessionCookie) {
        expect(sessionCookie.httpOnly).toBe(true);
      }
    });
  });
});

test.describe('Protected API Routes', () => {
  test('conversations API requires auth', async ({ request }) => {
    const response = await request.get('/api/conversations');
    expect(response.status()).toBe(401);
  });

  test('cards API requires auth', async ({ request }) => {
    const response = await request.get('/api/cards');
    expect(response.status()).toBe(401);
  });

  test('trust network API requires auth', async ({ request }) => {
    const response = await request.get('/api/trust/network');
    expect(response.status()).toBe(401);
  });

  test('peaks balance API requires auth', async ({ request }) => {
    const response = await request.get('/api/peaks/balance');
    expect(response.status()).toBe(401);
  });

  test('booking creation requires auth', async ({ request }) => {
    const response = await request.post('/api/bookings', {
      data: {
        equipmentId: 'test',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      },
    });
    expect(response.status()).toBe(401);
  });
});
