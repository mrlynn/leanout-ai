import { test, expect } from "@playwright/test";
import { registerUser, loginUser, dismissCookieNotice, uniqueEmail } from "./helpers";

test.describe("Registration", () => {
  test("new user can register and is redirected to login", async ({ page }) => {
    const { email } = await registerUser(page);
    expect(page.url()).toContain("/login");
    await expect(page.getByText(/account created|registered|sign in/i)).toBeVisible();
  });

  test("duplicate email shows an error", async ({ page }) => {
    const { email, password, name } = await registerUser(page);

    // Try to register again with the same email
    await page.goto("/register");
    await dismissCookieNotice(page);
    await page.getByPlaceholder(/alex johnson/i).fill(name);
    await page.getByPlaceholder(/you@example\.com/i).fill(email);
    await page.getByPlaceholder(/min\. 8 characters|password/i).fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    // Should stay on register and show an error
    await expect(page.getByText(/already|exists|taken/i)).toBeVisible();
  });

  test("register form rejects empty submission", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /create account/i }).click();
    // Browser native validation or inline error — stays on register
    expect(page.url()).toContain("/register");
  });
});

test.describe("Login", () => {
  test("registered user can log in and reaches dashboard or onboarding", async ({ page }) => {
    const { email, password } = await registerUser(page);
    await loginUser(page, email, password);
    expect(page.url()).toMatch(/dashboard|onboarding/);
  });

  test("wrong password shows error and stays on login", async ({ page }) => {
    const { email } = await registerUser(page);

    await page.goto("/login");
    await dismissCookieNotice(page);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("WrongPassword999!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid|incorrect|wrong|password/i)).toBeVisible();
    expect(page.url()).toContain("/login");
  });

  test("unknown email shows error", async ({ page }) => {
    await page.goto("/login");
    await dismissCookieNotice(page);
    await page.getByLabel(/email/i).fill("nobody@leanout-test.invalid");
    await page.getByLabel(/password/i).fill("SomePass123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible();
  });

  test("unauthenticated access to /dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/login|register/);
    expect(page.url()).toMatch(/login|register/);
  });
});
