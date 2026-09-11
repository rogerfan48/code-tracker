export const PORTFOLIO_URL = process.env.PORTFOLIO_URL ?? "https://roger.tw";
export const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export function loginUrl(returnPath: string) {
  return `${PORTFOLIO_URL}/login?callbackUrl=${encodeURIComponent(`${APP_URL}${returnPath}`)}`;
}
