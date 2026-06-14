import { type Page } from "@playwright/test";

/** A unique email for each test run so parallel runs don't collide. */
export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 9999)}@leanout-test.invalid`;
}

/** Dismiss the cookie notice dialog if it's present. */
export async function dismissCookieNotice(page: Page) {
  const gotIt = page.getByRole("button", { name: /got it/i });
  if (await gotIt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await gotIt.click();
  }
}

/** Register a new user via the UI and return their credentials. */
export async function registerUser(page: Page, name = "E2E User") {
  const email = uniqueEmail();
  const password = "TestPass123!";

  await page.goto("/register");
  await dismissCookieNotice(page);
  // Register inputs have no htmlFor/id binding — target by placeholder
  await page.getByPlaceholder(/alex johnson/i).fill(name);
  await page.getByPlaceholder(/you@example\.com/i).fill(email);
  await page.getByPlaceholder(/min\. 8 characters|password/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();

  // Should redirect to /login?registered=1
  await page.waitForURL(/login/);

  return { email, password, name };
}

/** Log in via the UI. Waits until redirected away from /login. */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto("/login");
  await dismissCookieNotice(page);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for the redirect to dashboard or onboarding
  await page.waitForURL(/dashboard|onboarding/);
}

/** Complete the minimum onboarding steps to reach the dashboard. */
export async function completeOnboarding(page: Page) {
  // Wait until we're on onboarding (dashboard redirect lands here for new users)
  if (!page.url().includes("onboarding")) {
    await page.waitForURL(/onboarding/);
  }

  // Step through the onboarding wizard.
  // Each step has a "Continue" / "Next" button. We fill required fields and proceed.
  // Step 1: basic stats
  const weightInput = page.getByLabel(/current weight/i);
  if (await weightInput.isVisible()) {
    await weightInput.fill("180");
  }

  const heightFt = page.getByLabel(/feet/i);
  if (await heightFt.isVisible()) await heightFt.fill("5");
  const heightIn = page.getByLabel(/inches/i);
  if (await heightIn.isVisible()) await heightIn.fill("10");

  const ageInput = page.getByLabel(/age/i);
  if (await ageInput.isVisible()) await ageInput.fill("28");

  const bodyFat = page.getByLabel(/body fat/i);
  if (await bodyFat.isVisible()) await bodyFat.fill("20");

  // Click through remaining steps until we reach /dashboard
  let maxSteps = 10;
  while (!page.url().includes("dashboard") && maxSteps-- > 0) {
    const nextBtn = page.getByRole("button", { name: /continue|next|get started|finish/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    } else {
      break;
    }
  }

  await page.waitForURL(/dashboard/);
}
