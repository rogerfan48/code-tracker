export const PORTFOLIO_URL = process.env.PORTFOLIO_URL ?? "https://roger.tw";
export const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export function loginUrl(returnPath: string) {
  return `${PORTFOLIO_URL}/login?callbackUrl=${encodeURIComponent(`${APP_URL}${returnPath}`)}`;
}

// Re-reads the access flag into the shared JWT, then redirects to /problems, or to /?restricted=1 if still locked
export const ACCESS_REFRESH_URL = `${PORTFOLIO_URL}/api/code-tracker/refresh`;
