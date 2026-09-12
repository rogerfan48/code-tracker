// Keep in sync with the same template in the portfolio (code-tracker-card.tsx)
const OWNER_EMAIL = "roger@roger.tw";

export function accessRequestMailto(user: { email: string | null; username: string | null; name: string | null }) {
  const handle = user.username ? `@${user.username}` : "";
  const who = user.name ? `${user.name}${handle ? ` (${handle})` : ""}` : handle || user.email || "unknown account";
  const subject = `Code Tracker access request — ${who}`;
  const body = [
    "Hi Roger,",
    "",
    "I'd like to request access to Code Tracker (code.roger.tw).",
    "",
    "Account",
    `Name: ${user.name ?? ""}`,
    `Username: ${user.username ?? ""}`,
    `Email: ${user.email ?? ""}`,
    "",
    "Who I am:",
    "",
    "",
    "Why I'd like access:",
    "",
    "",
    "Thank you,",
    user.name ?? "",
  ].join("\n");
  return `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
