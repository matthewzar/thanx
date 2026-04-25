# backend/AGENTS.md

Backend-specific conventions. Read `../AGENTS.md` first for repo-wide rules.

## Where to find things

- **API contract** — `../docs/API.md` (route paths, headers, request/response shapes). Source of truth for what each endpoint does. Update it when you change a route.
- **Canonical service** — `app/services/redemptions/create.rb`. Copy this shape for any new service.
- **Canonical request spec** — `spec/requests/api/v1/redemptions_spec.rb`. Copy this shape for any new endpoint spec.
- **Canonical concurrency spec** — `spec/services/redemptions/create_concurrency_spec.rb`. Read the header comment before writing any thread-based test.

## Verification

```bash
bin/check                                 # full gate: rubocop, rspec, brakeman, bundle-audit
bin/test                                  # rspec only
bin/test spec/services/                   # one directory
bundle exec rubocop -A                    # autofix style
```

A change is not done until `bin/check` passes clean.

## Adding a new endpoint

The recipe is fixed. Follow it in this order:

1. Migration (if needed) — include all DB constraints from §3 of the implementation guide.
2. Model (if needed) — validations and scopes only, no business logic.
3. Service object under `app/services/<resource>/<action>.rb` — copy the shape of `Redemptions::Create`.
4. Service spec under `spec/services/<resource>/<action>_spec.rb` — happy path, edge cases, failure cases. If the service holds pessimistic locks, also add a `_concurrency_spec.rb` tagged `:concurrency` using a `CyclicBarrier` — see the canonical concurrency spec above.
5. Controller under `app/controllers/api/v1/` — thin, uses `before_action`, uses strong params, calls the service.
6. Serializer under `app/serializers/` using Alba — bare arrays for collections, bare objects for single resources, no root keys.
7. Route in `config/routes.rb` under the `namespace :api do; namespace :v1 do` block.
8. Request spec under `spec/requests/api/v1/` — assert status, assert response shape, cover both success and failure.
9. Update `../docs/API.md` with the new endpoint.
10. Run `bin/check`.

## Conventions specific to this codebase

- **Auth is faked via `X-User-Id` header.** This is a documented scope cut, not a security model. Do not build on top of it as if it were real auth. See `../docs/API.md` for the rationale.
- **Services raise an inner `Error = Class.new(StandardError)` for business-rule failures.** Each service defines its own inner `Error` class. Bare `return` inside `ActiveRecord::Base.transaction` exits without triggering a rollback — any writes before the return are committed. Use `raise` on failure paths so Rails rolls back the transaction.
- **Redemptions are immutable financial records.** `User has_many :redemptions, dependent: :restrict_with_error`. Do not change this to `:destroy` or `:nullify`.
- **`points_spent` is frozen at redemption time.** Do not recompute from `reward.cost` — reward costs can change after the fact.
- **The CHECK constraint `points_balance >= 0` is a backstop, not the primary guard.** Application-level checks must catch insufficient balance first; the constraint exists for code paths that bypass the service.
- **`Reward.listed` is the scope for active rewards.** `scope :active` is intentionally avoided because it shadows the boolean column attribute.
- **Serializers must not call `root_key`.** `serializable_hash` returns bare objects and arrays; this is the contract `../docs/API.md` documents and what the frontend depends on.

## Patterns to NOT use

- Controller specs (use request specs).
- Manual params parsing (use `params.require/permit`).
- Business logic in models or controllers (use service objects).
- `return` for early exit inside `ActiveRecord::Base.transaction` (use `raise`).
- Aliases that rename existing methods (reduces readability).
- Unused methods or scopes (every line is reviewed; delete dead code).
- `dependent: :destroy` on associations that represent audit/financial history.

## Concurrency tests

Real-thread tests need DatabaseCleaner with `:truncation` strategy because FactoryBot records in transactional fixtures are invisible to worker threads. The setup in `spec/rails_helper.rb` switches strategies based on the `:concurrency` metadata tag. Tag any spec that spawns threads:

```ruby
RSpec.describe SomeService, :concurrency do
  # ...
end
```

Use `Concurrent::CyclicBarrier` to make threads rendezvous at the operation boundary. Without a barrier, the test passes trivially even with broken locking.

## When in doubt

Convention over invention. If a Rails generator would produce this, use the generator. If a battle-tested gem solves this, use the gem. If you find yourself writing framework-style code (auth, JSON serialization, job queues) by hand, stop and surface the decision.
