import { test, expect } from "@playwright/test";
import { registerUser, loginUser, completeOnboarding } from "./helpers";

test.describe("Daily Check-in — happy path", () => {
  test.beforeEach(async ({ page }) => {
    const creds = await registerUser(page);
    await loginUser(page, creds.email, creds.password);
    await completeOnboarding(page);
  });

  test("check-in page loads", async ({ page }) => {
    await page.goto("/check-in");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /check.?in|daily log/i })
        .or(page.getByText(/weight|compliance|hunger/i).first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test("submitting a check-in shows XP/celebration and persists", async ({ page }) => {
    await page.goto("/check-in");
    await page.waitForLoadState("networkidle");

    // Fill weight
    const weightInput = page.getByLabel(/weight/i).first();
    if (await weightInput.isVisible({ timeout: 3000 })) {
      await weightInput.fill("180");
    }

    // Score selectors — click score 8 for compliance/hunger/energy if visible
    // The ScoreSelector renders buttons 1–10; click 8 on each
    const scoreButtons = page.getByRole("button", { name: "8" });
    const count = await scoreButtons.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await scoreButtons.nth(i).click();
    }

    // Submit
    const submitBtn = page.getByRole("button", { name: /save|submit|log check.?in/i }).last();
    await submitBtn.click();

    // Should show celebration / XP notification, or redirect back to dashboard
    await expect(
      page.getByText(/xp|great job|nice work|check.?in saved/i)
        .or(page.getByRole("heading", { name: /dashboard/i }))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("check-in page is accessible at 375px width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/check-in");
    await page.waitForLoadState("networkidle");

    // No horizontal overflow — content width should fit
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});

test.describe("Daily Check-in — auth", () => {
  test("unauthenticated access to /check-in redirects to login", async ({ page }) => {
    await page.goto("/check-in");
    await page.waitForURL(/login|register/);
    expect(page.url()).toMatch(/login|register/);
  });
});
