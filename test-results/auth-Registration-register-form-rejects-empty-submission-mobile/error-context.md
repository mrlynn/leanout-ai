# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Registration >> register form rejects empty submission
- Location: e2e/auth.spec.ts:26:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /create account/i })
    - locator resolved to <button tabindex="0" type="submit" data-slot="button" class="group/button inline-flex shrink-0 items-center justify-center border-transparent bg-clip-padding whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-inval…>Create account →</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">…</p> from <div role="dialog" aria-label="Cookie notice" class="fixed bottom-20 inset-x-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md md:p-0">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="text-sm font-bold">Cookies on LeanOut AI</p> from <div role="dialog" aria-label="Cookie notice" class="fixed bottom-20 inset-x-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md md:p-0">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    14 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p class="text-sm font-bold">Cookies on LeanOut AI</p> from <div role="dialog" aria-label="Cookie notice" class="fixed bottom-20 inset-x-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md md:p-0">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">…</p> from <div role="dialog" aria-label="Cookie notice" class="fixed bottom-20 inset-x-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md md:p-0">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p class="text-sm font-bold">Cookies on LeanOut AI</p> from <div role="dialog" aria-label="Cookie notice" class="fixed bottom-20 inset-x-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md md:p-0">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p class="text-sm font-bold">Cookies on LeanOut AI</p> from <div role="dialog" aria-label="Cookie notice" class="fixed bottom-20 inset-x-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md md:p-0">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p class="text-sm font-bold">Cookies on LeanOut AI</p> from <div role="dialog" aria-label="Cookie notice" class="fixed bottom-20 inset-x-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md md:p-0">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img "LeanOut AI" [ref=e6]
      - generic [ref=e7]: LeanOut AI
    - generic [ref=e8]:
      - heading "Create your account" [level=1] [ref=e9]
      - paragraph [ref=e10]: Start your LeanOut journey today
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Full name
        - textbox "Alex Johnson" [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]: Email
        - textbox "you@example.com" [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e19]: Password
        - textbox "Min. 8 characters" [ref=e20]
      - button "Create account →" [ref=e21]
    - paragraph [ref=e22]:
      - text: Already have an account?
      - link "Sign in" [ref=e23]:
        - /url: /login
    - paragraph [ref=e24]:
      - text: By creating an account, you agree to our
      - link "Terms & License" [ref=e25]:
        - /url: /license
      - text: and
      - link "Privacy Policy" [ref=e26]:
        - /url: /privacy
      - text: .
    - navigation "Legal" [ref=e27]:
      - link "Privacy" [ref=e29]:
        - /url: /privacy
      - link "Terms & License" [ref=e31]:
        - /url: /license
      - link "Cookies" [ref=e33]:
        - /url: /cookies
  - button "Open Next.js Dev Tools" [ref=e39] [cursor=pointer]:
    - img [ref=e40]
  - alert [ref=e45]
  - dialog "Cookie notice" [ref=e46]:
    - generic [ref=e47]:
      - paragraph [ref=e48]: Cookies on LeanOut AI
      - paragraph [ref=e49]:
        - text: We use essential cookies to keep you signed in and secure your session. We do not use advertising or analytics cookies.
        - link "Cookie Policy" [ref=e50]:
          - /url: /cookies
      - generic [ref=e51]:
        - button "Got it" [ref=e52]
        - link "Learn more" [ref=e53]:
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
> 28 |     await page.getByRole("button", { name: /create account/i }).click();
     |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
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