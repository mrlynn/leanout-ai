# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Registration >> new user can register and is redirected to login
- Location: e2e/auth.spec.ts:5:7

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
- generic [ref=e1]:
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
        - textbox "Alex Johnson" [ref=e14]: E2E User
      - generic [ref=e15]:
        - generic [ref=e16]: Email
        - textbox "you@example.com" [ref=e17]: e2e-1781466211416-6880@leanout-test.invalid
      - generic [ref=e18]:
        - generic [ref=e19]: Password
        - textbox "Min. 8 characters" [active] [ref=e20]: TestPass123!
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
  1  | import { type Page } from "@playwright/test";
  2  | 
  3  | /** A unique email for each test run so parallel runs don't collide. */
  4  | export function uniqueEmail() {
  5  |   return `e2e-${Date.now()}-${Math.floor(Math.random() * 9999)}@leanout-test.invalid`;
  6  | }
  7  | 
  8  | /** Dismiss the cookie notice dialog if it's present. */
  9  | export async function dismissCookieNotice(page: Page) {
  10 |   const gotIt = page.getByRole("button", { name: /got it/i });
  11 |   if (await gotIt.isVisible({ timeout: 2000 }).catch(() => false)) {
  12 |     await gotIt.click();
  13 |   }
  14 | }
  15 | 
  16 | /** Register a new user via the UI and return their credentials. */
  17 | export async function registerUser(page: Page, name = "E2E User") {
  18 |   const email = uniqueEmail();
  19 |   const password = "TestPass123!";
  20 | 
  21 |   await page.goto("/register");
  22 |   await dismissCookieNotice(page);
  23 |   // Register inputs have no htmlFor/id binding — target by placeholder
  24 |   await page.getByPlaceholder(/alex johnson/i).fill(name);
  25 |   await page.getByPlaceholder(/you@example\.com/i).fill(email);
  26 |   await page.getByPlaceholder(/min\. 8 characters|password/i).fill(password);
> 27 |   await page.getByRole("button", { name: /create account/i }).click();
     |                                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  28 | 
  29 |   // Should redirect to /login?registered=1
  30 |   await page.waitForURL(/login/);
  31 | 
  32 |   return { email, password, name };
  33 | }
  34 | 
  35 | /** Log in via the UI. Waits until redirected away from /login. */
  36 | export async function loginUser(page: Page, email: string, password: string) {
  37 |   await page.goto("/login");
  38 |   await dismissCookieNotice(page);
  39 |   await page.getByLabel(/email/i).fill(email);
  40 |   await page.getByLabel(/password/i).fill(password);
  41 |   await page.getByRole("button", { name: /sign in/i }).click();
  42 |   // Wait for the redirect to dashboard or onboarding
  43 |   await page.waitForURL(/dashboard|onboarding/);
  44 | }
  45 | 
  46 | /** Complete the minimum onboarding steps to reach the dashboard. */
  47 | export async function completeOnboarding(page: Page) {
  48 |   // Wait until we're on onboarding (dashboard redirect lands here for new users)
  49 |   if (!page.url().includes("onboarding")) {
  50 |     await page.waitForURL(/onboarding/);
  51 |   }
  52 | 
  53 |   // Step through the onboarding wizard.
  54 |   // Each step has a "Continue" / "Next" button. We fill required fields and proceed.
  55 |   // Step 1: basic stats
  56 |   const weightInput = page.getByLabel(/current weight/i);
  57 |   if (await weightInput.isVisible()) {
  58 |     await weightInput.fill("180");
  59 |   }
  60 | 
  61 |   const heightFt = page.getByLabel(/feet/i);
  62 |   if (await heightFt.isVisible()) await heightFt.fill("5");
  63 |   const heightIn = page.getByLabel(/inches/i);
  64 |   if (await heightIn.isVisible()) await heightIn.fill("10");
  65 | 
  66 |   const ageInput = page.getByLabel(/age/i);
  67 |   if (await ageInput.isVisible()) await ageInput.fill("28");
  68 | 
  69 |   const bodyFat = page.getByLabel(/body fat/i);
  70 |   if (await bodyFat.isVisible()) await bodyFat.fill("20");
  71 | 
  72 |   // Click through remaining steps until we reach /dashboard
  73 |   let maxSteps = 10;
  74 |   while (!page.url().includes("dashboard") && maxSteps-- > 0) {
  75 |     const nextBtn = page.getByRole("button", { name: /continue|next|get started|finish/i }).first();
  76 |     if (await nextBtn.isVisible()) {
  77 |       await nextBtn.click();
  78 |       await page.waitForTimeout(300);
  79 |     } else {
  80 |       break;
  81 |     }
  82 |   }
  83 | 
  84 |   await page.waitForURL(/dashboard/);
  85 | }
  86 | 
```