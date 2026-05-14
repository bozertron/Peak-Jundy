export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseSpecs(specsString: string): Record<string, unknown> {
  return safeJsonParse<Record<string, unknown>>(specsString, {});
}

export function calculateRentalDays(start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  const diffMs = endMs - startMs;
  if (diffMs <= 0) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil(diffMs / msPerDay);
}
