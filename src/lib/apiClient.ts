export interface LimitReachedError {
  error: "limit_reached";
  feature: string;
  used: number;
  limit: number;
  period: string;
}

export function isLimitReached(data: unknown): data is LimitReachedError {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    (data as LimitReachedError).error === "limit_reached"
  );
}

export async function parseApiError(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { error: res.statusText };
  }
}
