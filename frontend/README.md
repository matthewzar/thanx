# Thanx Rewards — Frontend

React + TypeScript + Vite frontend for the Thanx rewards redemption app. Talks to the Rails API at `http://localhost:3000`.

## Prerequisites

- Node 24+
- pnpm 10+

## Setup

```bash
cd frontend
pnpm install
```

## Running

```bash
pnpm dev        # starts Vite dev server at http://localhost:5173
```

The backend must be running at `http://localhost:3000` before the app will load data. See the root `README.md` for how to start both servers.

## Environment

| Variable       | Default | Purpose                             |
|----------------|---------|-------------------------------------|
| `VITE_USER_ID` | `1`     | Identifies the user via `X-User-Id` header sent with every API request |

Create a `.env.local` to override: `VITE_USER_ID=2`.

## Verification

```bash
pnpm check        # full gate: eslint + typecheck + vitest + vite build
pnpm lint         # eslint only
pnpm typecheck    # tsc -b --noEmit only
pnpm test         # vitest run only
pnpm test:watch   # vitest in watch mode
```

A change is not complete until `pnpm check` passes clean.

## Project layout

```
src/
├── features/          # one folder per domain (rewards, redemptions, points)
│   └── <name>/
│       ├── types.ts
│       ├── api.ts
│       ├── hooks.ts
│       └── components/
├── components/        # shared presentational primitives only
├── lib/               # api-client, query-client, query-keys
├── pages/             # thin route components
└── test/              # MSW server, handlers, vitest setup
```

Start with `src/features/rewards/` for the read-only data flow and `src/features/redemptions/` for the mutation flow.

## Conventions

See [`AGENTS.md`](AGENTS.md) for the full conventions reference: canonical examples, the recipe for adding a feature folder, and patterns to avoid.
