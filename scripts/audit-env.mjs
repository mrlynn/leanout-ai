#!/usr/bin/env node

import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

/**
 * Validates required environment variables.
 * Run before deploy/build: npm run check:env
 * Set STRICT_ENV=1 to also fail on recommended vars (good for production CI).
 */

const REQUIRED = [
  "MONGODB_URI",
  "AUTH_SECRET",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
];

const RECOMMENDED = [
  "ADMIN_EMAIL",
  "CRON_SECRET",
  "NEXTAUTH_URL",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_MONTHLY",
  "STRIPE_PRICE_ANNUAL",
  "STRIPE_WEBHOOK_SECRET",
];

const strict = process.env.STRICT_ENV === "1" || process.argv.includes("--strict");

function isSet(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

const missingRequired = REQUIRED.filter((name) => !isSet(name));
const missingRecommended = RECOMMENDED.filter((name) => !isSet(name));

if (missingRequired.length) {
  console.error("Missing required environment variables:");
  for (const name of missingRequired) console.error(`  - ${name}`);
}

if (missingRecommended.length) {
  const label = strict ? "Missing recommended environment variables" : "Recommended environment variables not set";
  console.warn(`${label}:`);
  for (const name of missingRecommended) console.warn(`  - ${name}`);
}

if (!missingRequired.length && (!strict || !missingRecommended.length)) {
  console.log(
    strict
      ? "All required and recommended environment variables are set."
      : "All required environment variables are set."
  );
  process.exit(0);
}

process.exit(missingRequired.length || (strict && missingRecommended.length) ? 1 : 0);
