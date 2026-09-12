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

Code Tracker — a personal LeetCode re-practice tracker (Next.js 16 App Router, TypeScript, SCSS modules, Radix, dnd-kit, Prisma/PostgreSQL, Docker). `README.md` is the single source of truth for what it does, how it is built, and how to run it — read it first, then the code; the README lags the code, so verify anything load-bearing against source.

Non-obvious rules that the code enforces and changes must keep:

- Auth is decode-only: `src/auth.ts` never signs users in, it reads a session JWT issued by a sibling site on a shared cookie domain. Only the roles in `ALLOWED_ROLES` (`src/lib/session.ts`) pass `requireUser()`.
- Every query is scoped by `userId` (the JWT `sub`). There is no FK to any user table.
- Calendar dates only: the server stores `DATE`; "today", days-since and due-in are computed in the browser (`src/lib/due.ts`, unit-tested).
- Only rows on `/problems` are interactive; `/due` and `/recent` link to `/problems?focus=<id>`.

Server/deployment specifics are intentionally not in this repo.

Reply in English. Code, comments, and UI text in English.
