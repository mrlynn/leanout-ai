import { test, expect } from "@playwright/test";

test.describe("Share page", () => {
  test("invalid token shows 'link unavailable' without crashing", async ({ page }) => {
    await page.goto("/share/invalid-token-xyz");
    await page.waitForLoadState("networkidle");

    // Should render the error state, not a crash/blank page
    // Use .first() — two elements match the regex (heading + subtitle)
    await expect(
      page.getByText(/link unavailable|expired|revoked/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Page should not show a Next.js error overlay
    await expect(page.getByText(/application error|500|unhandled/i)).not.toBeVisible();
  });

  test("share page is accessible without authentication", async ({ page }) => {
    // Visiting a share URL should not redirect to login
    await page.goto("/share/any-token");
    // Stay on the share page (either loading, error, or data state)
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/share/");
  });
});
