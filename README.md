# Thanx Rewards

A take-home project: a rewards redemption web app with a Rails 8 API backend and a React/TypeScript frontend. Users view their points balance, browse available rewards, redeem rewards, and review their redemption history.

Full spec: [`docs/CHALLENGE.md`](docs/CHALLENGE.md). Implementation decisions and rationale: [`docs/IMPLEMENTATION_GUIDE.md`](docs/IMPLEMENTATION_GUIDE.md).

## What's interesting in this codebase

- **Concurrency-safe redemption flow**: `backend/app/services/redemptions/create.rb` and its companion concurrency spec at `backend/spec/services/redemptions/create_concurrency_spec.rb`. Pessimistic locks on both user and reward, with a `CyclicBarrier`-based test that proves correctness under simultaneous requests.
- **Modal error recovery**: `frontend/src/features/rewards/components/RedeemConfirmModal.tsx`. Three-state machine (initial / pending / error) that surfaces the exact server error phrase inline and offers a single recovery path.
- **API contract**: [`docs/API.md`](docs/API.md) — four endpoints, bare-array/bare-object response shapes, `X-User-Id` header auth.

## AGENTS.md files

This repository uses layered `AGENTS.md` files as the authoritative conventions reference for both AI agents and human contributors. **Read these before writing any code:**

| File | Covers |
|------|--------|
| [`AGENTS.md`](AGENTS.md) | Repo-wide rules, project structure, working loop, verification commands |
| [`backend/AGENTS.md`](backend/AGENTS.md) | Rails conventions, service object pattern, request spec recipe |
| [`frontend/AGENTS.md`](frontend/AGENTS.md) | React/TS conventions, feature-folder recipe, mutation pattern, MSW setup |

## Architecture

```
backend/    Rails 8 API mode app (SQLite + Puma). Exposes /api/v1/*.
frontend/   Vite + React 19 + TypeScript 6 SPA. Calls the backend API.
docs/       Challenge spec and implementation guide.
```

Auth is simulated via an `X-User-Id` request header. See [`docs/API.md`](docs/API.md) for the full API contract.

## Prerequisites

| Tool | Version |
|------|---------|
| Ruby | 3.4.3 (see `backend/.ruby-version`) |
| Bundler | 2+ |
| Node | 24+ |
| pnpm | 10+ |

## Setup

**Backend:**

```bash
cd backend
bundle install
bin/rails db:setup   # creates DB, loads schema, seeds demo data
```

**Frontend:**

```bash
cd frontend
pnpm install
```

## Running

Start each in its own terminal:

```bash
# Terminal 1 — API server on http://localhost:3000
cd backend && bin/rails server

# Terminal 2 — Vite dev server on http://localhost:5173
cd frontend && pnpm dev
```

Open `http://localhost:5173` in a browser. The frontend falls back to user ID 1 if `VITE_USER_ID` is not set; create `frontend/.env.local` with `VITE_USER_ID=<id>` to change it.

## Resetting the database

The demo user starts with 1,500 pts. Once you've spent them, reset everything with:

```bash
cd backend && bin/rails db:reset
```

This drops the database, recreates it from the schema, and reruns the seeds — giving the demo user a fresh 1,500 pt balance and clearing all redemption history. Stop the Rails server first if it's running, then restart it after.

> Note: `db:seed` alone will not restore the balance because the seeds use `find_or_create_by!` and skip existing records.

## Testing & verification

Each app has a single command that runs the full check suite:

```bash
cd backend  && bin/check    # rubocop, rspec, brakeman, bundle-audit
cd frontend && pnpm check   # eslint, tsc -b, vitest, vite build
```

Neither app is considered complete until its check command passes clean.

## Trade-offs and what I'd do with more time

- **Auth**: simulated via an `X-User-Id` header — a deliberate scope cut. Production would use Devise + devise-jwt on the backend and a real login flow on the frontend; the seam is one method in `ApplicationController` and one screen in the React app.
- **Idempotency**: the redemption endpoint is correctness-safe under concurrency via transaction + pessimistic locks + DB CHECK constraint, but does not accept a client-supplied request key. A production version would add one to handle network retries.
- **Database**: SQLite (per spec). Production at Thanx uses MySQL; the pessimistic locks behave equivalently but via different mechanisms. Foreign-key enforcement and WAL mode are explicitly enabled.
- **Background jobs**: `RedemptionConfirmationJob` is a stub. A production version would send a confirmation email or push notification.
- **Observability**: no error monitoring, structured logging, or analytics. A production version would wire up Sentry on both ends and structured request logs.
- **Deployment**: not deployed. Would deploy backend via Fly.io or Render (both support SQLite with persistent volumes) and frontend via Vercel or Cloudflare Pages.
- **Rate limiting**: `rack-attack` would be added alongside real auth to protect the redemption endpoint.