import { NextResponse } from "next/server";

export type AiProvider = "openai" | "anthropic";

export type AiErrorCode =
  | "missing_api_key"
  | "invalid_api_key"
  | "rate_limited"
  | "timeout"
  | "provider_error"
  | "unknown";

export interface ClassifiedAiError {
  code: AiErrorCode;
  status: number;
  logMessage: string;
  userMessage: string;
}

function getStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const e = err as { status?: number; statusCode?: number; code?: string };
  return e.status ?? e.statusCode;
}

function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

export function classifyAiError(err: unknown): ClassifiedAiError {
  const status = getStatus(err);
  const message = getMessage(err);
  const lower = message.toLowerCase();

  if (lower.includes("api key") && (lower.includes("missing") || lower.includes("not configured"))) {
    return {
      code: "missing_api_key",
      status: 503,
      logMessage: message,
      userMessage: "AI service is not configured. Please try again later.",
    };
  }

  if (status === 401 || status === 403 || lower.includes("incorrect api key") || lower.includes("invalid api key")) {
    return {
      code: "invalid_api_key",
      status: 503,
      logMessage: message,
      userMessage: "AI service is temporarily unavailable. Please try again later.",
    };
  }

  if (status === 429 || lower.includes("rate limit")) {
    return {
      code: "rate_limited",
      status: 503,
      logMessage: message,
      userMessage: "AI service is busy. Please wait a moment and try again.",
    };
  }

  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("econnreset")) {
    return {
      code: "timeout",
      status: 504,
      logMessage: message,
      userMessage: "AI request timed out. Please try again.",
    };
  }

  if (status && status >= 500) {
    return {
      code: "provider_error",
      status: 503,
      logMessage: message,
      userMessage: "AI service is temporarily unavailable. Please try again later.",
    };
  }

  return {
    code: "unknown",
    status: 500,
    logMessage: message,
    userMessage: "Something went wrong with the AI request. Please try again.",
  };
}

export function logAiError(
  context: { route: string; provider: AiProvider },
  err: unknown
): ClassifiedAiError {
  const classified = classifyAiError(err);
  console.error(
    `[ai] route=${context.route} provider=${context.provider} code=${classified.code} status=${classified.status} message=${classified.logMessage}`
  );
  return classified;
}

export function aiErrorResponse(
  context: { route: string; provider: AiProvider },
  err: unknown
): NextResponse {
  const classified = logAiError(context, err);
  return NextResponse.json(
    { error: classified.userMessage, code: classified.code },
    { status: classified.status }
  );
}
