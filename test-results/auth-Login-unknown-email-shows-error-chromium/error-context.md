# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Login >> unknown email shows error
- Location: e2e/auth.spec.ts:54:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/invalid|incorrect|wrong/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/invalid|incorrect|wrong/i)

```

```yaml
- img "LeanOut AI"
- text: LeanOut AI
- heading "Your AI physique coach is waiting." [level=2]
- paragraph: Personalized macros, meal plans, and coaching — all tailored to your exact goals.
- paragraph: Built for people who are serious about results.
- heading "Welcome back" [level=1]
- paragraph: Sign in to your account
- text: Email
- textbox "Email":
  - /placeholder: you@example.com
- text: Password
- link "Forgot password?":
  - /url: /forgot-password
- textbox "Password"
- button "Sign in"
- button "Continue with Google"
- paragraph:
  - text: No account?
  - link "Create one free":
    - /url: /register
- paragraph:
  - text: By signing in, you agree to our
  - link "Terms & License":
    - /url: /license
  - text: and
  - link "Privacy Policy":
    - /url: /privacy
  - text: .
- navigation "Legal":
  - link "Privacy":
    - /url: /privacy
  - link "Terms & License":
    - /url: /license
  - link "Cookies":
    - /url: /cookies
- alert
- dialog "Cookie notice":
  - paragraph: Cookies on LeanOut AI
  - paragraph:
    - text: We use essential cookies to keep you signed in and secure your session. We do not use advertising or analytics cookies.
    - link "Cookie Policy":
      - /url: /cookies
  - button "Got it"
  - link "Learn more":
    - /url: /cookies
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { registerUser, loginUser, dismissCookieNotice, uniqueEmail } from "./helpers";
  3  | 
  4  | test.describe("Registration", () => {
  5  |   test("new user can register and is redirected to login", async ({ page }) => {
  6  |     const { email } = await registerUser(page);
  7  |     expect(page.url()).toContain("/login");
  8  |     await expect(page.getByText(/account created|registered|sign in/i)).toBeVisible();
  9  |   });
  10 | 
  11 |   test("duplicate email shows an error", async ({ page }) => {
  12 |     const { email, password, name } = await registerUser(page);
  13 | 
  14 |     // Try to register again with the same email
  15 |     await page.goto("/register");
  16 |     await dismissCookieNotice(page);
  17 |     await page.getByPlaceholder(/alex johnson/i).fill(name);
  18 |     await page.getByPlaceholder(/you@example\.com/i).fill(email);
  19 |     await page.getByPlaceholder(/min\. 8 characters|password/i).fill(password);
  20 |     await page.getByRole("button", { name: /create account/i }).click();
  21 | 
  22 |     // Should stay on register and show an error
  23 |     await expect(page.getByText(/already|exists|taken/i)).toBeVisible();
  24 |   });
  25 | 
  26 |   test("register form rejects empty submission", async ({ page }) => {
  27 |     await page.goto("/register");
  28 |     await page.getByRole("button", { name: /create account/i }).click();
  29 |     // Browser native validation or inline error — stays on register
  30 |     expect(page.url()).toContain("/register");
  31 |   });
  32 | });
  33 | 
  34 | test.describe("Login", () => {
  35 |   test("registered user can log in and reaches dashboard or onboarding", async ({ page }) => {
  36 |     const { email, password } = await registerUser(page);
  37 |     await loginUser(page, email, password);
  38 |     expect(page.url()).toMatch(/dashboard|onboarding/);
  39 |   });
  40 | 
  41 |   test("wrong password shows error and stays on login", async ({ page }) => {
  42 |     const { email } = await registerUser(page);
  43 | 
  44 |     await page.goto("/login");
  45 |     await dismissCookieNotice(page);
  46 |     await page.getByLabel(/email/i).fill(email);
  47 |     await page.getByLabel(/password/i).fill("WrongPassword999!");
  48 |     await page.getByRole("button", { name: /sign in/i }).click();
  49 | 
  50 |     await expect(page.getByText(/invalid|incorrect|wrong|password/i)).toBeVisible();
  51 |     expect(page.url()).toContain("/login");
  52 |   });
  53 | 
  54 |   test("unknown email shows error", async ({ page }) => {
  55 |     await page.goto("/login");
  56 |     await dismissCookieNotice(page);
  57 |     await page.getByLabel(/email/i).fill("nobody@leanout-test.invalid");
  58 |     await page.getByLabel(/password/i).fill("SomePass123!");
  59 |     await page.getByRole("button", { name: /sign in/i }).click();
  60 | 
> 61 |     await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  62 |   });
  63 | 
  64 |   test("unauthenticated access to /dashboard redirects to login", async ({ page }) => {
  65 |     await page.goto("/dashboard");
  66 |     await page.waitForURL(/login|register/);
  67 |     expect(page.url()).toMatch(/login|register/);
  68 |   });
  69 | });
  70 | 
```