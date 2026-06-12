import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Cookie Policy — LeanOut AI",
  description: "How LeanOut AI uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      subtitle="What cookies we use, why we use them, and how to control them."
      lastUpdated="June 12, 2026"
    >
      <p>
        This Cookie Policy explains how LeanOut AI (&quot;we,&quot; &quot;us&quot;) uses cookies and
        similar technologies when you visit leanout.app or use our web-based experience in the mobile app
        shell.
      </p>

      <h2>What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device by your browser. They help websites remember
        your session, preferences, and security settings. Similar technologies include local storage used
        for in-app preferences.
      </p>

      <h2>How we use cookies</h2>
      <p>
        LeanOut uses a <strong>minimal cookie footprint</strong>. We do not use advertising cookies,
        cross-site tracking pixels, or third-party analytics cookies (such as Google Analytics) at this
        time.
      </p>

      <h2>Cookies we set</h2>
      <table>
        <thead>
          <tr>
            <th>Cookie / storage</th>
            <th>Purpose</th>
            <th>Duration</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>authjs.session-token</code> (or equivalent NextAuth session cookie)
            </td>
            <td>Keeps you signed in securely after login</td>
            <td>Session or up to 30 days</td>
            <td>Strictly necessary</td>
          </tr>
          <tr>
            <td>
              <code>authjs.csrf-token</code>
            </td>
            <td>Protects login and form submissions from cross-site request forgery</td>
            <td>Session</td>
            <td>Strictly necessary</td>
          </tr>
          <tr>
            <td>
              <code>authjs.callback-url</code>
            </td>
            <td>Redirects you to the correct page after authentication</td>
            <td>Short-lived</td>
            <td>Strictly necessary</td>
          </tr>
          <tr>
            <td>
              <code>leanout-cookie-consent</code> (local storage)
            </td>
            <td>Remembers that you acknowledged this cookie notice</td>
            <td>Until cleared</td>
            <td>Preference</td>
          </tr>
        </tbody>
      </table>

      <h2>Third-party cookies</h2>
      <p>
        When you use optional features, third parties may set their own cookies in your browser:
      </p>
      <ul>
        <li>
          <strong>Stripe</strong> — if you start a Pro checkout, Stripe may set cookies required for
          fraud prevention and payment completion
        </li>
        <li>
          <strong>Google</strong> — if you choose &quot;Continue with Google,&quot; Google&apos;s OAuth
          flow may set cookies on google.com during sign-in
        </li>
      </ul>
      <p>We do not control third-party cookies. Review their privacy policies for details.</p>

      <h2>Local storage in the app</h2>
      <p>
        Beyond cookies, LeanOut stores some preferences in your browser&apos;s local storage (for
        example, grocery list checkboxes, dismissed install banners, and cookie consent). This data stays
        on your device and is not sent to our servers unless tied to a synced account feature.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          <strong>Essential cookies</strong> — required for sign-in. Blocking them will prevent the app
          from keeping you logged in.
        </li>
        <li>
          <strong>Browser controls</strong> — you can delete or block cookies in your browser settings.
          See your browser&apos;s help documentation for steps.
        </li>
        <li>
          <strong>Sign out</strong> — signing out ends your active session cookie.
        </li>
        <li>
          <strong>Cookie banner</strong> — on first visit, we show a notice explaining our use of
          essential cookies. Acknowledging it stores your preference in local storage.
        </li>
      </ul>

      <h2>Do Not Track</h2>
      <p>
        Because we do not run behavioral advertising trackers, we do not respond differently to Do Not
        Track signals today. If we add non-essential cookies in the future, we will update this policy
        and provide appropriate consent controls.
      </p>

      <h2>Updates</h2>
      <p>
        We will update this page if our cookie practices change. Check the date at the top for the latest
        version.
      </p>

      <h2>Contact</h2>
      <p>
        Cookie questions: <a href="mailto:contact@leanout.ai">contact@leanout.ai</a>. See also our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalPageShell>
  );
}
