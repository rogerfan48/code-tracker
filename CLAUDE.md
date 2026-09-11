# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked. No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting. Match existing style.
- Remove imports/variables/functions that YOUR changes made unused; leave pre-existing dead code (mention it).

## 4. Goal-Driven Execution

Transform tasks into verifiable goals and loop until verified (`pnpm lint`, `pnpm test`, then the real UI).

## 5. Comments

**Default to none. Code says what; a comment only ever says why.** One line, the reason only. No JSDoc, no changelog comments, no invented TODOs.

## 6. Project Context

Code Tracker — private LeetCode re-practice tracker at code.roger.tw (dev: dev.code.roger.tw).
Next.js 16 App Router, TypeScript, SCSS modules, Radix, dnd-kit, Prisma/PostgreSQL, Docker behind host Nginx.

- Auth is SSO from roger.tw: this app only decodes the shared `.roger.tw` session cookie (`src/auth.ts`); it never signs users in. Only `admin` / `premium` roles pass `requireUser()`.
- All data is per user (`userId` = portfolio `User.id`, no FK). Every query filters by it.
- Day math (due dates, "days ago") runs in the browser's local time (`src/lib/due.ts`); the server only stores calendar dates.
- Only rows on `/problems` are interactive; `/due` and `/recent` link to `/problems?focus=<id>`.

Read `README.md` for architecture and `docs/dev-op.md` for operations. Both lag the code — verify anything load-bearing against source.

Reply in English. Code, comments, and UI text in English.
