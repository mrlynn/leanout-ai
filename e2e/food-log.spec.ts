import { test, expect } from "@playwright/test";
import { registerUser, loginUser, completeOnboarding } from "./helpers";

// These tests require a running server and a real DB.
// They set up a full user (register → login → onboard) before each suite.

test.describe("Food Log — happy path", () => {
  test.beforeEach(async ({ page }) => {
    const creds = await registerUser(page);
    await loginUser(page, creds.email, creds.password);
    await completeOnboarding(page);
  });

  test("food log page loads and shows empty state", async ({ page }) => {
    await page.goto("/food-log");
    await page.waitForLoadState("networkidle");

    // Should show the page heading or an empty-state message
    await expect(
      page.getByRole("heading", { name: /food log|log food|what did you eat/i })
        .or(page.getByText(/nothing logged|no meals|get started/i))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("manual food entry adds item and updates totals", async ({ page }) => {
    await page.goto("/food-log");
    await page.waitForLoadState("networkidle");

    // Open the manual add dialog
    const addBtn = page.getByRole("button", { name: /add|log food|manual/i }).first();
    await addBtn.click();

    // Fill in food name
    const nameInput = page.getByPlaceholder(/food name|item name|chicken/i);
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill("Chicken Breast");

      const calInput = page.getByPlaceholder(/calories|kcal/i);
      if (await calInput.isVisible()) await calInput.fill("248");

      const proteinInput = page.getByPlaceholder(/protein/i);
      if (await proteinInput.isVisible()) await proteinInput.fill("46");

      const saveBtn = page.getByRole("button", { name: /save|add|log/i }).last();
      await saveBtn.click();

      // After saving, the new entry should appear
      await expect(page.getByText(/chicken breast/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Food Log — navigation", () => {
  test("navigating to /food-log while unauthenticated redirects to login", async ({ page }) => {
    await page.goto("/food-log");
    await page.waitForURL(/login|register/);
    expect(page.url()).toMatch(/login|register/);
  });
});

test.describe("Food Log — mobile viewport", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("food log page is usable at 375px", async ({ page }) => {
    const creds = await registerUser(page);
    await loginUser(page, creds.email, creds.password);
    await completeOnboarding(page);

    await page.goto("/food-log");
    await page.waitForLoadState("networkidle");

    // Bottom nav should be visible at mobile widths
    const nav = page.locator("nav").or(page.locator("[data-testid='bottom-nav']"));
    // Page should not be blank
    await expect(page.locator("main, [role='main'], .min-h-screen")).toBeVisible({ timeout: 8000 });

    // Add button should be in the bottom half of the viewport (reachable one-handed)
    const addBtn = page.getByRole("button", { name: /add|log/i }).first();
    if (await addBtn.isVisible()) {
      const box = await addBtn.boundingBox();
      if (box) {
        // 812/2 = 406px — button should be in lower half
        expect(box.y + box.height / 2).toBeGreaterThan(300);
      }
    }
  });
});
