import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — LeanOut AI",
  description: "How LeanOut AI collects, uses, and protects your personal and health-related data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="How we handle your account, health data, and AI interactions."
      lastUpdated="June 12, 2026"
    >
      <p>
        LeanOut AI (&quot;LeanOut,&quot; &quot;we,&quot; &quot;us&quot;) is operated by Michael Lynn. This Privacy
        Policy explains what information we collect when you use leanout.app and our native mobile apps,
        how we use it, and the choices you have.
      </p>

      <h2>Information we collect</h2>
      <h3>Account information</h3>
      <p>
        When you register, we collect your name, email address, and a hashed password. If you sign in
        with Google, we receive your Google profile identifier and email from Google&apos;s OAuth service.
      </p>

      <h3>Profile and physique data</h3>
      <p>
        During onboarding and in Settings, you may provide age, sex, height, weight, activity level,
        physique goal, dietary preferences, and calculated macro targets. This data powers your dashboard,
        meal plans, and coaching experience.
      </p>

      <h3>Health and fitness activity</h3>
      <p>
        You may log daily check-ins (weight, steps, hunger, energy, compliance scores, workout notes),
        food diary entries, workout sessions, progress photos, and gamification progress (XP, badges,
        streaks). On supported mobile devices, you may optionally connect Apple Health or Health Connect
        to import steps and weight.
      </p>

      <h3>AI interactions</h3>
      <p>
        Messages you send to the AI Coach, meal-plan generation requests, food photo and voice logging
        inputs, and workout plan prompts are transmitted to our AI providers for processing. Food photos
        submitted for recognition are analyzed in real time and are not stored on our servers after
        analysis.
      </p>

      <h3>Payment information</h3>
      <p>
        If you subscribe to LeanOut Pro, payment is processed by Stripe. We receive your subscription
        status and Stripe customer identifier. We do not store full card numbers on our servers.
      </p>

      <h3>Technical data</h3>
      <p>
        We collect standard server logs (IP address, browser or app user agent, request timestamps) for
        security and reliability. Session cookies keep you signed in. See our{" "}
        <a href="/cookies">Cookie Policy</a> for details.
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>Provide and personalize the coaching, logging, and progress features you use</li>
        <li>Generate meal plans, workout suggestions, and AI coach responses tailored to your profile</li>
        <li>Calculate macros, adaptive expenditure estimates, and gamification rewards</li>
        <li>Send account emails (password reset, optional Pro reminders) when you enable them</li>
        <li>Process subscriptions and enforce plan limits</li>
        <li>Maintain security, prevent abuse, and improve reliability</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Third-party service providers</h2>
      <p>We share data with processors that help us run LeanOut, only as needed to provide the service:</p>
      <ul>
        <li>
          <strong>MongoDB Atlas</strong> — database hosting (account and activity data)
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and file storage for progress photos
        </li>
        <li>
          <strong>Anthropic</strong> — AI Coach chat (conversation content and profile context)
        </li>
        <li>
          <strong>OpenAI</strong> — meal plans, food recognition, and some workout generation
        </li>
        <li>
          <strong>Stripe</strong> — subscription billing (when Pro is enabled)
        </li>
        <li>
          <strong>Google</strong> — optional OAuth sign-in
        </li>
        <li>
          <strong>Resend</strong> — transactional email delivery
        </li>
        <li>
          <strong>USDA FoodData Central / Open Food Facts</strong> — barcode and food search lookups
        </li>
      </ul>
      <p>
        Each provider processes data under its own privacy terms. We select providers with appropriate
        security practices and limit the data sent to what is required for each feature.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain your account data while your account is active. You may export your data at any time
        from Settings. If you delete your account (contact us), we will delete or anonymize personal
        data within a reasonable period, except where retention is required for legal or security
        purposes.
      </p>

      <h2>Your rights and choices</h2>
      <ul>
        <li>
          <strong>Access and export</strong> — download a JSON export of your data from Settings
        </li>
        <li>
          <strong>Correction</strong> — update profile and log entries in the app
        </li>
        <li>
          <strong>Deletion</strong> — email <a href="mailto:contact@leanout.ai">contact@leanout.ai</a> to
          request account deletion
        </li>
        <li>
          <strong>Health sync</strong> — revoke Apple Health or Health Connect permissions in your device
          settings at any time
        </li>
      </ul>
      <p>
        Depending on where you live, you may have additional rights under GDPR, CCPA, or similar laws.
        Contact us to exercise them.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed before storage. Traffic is served over HTTPS. API routes require
        authentication and scope data to your user account. No method of transmission or storage is 100%
        secure; we work to protect your data with industry-standard practices.
      </p>

      <h2>Children</h2>
      <p>
        LeanOut is not directed at children under 13 (or 16 in the EU). We do not knowingly collect data
        from children. Contact us if you believe a child has provided personal information.
      </p>

      <h2>International transfers</h2>
      <p>
        Our infrastructure and providers may process data in the United States and other countries. By
        using LeanOut, you acknowledge that your data may be transferred to jurisdictions with different
        data-protection laws.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as features evolve. Material changes will be reflected by updating the
        date at the top of this page. Continued use after changes constitutes acceptance of the updated
        policy.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or requests:{" "}
        <a href="mailto:contact@leanout.ai">contact@leanout.ai</a>
      </p>
    </LegalPageShell>
  );
}
