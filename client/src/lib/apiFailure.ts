/** Keep request deadlines bounded so a sleeping serverless function cannot trap the interface. */
export const apiTimeoutMs = 12_000;

export function isApiTimeout(error: unknown) {
  const detail =
    error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /abort|timeout|timed out/i.test(detail);
}

export function apiFailureMessage(error: unknown) {
  if (isApiTimeout(error)) {
    return "The service is taking longer than expected. Your message is still here—please try again.";
  }

  return "The signal did not reach us. Check your connection and try again.";
}
