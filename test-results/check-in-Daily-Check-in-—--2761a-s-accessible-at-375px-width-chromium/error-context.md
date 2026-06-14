# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: check-in.spec.ts >> Daily Check-in — happy path >> check-in page is accessible at 375px width
- Location: e2e/check-in.spec.ts:50:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
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
        - heading "Build the physique you've been chasing." [level=2] [ref=e8]:
          - text: Build the physique
          - text: you've been chasing.
        - paragraph [ref=e9]: Set your goal, get your macros, follow your plan. It's that direct.
      - paragraph [ref=e10]: Free to start. Powered by AI.
    - generic [ref=e12]:
      - generic [ref=e13]:
        - heading "Create your account" [level=1] [ref=e14]
        - paragraph [ref=e15]: Start your LeanOut journey today
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Full name
          - textbox "Alex Johnson" [ref=e19]: E2E User
        - generic [ref=e20]:
          - generic [ref=e21]: Email
          - textbox "you@example.com" [ref=e22]: e2e-1781466087076-606@leanout-test.invalid
        - generic [ref=e23]:
          - generic [ref=e24]: Password
          - textbox "Min. 8 characters" [ref=e25]: TestPass123!
        - generic [ref=e26]: Too many registration attempts. Try again later.
        - button "Create account →" [ref=e27]
      - paragraph [ref=e28]:
        - text: Already have an account?
        - link "Sign in" [ref=e29] [cursor=pointer]:
          - /url: /login
      - paragraph [ref=e30]:
        - text: By creating an account, you agree to our
        - link "Terms & License" [ref=e31] [cursor=pointer]:
          - /url: /license
        - text: and
        - link "Privacy Policy" [ref=e32] [cursor=pointer]:
          - /url: /privacy
        - text: .
      - navigation "Legal" [ref=e33]:
        - link "Privacy" [ref=e35] [cursor=pointer]:
          - /url: /privacy
        - generic [ref=e36]:
          - generic [ref=e37]: "|"
          - link "Terms & License" [ref=e38] [cursor=pointer]:
            - /url: /license
        - generic [ref=e39]:
          - generic [ref=e40]: "|"
          - link "Cookies" [ref=e41] [cursor=pointer]:
            - /url: /cookies
  - button "Open Next.js Dev Tools" [ref=e47] [cursor=pointer]:
    - img [ref=e48]
  - alert [ref=e51]
  - dialog "Cookie notice" [ref=e52]:
    - generic [ref=e53]:
      - paragraph [ref=e54]: Cookies on LeanOut AI
      - paragraph [ref=e55]:
        - text: We use essential cookies to keep you signed in and secure your session. We do not use advertising or analytics cookies.
        - link "Cookie Policy" [ref=e56] [cursor=pointer]:
          - /url: /cookies
      - generic [ref=e57]:
        - button "Got it" [ref=e58]
        - link "Learn more" [ref=e59] [cursor=pointer]:
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
  27 |   await page.getByRole("button", { name: /create account/i }).click();
  28 | 
  29 |   // Should redirect to /login?registered=1
> 30 |   await page.waitForURL(/login/);
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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