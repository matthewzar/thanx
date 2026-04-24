# AGENTS.md

Instructions for AI agents (and humans) working in this repository.

## What this is

A take-home project implementing a rewards redemption web app: Rails 8 API backend + React/TypeScript frontend. Full spec in `docs/CHALLENGE.md`.

## Read these first

Before writing code, read both:

1. **`docs/CHALLENGE.md`** — the original problem statement. This is what must be built.
2. **`docs/IMPLEMENTATION_GUIDE.md`** — the conventions, patterns, and pitfalls to follow. Treat as authoritative for every design decision not spelled out in the challenge. If the guide and your instincts disagree, follow the guide.

If you are about to add a dependency, change a convention, or skip a section from the guide, surface that decision explicitly rather than making it silently.

## Project structure

```
.
├── AGENTS.md                        # this file
├── README.md                        # human-facing setup & run instructions
├── docs/
│   ├── CHALLENGE.md                 # problem spec
│   └── IMPLEMENTATION_GUIDE.md      # conventions and rationale
├── backend/                         # Rails 8 API app
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   ├── models/
│   │   ├── services/                # command objects live here
│   │   ├── serializers/
│   │   └── jobs/
│   └── spec/
│       ├── models/
│       ├── services/
│       └── requests/                # request specs, NOT controller specs
└── frontend/                        # Vite + React + TypeScript
    └── src/
        ├── features/                # feature-folder structure
        │   ├── rewards/
        │   ├── redemptions/
        │   └── points/
        ├── components/              # genuinely shared, presentational
        ├── lib/                     # api-client, query-client
        └── pages/                   # thin route components
```

Each `features/<name>/` folder contains its own `components/`, `api.ts`, `hooks.ts`, `types.ts`. Do not put business logic in the root `components/` folder — that folder is for presentational primitives only.

## Verification commands

Each app has a single command that runs the full check suite:

```bash
cd backend  && bin/check     # rubocop, rspec, brakeman, bundle-audit
cd frontend && pnpm check    # eslint, tsc --noEmit, vitest, vite build
```

Run the relevant one after every meaningful change. A change is not done until `bin/check` (or `pnpm check`) passes clean. "Mostly green" is not green — investigate every failure rather than working around it.

During iteration, faster subsets are fine:

```bash
# Backend
bin/test                                  # rspec only
bin/test spec/services/redemptions/       # one directory
bundle exec rubocop -A                    # autofix style

# Frontend
pnpm test:watch                           # vitest in watch mode
pnpm typecheck                            # types only
pnpm lint                                 # eslint only
```

…but always run the full `check` before declaring a task complete or committing.

## SQL and DB config

SQLite must run with foreign_keys: ON and WAL journal mode. Both are configured in config/database.yml under the pragmas: key — do not remove them.

## Working loop

For any non-trivial change, follow this loop:

1. **Plan first.** State the approach in plain text before writing code. If the change spans multiple files or touches the redemption flow, list the files and what each one will contain. Use Clean Code, OOD, and SOLID when applicable. Wait for confirmation on anything ambiguous.
2. **Write the test first when practical** — especially for service objects, models, and API endpoints. Concurrency tests for the redemption flow are non-negotiable.
3. **Make the change.**
4. **Run the relevant check command.** Not "the test you just wrote." The full check for that app.
5. **If it fails, fix the actual cause.** Do not delete or skip tests, do not silence linter rules, do not loosen TypeScript types, do not add `rubocop:disable` comments without an explicit reason in a code comment.
6. **Re-run check until clean.**
7. **Report what changed, what was verified, and anything noteworthy you noticed but didn't address.**

If a check command takes longer than expected or appears to hang, surface that rather than canceling silently. If a dependency needs to be added, name it and explain why before installing.

## Rules most likely to be violated

These are the failure modes reviewers have repeatedly flagged. Do not reintroduce them.

**Backend:**
- The redemption endpoint MUST wrap everything in `ActiveRecord::Base.transaction` AND take a pessimistic lock on the user (`User.lock.find(id)`) BEFORE checking balance. See the guide, §2.
- Redemption logic lives in `app/services/redemptions/create.rb`. Not in the controller. Not on the `User` model.
- Request specs only. No controller specs.
- Every model uniqueness claim needs a matching DB-level unique index.
- `points_balance >= 0` must exist as a model validation AND a DB `CHECK` constraint.
- Use Rails strong parameters (`params.require/permit`). Do not parse params by hand.
- Run rubocop. Every offense matters.

**Frontend:**
- Functional components + hooks only. No class components.
- React Query (or SWR) for all data fetching. No hand-rolled `useEffect` + `useState` ladders for async.
- Never `window.alert`, `window.confirm`, or `document.querySelector`. Use modals and refs.
- Every async list needs a loading skeleton AND an empty state.
- Error UI surfaces the actual server message, not the string "error".
- TypeScript strict mode. No `any` without a comment justifying it.

## Scope discipline

The challenge asks for four things: view balance, list rewards, redeem a reward, list redemption history. Do not build admin panels, reward CRUD, signup flows, achievements, or gamification. Time saved on scope goes into tests, the concurrency spec, and polish.

## When in doubt

Choose convention over invention. Prefer a well-known gem or library over a hand-rolled solution. If a Rails generator would produce this, use the generator.