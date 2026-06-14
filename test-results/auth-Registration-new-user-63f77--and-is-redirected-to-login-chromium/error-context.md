# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Registration >> new user can register and is redirected to login
- Location: e2e/auth.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/account created|registered|sign in/i)
Expected: visible
Error: strict mode violation: getByText(/account created|registered|sign in/i) resolved to 2 elements:
    1) <p class="text-muted-foreground mt-1">Sign in to your account</p> aka getByText('Sign in to your account')
    2) <button tabindex="0" type="submit" data-slot="button" class="group/button inline-flex shrink-0 items-center justify-center border-transparent bg-clip-padding whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-inval…>Sign in</button> aka getByRole('button', { name: 'Sign in' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/account created|registered|sign in/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - img "LeanOut AI" [ref=e15]
        - generic [ref=e16]: LeanOut AI
      - generic [ref=e17]:
        - heading "Your AI physique coach is waiting." [level=2] [ref=e18]:
          - text: Your AI physique
          - text: coach is waiting.
        - paragraph [ref=e19]: Personalized macros, meal plans, and coaching — all tailored to your exact goals.
      - paragraph [ref=e20]: Built for people who are serious about results.
    - generic [ref=e22]:
      - generic [ref=e23]:
        - heading "Welcome back" [level=1] [ref=e24]
        - paragraph [ref=e25]: Sign in to your account
      - generic [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]: Email
          - textbox "Email" [ref=e29]:
            - /placeholder: you@example.com
        - generic [ref=e30]:
          - generic [ref=e31]:
            - generic [ref=e32]: Password
            - link "Forgot password?" [ref=e33] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "Password" [ref=e34]
        - button "Sign in" [ref=e35]
      - button "Continue with Google" [ref=e36]
      - paragraph [ref=e37]:
        - text: No account?
        - link "Create one free" [ref=e38] [cursor=pointer]:
          - /url: /register
      - paragraph [ref=e39]:
        - text: By signing in, you agree to our
        - link "Terms & License" [ref=e40] [cursor=pointer]:
          - /url: /license
        - text: and
        - link "Privacy Policy" [ref=e41] [cursor=pointer]:
          - /url: /privacy
        - text: .
      - navigation "Legal" [ref=e42]:
        - link "Privacy" [ref=e44] [cursor=pointer]:
          - /url: /privacy
        - generic [ref=e45]:
          - generic [ref=e46]: "|"
          - link "Terms & License" [ref=e47] [cursor=pointer]:
            - /url: /license
        - generic [ref=e48]:
          - generic [ref=e49]: "|"
          - link "Cookies" [ref=e50] [cursor=pointer]:
            - /url: /cookies
  - dialog "Cookie notice" [ref=e51]:
    - generic [ref=e52]:
      - paragraph [ref=e53]: Cookies on LeanOut AI
      - paragraph [ref=e54]:
        - text: We use essential cookies to keep you signed in and secure your session. We do not use advertising or analytics cookies.
        - link "Cookie Policy" [ref=e55] [cursor=pointer]:
          - /url: /cookies
      - generic [ref=e56]:
        - button "Got it" [ref=e57]
        - link "Learn more" [ref=e58] [cursor=pointer]:
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
> 8  |     await expect(page.getByText(/account created|registered|sign in/i)).toBeVisible();
     |                                                                         ^ Error: expect(locator).toBeVisible() failed
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