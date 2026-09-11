# Code Tracker

Private spaced re-practice tracker for LeetCode (and custom) problems.

**Prod**: [code.roger.tw](https://code.roger.tw) · **Dev**: [dev.code.roger.tw](https://dev.code.roger.tw)

```
                ┌──────────── Nginx (host) ────────────┐
                │ code.roger.tw        dev.code.roger.tw│
                └────────┬───────────────────┬─────────┘
                    :3002│                   │:3003 (+Basic Auth)
        ┌────────────────▼──────┐  ┌─────────▼────────────────┐
        │ code-tracker-web      │  │ code-tracker-dev-web     │
        │ (standalone build)    │  │ (next dev, bind mount)   │
        └────────────┬──────────┘  └─────────┬────────────────┘
        ┌────────────▼──────────┐  ┌─────────▼────────────────┐
        │ code-tracker-db :5434 │  │ code-tracker-dev-db :5435│
        └───────────────────────┘  └──────────────────────────┘

        Session cookie on .roger.tw issued by roger.tw / dev.roger.tw (SSO)
```

## What it does

- **Problems** (`/problems`) — a Main / Sub category tree of problems. Each row shows *days until re-practice*,
  number, title, tags, difficulty, the last practice (familiarity level 0–3 + days ago) and the older history.
  Click a row to log a practice; drag rows to reorder or move between sub categories; `⋯` edits or deletes.
  **Edit structure** mode renames, reorders, adds and deletes categories inline.
- **Due** — overdue/today, coming up within N days, and never-practiced problems. Rows jump to the problem list.
- **Recent** — practice log grouped by day.
- **Stats** — counts by difficulty / last level and practices per week.
- **Settings** — re-practice interval per level (default 0 / 90 / 30 / 14 days; 0 = never) and tag colors.
- LeetCode problems autofill title / difficulty / url / tags from the LeetCode number (unofficial GraphQL endpoint; manual entry is the fallback).

Due logic: `dueIn = (last practice date + interval[last level]) − today`, computed in the browser's local time.

## Stack

Next.js 16 (App Router, standalone), React 19, TypeScript, SCSS modules, Radix UI, dnd-kit, lucide, sonner,
Prisma 6 + PostgreSQL 15, NextAuth v5 (decode-only), zod, vitest. pnpm 10, Node 22.

## Authentication

There is no login page here. `roger.tw` issues its session JWT on a `.roger.tw` cookie
(`AUTH_COOKIE_NAME` / `AUTH_COOKIE_DOMAIN` in the portfolio compose files); this app shares `AUTH_SECRET`
and the cookie name and simply decodes it (`src/auth.ts`). Unauthenticated visitors are redirected to
`PORTFOLIO_URL/login?callbackUrl=…`; signed-in users whose role is not `admin` / `premium` get the
restricted notice on the landing page. All tracker data is scoped to the user's portfolio `User.id`.

## Project structure

```
├── src/
│   ├── app/                 # / landing · (app)/problems|due|recent|stats|settings · api/*
│   ├── components/
│   │   ├── tracker/         # provider, tree + dnd, rows, dialogs, views
│   │   ├── ui/              # Radix wrappers styled with SCSS modules
│   │   ├── layout/          # app shell, wordmark
│   │   └── landing/
│   ├── lib/                 # auth session, api helpers, due math, selectors, validation, leetcode lookup
│   ├── styles/              # tokens.css (design tokens), reset, mixins
│   └── types/
├── prisma/                  # schema + migrations
├── data/reference-problems.json   # seed list (categories + problems)
├── scripts/                 # seed-reference.ts, seed-demo.ts
├── deploy/                  # nginx vhosts, bind snippet, host setup README
└── docker-compose.yml / docker-compose.dev.yml / Dockerfile
```

## Development

```bash
cp .env.example .env            # fill AUTH_SECRET with the portfolio's value for that stage
docker compose -f docker-compose.dev.yml up -d
pnpm seed:reference --user <portfolio User.id>   # categories + problems, no history
pnpm seed:demo --user <portfolio User.id>        # pseudo problems covering every due state
pnpm seed:demo --user <portfolio User.id> --remove
pnpm lint && pnpm test
```

The user id comes from the portfolio DB: `SELECT id FROM "User" WHERE email = '…';`.

## Deployment

See [`docs/dev-op.md`](docs/dev-op.md) for day-to-day commands and [`deploy/README.md`](deploy/README.md)
for the one-time host setup (DNS, nginx, certbot).
