# mini-hcm - Agent Guide

A lightweight Human Capital Management (HCM) time-tracking application built as a monorepo with a Vite + React frontend and an Express.js backend.

---

## Repository Layout

```
mini-hcm/
├── client/          # Vite + React SPA
│   └── src/
│       ├── main.tsx
│       └── App.tsx
├── server/          # Express.js API
│   └── src/
│       └── index.ts
├── biome.json       # Shared linter / formatter config
├── package.json     # Root scripts (runs both workspaces)
├── AGENTS.md        # This file
└── CLAUDE.md        # Points to this file
```

Both `client/` and `server/` are independent packages with their own `package.json` and dependencies. The root `package.json` coordinates them.

---

## Tech Stack

| Layer              | Technology                        |
| ------------------ | --------------------------------- |
| Frontend framework | React 19                          |
| Build tool         | Vite 8                            |
| Styling            | Tailwind CSS 4                    |
| Backend            | Express.js 5                      |
| Language           | TypeScript (strict) everywhere    |
| Auth / Database    | Firebase Admin SDK                |
| Package manager    | **Bun** (not npm/yarn)            |
| Linter + formatter | Biome (shared, root-level config) |
| Additional lint    | ESLint (client only, flat config) |

---

## Development

### Install all dependencies

```sh
bun run setup
```

This runs `bun install` at the root, then inside `client/` and `server/`.

### Start both servers (recommended)

```sh
bun dev
```

This concurrently:

1. Starts the Express server on **port 3000**
2. Waits for port 3000, then starts the Vite dev server (default **port 5173**)

### Start individually

```sh
# Backend only
cd server && bun dev

# Frontend only
cd client && bun dev
```

---

## API Proxy

In development, Vite proxies `/api/*` to `http://localhost:3000`. There is **no CORS issue in development** because all browser requests hit the Vite dev server, which forwards them.

In production, Express serves the built client from `dist/` and handles API routes directly - no proxy needed.

---

## Code Style

All code formatting and linting is handled by **Biome** via the root `biome.json`. Always run Biome before committing.

```sh
# Check + auto-fix everything
bun run check

# Format only
bun run format

# Lint only
bun run lint
```

Key Biome settings:

- Indentation: **tabs**
- Quotes: **single** for JS/TS
- Import organization: **auto-sorted**

The client also has ESLint (`client/eslint.config.js`) for React-specific rules (hooks, fast-refresh). Biome and ESLint rules do not conflict - ESLint covers React plugin rules that Biome does not have.

---

## TypeScript

Both workspaces use **strict TypeScript**. Do not use `any` unless absolutely unavoidable, and never leave `noUnusedLocals` or `noUnusedParameters` violations.

- Client target: **ES2023**, module resolution: `bundler`
- Server target: **ESNext**, module: `ESNext`, no emit (ts-node / bun handles execution)

---

## Firebase

The server has Firebase Admin SDK installed. Credentials are loaded via environment variables - never hard-code service account keys.

Create `server/.env` (not committed) with:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

---

## Adding Features

### New API endpoint

Add route handlers in `server/src/index.ts` (or extract to a `server/src/routes/` directory as the app grows). All routes should be prefixed with `/api`.

### New React page / component

Place components under `client/src/components/` and pages under `client/src/pages/`. Import styles via Tailwind utility classes - avoid custom CSS unless Tailwind cannot cover the case.

---

## Common Pitfalls

- **Always use `bun`**, not `npm` or `yarn`. The lockfile is `bun.lock`.
- Run `bun run check` (Biome) before opening a PR - CI will fail on lint/format errors.
- The Vite proxy only works in **development**. Never rely on it in production logic.
- Firebase Admin SDK is server-side only. Do not import it in the client.
- React 19 uses the new **React Compiler** (Babel preset). Avoid manual `useMemo`/`useCallback` optimization - the compiler handles it.
