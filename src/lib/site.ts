import { APP_URL } from "./env";

export const SITE = {
  name: "Code Tracker",
  url: APP_URL,
  tagline: "Spaced re-practice for your LeetCode grind",
  description:
    "Code Tracker keeps every LeetCode problem you have worked on in a category tree, records how familiar each attempt felt, and tells you which ones are due for another round.",
  author: { name: "Roger Fan", url: "https://roger.tw" },
  // only the production host should be indexed; dev sits behind Basic Auth anyway
  indexable: APP_URL === "https://code.roger.tw",
};
