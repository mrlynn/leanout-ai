const CHECK_IN_FIELDS = [
  "weightLbs",
  "steps",
  "hunger",
  "energy",
  "compliance",
  "workoutCompleted",
  "notes",
] as const;

export function pickCheckInFields(data: Record<string, unknown>) {
  const unknown = Object.keys(data).filter(
    (k) => !CHECK_IN_FIELDS.includes(k as (typeof CHECK_IN_FIELDS)[number])
  );
  if (unknown.length > 0) {
    return { error: `Unknown fields: ${unknown.join(", ")}` };
  }

  const result: Record<string, unknown> = {};
  for (const key of CHECK_IN_FIELDS) {
    if (key in data) result[key] = data[key];
  }

  if (result.weightLbs !== undefined) {
    const w = Number(result.weightLbs);
    if (!Number.isFinite(w) || w <= 0) return { error: "weightLbs must be a positive number" };
    result.weightLbs = w;
  }

  for (const key of ["hunger", "energy", "compliance"] as const) {
    if (result[key] !== undefined) {
      const v = Number(result[key]);
      if (!Number.isInteger(v) || v < 1 || v > 10) {
        return { error: `${key} must be an integer between 1 and 10` };
      }
      result[key] = v;
    }
  }

  if (result.steps !== undefined) {
    const s = Number(result.steps);
    if (!Number.isInteger(s) || s < 0) return { error: "steps must be a non-negative integer" };
    result.steps = s;
  }

  if (result.workoutCompleted !== undefined && typeof result.workoutCompleted !== "boolean") {
    return { error: "workoutCompleted must be a boolean" };
  }

  if (result.notes !== undefined) {
    if (typeof result.notes !== "string" || result.notes.length > 500) {
      return { error: "notes must be a string of at most 500 characters" };
    }
  }

  return { fields: result };
}

const MAX_COACH_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 4096;
const MAX_TOTAL_PAYLOAD = 100_000;

export function validateCoachMessage(message: unknown) {
  if (typeof message !== "string" || message.length === 0) {
    return { error: "message must be a non-empty string" };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `message must be at most ${MAX_MESSAGE_LENGTH} characters` };
  }
  return { message };
}

export function validateCoachMessages(messages: unknown) {
  if (!Array.isArray(messages)) return { error: "messages must be an array" };
  if (messages.length === 0) return { error: "messages must not be empty" };
  if (messages.length > MAX_COACH_MESSAGES) {
    return { error: `messages must have at most ${MAX_COACH_MESSAGES} items` };
  }

  let totalSize = 0;
  const validated: { role: "user" | "assistant"; content: string }[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") return { error: "each message must be an object" };
    const { role, content } = msg as { role?: string; content?: string };
    if (role !== "user" && role !== "assistant") {
      return { error: "message role must be user or assistant" };
    }
    if (typeof content !== "string" || content.length === 0) {
      return { error: "message content must be a non-empty string" };
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return { error: `message content must be at most ${MAX_MESSAGE_LENGTH} characters` };
    }
    totalSize += content.length;
    if (totalSize > MAX_TOTAL_PAYLOAD) {
      return { error: "total message payload too large" };
    }
    validated.push({ role, content });
  }

  return { messages: validated };
}

export function validateMacros(body: Record<string, unknown>) {
  const fields = ["calories", "protein", "carbs", "fat"] as const;
  const result: Record<string, number> = {};

  for (const key of fields) {
    const v = Number(body[key]);
    if (!Number.isFinite(v) || v <= 0) {
      return { error: `${key} must be a positive number` };
    }
    result[key] = v;
  }

  return { macros: result };
}
