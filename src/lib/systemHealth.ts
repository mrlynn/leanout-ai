import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import mongoose from "mongoose";
import { connectDB } from "./mongodb";

export type CheckStatus = "ok" | "fail" | "missing" | "skipped";

export interface ServiceCheck {
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
}

export interface EnvCheck {
  status: "ok" | "missing";
  required: boolean;
}

export interface SystemHealthReport {
  ok: boolean;
  checkedAt: string;
  checks: {
    mongodb: ServiceCheck;
    env: Record<string, EnvCheck>;
    providers?: {
      anthropic: ServiceCheck;
      openai: ServiceCheck;
    };
  };
}

const REQUIRED_ENV = [
  "MONGODB_URI",
  "AUTH_SECRET",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
] as const;

const ADMIN_ENV = ["ADMIN_EMAIL"] as const;

const PROBE_CACHE_TTL_MS = 5 * 60_000;
let probeCache: { checkedAt: number; providers: NonNullable<SystemHealthReport["checks"]["providers"]> } | null =
  null;

function envChecks(includeAdmin: boolean): Record<string, EnvCheck> {
  const keys = includeAdmin ? [...REQUIRED_ENV, ...ADMIN_ENV] : [...REQUIRED_ENV];
  const result: Record<string, EnvCheck> = {};
  for (const key of keys) {
    const value = process.env[key];
    result[key] = {
      status: value && value.trim().length > 0 ? "ok" : "missing",
      required: (REQUIRED_ENV as readonly string[]).includes(key) || key === "ADMIN_EMAIL",
    };
  }
  return result;
}

async function checkMongoDB(timeoutMs = 5000): Promise<ServiceCheck> {
  if (!process.env.MONGODB_URI) {
    return { status: "missing", error: "MONGODB_URI not set" };
  }

  const start = Date.now();
  try {
    await Promise.race([
      connectDB().then(() => mongoose.connection.db?.admin().ping()),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`MongoDB ping timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "fail",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function probeAnthropic(timeoutMs = 10000): Promise<ServiceCheck> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: "missing", error: "ANTHROPIC_API_KEY not set" };
  }

  const start = Date.now();
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    await Promise.race([
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Anthropic probe timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "fail",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function probeOpenAI(timeoutMs = 10000): Promise<ServiceCheck> {
  if (!process.env.OPENAI_API_KEY) {
    return { status: "missing", error: "OPENAI_API_KEY not set" };
  }

  const start = Date.now();
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    await Promise.race([
      client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`OpenAI probe timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "fail",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function getProviderChecks(probe: boolean): Promise<SystemHealthReport["checks"]["providers"]> {
  if (!probe) return undefined;

  const now = Date.now();
  if (probeCache && now - probeCache.checkedAt < PROBE_CACHE_TTL_MS) {
    return probeCache.providers;
  }

  const [anthropic, openai] = await Promise.all([probeAnthropic(), probeOpenAI()]);
  const providers = { anthropic, openai };
  probeCache = { checkedAt: now, providers };
  return providers;
}

function isHealthy(
  mongodb: ServiceCheck,
  env: Record<string, EnvCheck>,
  providers?: SystemHealthReport["checks"]["providers"]
): boolean {
  const envOk = Object.values(env)
    .filter((c) => c.required)
    .every((c) => c.status === "ok");
  const mongoOk = mongodb.status === "ok";
  const providersOk =
    !providers ||
    (providers.anthropic.status === "ok" && providers.openai.status === "ok");
  return envOk && mongoOk && providersOk;
}

export async function getSystemHealth(options?: {
  includeAdminEnv?: boolean;
  probeProviders?: boolean;
}): Promise<SystemHealthReport> {
  const includeAdminEnv = options?.includeAdminEnv ?? false;
  const probeProviders = options?.probeProviders ?? false;

  const [mongodb, providers] = await Promise.all([
    checkMongoDB(),
    getProviderChecks(probeProviders),
  ]);
  const env = envChecks(includeAdminEnv);

  return {
    ok: isHealthy(mongodb, env, providers),
    checkedAt: new Date().toISOString(),
    checks: { mongodb, env, providers },
  };
}
