# Backend — Rails 8 API

Ruby 3.4.3 · Rails 8.0 · SQLite (WAL mode) · Puma

## Setup

```bash
cd backend
bundle install
bin/rails db:setup   # creates DB, loads schema, seeds demo data
```

`db:setup` seeds one user (`demo@example.com`, id=1, 1500 pts) and eight rewards across four categories.

## Run

```bash
bin/rails server     # listens on http://localhost:3000
```

CORS is configured in config/initializers/cors.rb to allow requests from http://localhost:5173 (Vite's dev server) in development.

## Test

```bash
bin/check            # full gate: rubocop, rspec, brakeman, bundle-audit (run before every commit)
bin/test             # rspec only
bin/test spec/services/redemptions/   # one directory
bundle exec rubocop -A                # autofix style offences
```

## API

See [`../docs/API.md`](../docs/API.md) for the full contract (routes, headers, request/response shapes, curl examples).

Authentication uses an `X-User-Id` request header — a deliberate scope cut. See the API doc for details.

## Architecture notes

- Redemption logic lives in `app/services/redemptions/create.rb` (command object pattern). Controllers are thin wrappers.
- The redemption endpoint is transactionally safe under concurrent requests: pessimistic row locks on both the user and the reward are acquired before any balance or stock check. A concurrency test with a `CyclicBarrier` proves this.
- Serialization uses [Alba](https://github.com/okuramasafumi/alba). Responses are bare objects/arrays — no root-key envelope.
- Background jobs use Solid Queue (Rails 8 default). `RedemptionConfirmationJob` is a stub ready for a notification implementation.