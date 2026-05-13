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

## Firebase Authentication

This app uses Firebase Authentication with Email/Password accounts. Account creation is handled outside the app for now, so create employees in Firebase Console or with an admin tool before they sign in.

1. Create a Firebase project in Firebase Console.
2. Register a Web app and copy its Firebase config values.
3. Enable **Authentication > Sign-in method > Email/Password**.
4. Create at least one user in **Authentication > Users**.
5. Copy `client/.env.example` to `client/.env.local` and fill in the Web app values.
6. Create a Firebase service account key for the server.
7. Copy `server/.env.example` to `server/.env` and fill in the service account values.

The client signs in with Firebase and sends the user's ID token to `/api` as a Bearer token. The Express server verifies that token with Firebase Admin SDK before returning protected data.
