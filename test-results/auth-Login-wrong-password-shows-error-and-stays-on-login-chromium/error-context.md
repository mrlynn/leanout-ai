# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Login >> wrong password shows error and stays on login
- Location: e2e/auth.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/invalid|incorrect|wrong|password/i)
Expected: visible
Error: strict mode violation: getByText(/invalid|incorrect|wrong|password/i) resolved to 2 elements:
    1) <label for="password" data-slot="label" class="flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-sm font-semibold">Password</label> aka getByText('Password', { exact: true })
    2) <a href="/forgot-password" class="text-xs font-semibold text-primary hover:underline">Forgot password?</a> aka getByRole('link', { name: 'Forgot password?' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/invalid|incorrect|wrong|password/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - img "LeanOut AI" [ref=e5]
        - generic [ref=e6]: LeanOut AI
      - generic [ref=e7]:
        - heading "Your AI physique coach is waiting." [level=2] [ref=e8]:
          - text: Your AI physique
          - text: coach is waiting.
        - paragraph [ref=e9]: Personalized macros, meal plans, and coaching — all tailored to your exact goals.
      - paragraph [ref=e10]: Built for people who are serious about results.
    - generic [ref=e12]:
      - generic [ref=e13]:
        - heading "Welcome back" [level=1] [ref=e14]
        - paragraph [ref=e15]: Sign in to your account
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Email
          - textbox "Email" [ref=e19]:
            - /placeholder: you@example.com
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]: Password
            - link "Forgot password?" [ref=e23] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "Password" [ref=e24]
        - button "Sign in" [ref=e25]
      - button "Continue with Google" [ref=e26]
      - paragraph [ref=e27]:
        - text: No account?
        - link "Create one free" [ref=e28] [cursor=pointer]:
          - /url: /register
      - paragraph [ref=e29]:
        - text: By signing in, you agree to our
        - link "Terms & License" [ref=e30] [cursor=pointer]:
          - /url: /license
        - text: and
        - link "Privacy Policy" [ref=e31] [cursor=pointer]:
          - /url: /privacy
        - text: .
      - navigation "Legal" [ref=e32]:
        - link "Privacy" [ref=e34] [cursor=pointer]:
          - /url: /privacy
        - generic [ref=e35]:
          - generic [ref=e36]: "|"
          - link "Terms & License" [ref=e37] [cursor=pointer]:
            - /url: /license
        - generic [ref=e38]:
          - generic [ref=e39]: "|"
          - link "Cookies" [ref=e40] [cursor=pointer]:
            - /url: /cookies
  - button "Open Next.js Dev Tools" [ref=e46] [cursor=pointer]:
    - img [ref=e47]
  - alert [ref=e50]
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
> 50 |     await expect(page.getByText(/invalid|incorrect|wrong|password/i)).toBeVisible();
     |                                                                       ^ Error: expect(locator).toBeVisible() failed
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
  61 |     await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible();
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