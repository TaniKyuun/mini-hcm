# mini-hcm

A lightweight Human Capital Management (HCM) app for employee time tracking. Built as a monorepo with a React frontend and an Express.js backend.

## Stack

- **Frontend** — React 19, Vite 8, Tailwind CSS 4, TypeScript
- **Backend** — Express.js 5, TypeScript, Firebase Admin SDK
- **Package manager** — Bun

## Getting Started

```sh
# Install dependencies for all workspaces
bun run setup

# Start frontend + backend together
bun dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` requests to the Express server on `http://localhost:3000`.

## Project Structure

```
mini-hcm/
├── client/   # Vite + React SPA
├── server/   # Express.js API
├── bun.lock
└── package.json
```

## Scripts

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `bun run setup`  | Install all workspace dependencies |
| `bun dev`        | Start both servers concurrently    |
| `bun run check`  | Lint and format with Biome         |
| `bun run format` | Auto-format with Biome             |
