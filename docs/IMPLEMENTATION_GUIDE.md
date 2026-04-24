# Thanx Take-Home: A Senior/Staff Engineer's Implementation Guide

## What This Guide Synthesizes

Every "do" and "don't" below maps to actual praise or criticism from Thanx senior engineers reviewing prior submissions. The bar is consistently described as **Senior to Staff Engineer**, with three concentrated emphases:

1. **Concurrency-safe transactional integrity** in the redemption flow — the single most-flagged area.
2. **Modern React fluency**, not just backend competence — multiple candidates lost on this alone.
3. **Code an AI agent (or a future engineer) can navigate, modify, and verify confidently.**

That third point is load-bearing here. Thanx is investing in agent-driven development, which means the deliverable is judged on how *legible* and *conventional* it is. Idiosyncratic solutions, hand-rolled framework features, missing tests, and unclear file organization all hurt because they break the patterns an agent (or reviewer) relies on to predict where things live.

---

## 1. Stack & Setup

| Layer | Required | Notes |
|---|---|---|
| Ruby | 3.4.3 | Pin in `.ruby-version` |
| Rails | 8.0.2 | **Use `--api` mode** |
| React | >16 | Modern only: hooks, functional components |
| DB | SQLite | Acceptable per spec; still apply real indexes & constraints |

Generate the backend with `rails new backend --api --database=sqlite3`. Multiple reviewers explicitly flagged "no usage of Rails API mode" as a negative.

The frontend is a separate Vite + React + **TypeScript** app. TypeScript is implicitly expected — Feedback 1 explicitly flagged "does not demonstrate any familiarity with React, Typescript, etc."

---

## 2. The Redemption Flow — The Most Important Code in the Submission

Almost every reviewer commented on this. Get it wrong and the submission fails regardless of polish elsewhere.

### Required properties

1. Wrap the operation in `ActiveRecord::Base.transaction`.
2. **Take a pessimistic lock on the user inside the transaction** (`user.lock!` or `User.lock.find(id)`), *before* checking balance.
3. Re-read the points balance from the locked record. Do not trust the controller's user object.
4. Re-check reward availability inside the lock (in case stock matters).
5. Decrement balance, create the Redemption row, decrement reward stock — all in one transaction.
6. On any validation failure, raise to roll back; never leave half-applied state.
7. The endpoint is idempotent against duplicate clicks (use a client-supplied request key OR a uniqueness constraint that's safe to retry).

### Architectural pattern: Command / Interactor object

The redemption logic does **not** belong in the controller and does **not** belong as a fat method on `User`. Reviewers explicitly praised "command object pattern, thin controllers" and explicitly criticized "redemption code inside model."

```ruby
# app/services/redemptions/create.rb
module Redemptions
  class Create
    Result = Struct.new(:success?, :redemption, :errors, keyword_init: true)

    def self.call(**args) = new(**args).call

    def initialize(user:, reward_id:)
      @user = user
      @reward_id = reward_id
    end

    def call
      ActiveRecord::Base.transaction do
        locked_user = User.lock.find(@user.id)
        reward = Reward.lock.find(@reward_id)

        return failure("Reward unavailable") unless reward.available?
        return failure("Insufficient points") if locked_user.points_balance < reward.cost

        locked_user.update!(points_balance: locked_user.points_balance - reward.cost)
        reward.update!(stock: reward.stock - 1) if reward.stock.present?

        redemption = Redemption.create!(
          user: locked_user,
          reward: reward,
          points_spent: reward.cost
        )

        success(redemption)
      end
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotFound => e
      failure(e.message)
    end

    private

    def success(redemption) = Result.new(success?: true, redemption: redemption, errors: [])
    def failure(msg)        = Result.new(success?: false, redemption: nil, errors: [msg])
  end
end
```

### Reviewer phrases this addresses verbatim

- "Affordability check outside transaction and locks"
- "No pessimistic locks → race condition"
- "Balance check relies on stale user object"
- "Concurrency handling flaws"
- "Response in the redemption endpoint is messy (passing remaining points balance in the response)" — return the redemption resource only; let the client refetch balance.

---

## 3. Database Design

Reviewers read migrations carefully. Several called out missing constraints, missing indexes, and missing uniqueness.

### Required for every table

- `NOT NULL` on every required column
- DB-level uniqueness wherever the model claims uniqueness
- Indexes on every foreign key
- Compound indexes where queries demand them (e.g., `[user_id, created_at]` on redemptions)
- Check constraints for invariants (e.g., `points_balance >= 0`)

### Schema sketch

```ruby
create_table :users do |t|
  t.string  :email,          null: false
  t.string  :name,           null: false
  t.integer :points_balance, null: false, default: 0
  t.timestamps
  t.index :email, unique: true
  t.check_constraint "points_balance >= 0", name: "users_points_balance_non_negative"
end

create_table :rewards do |t|
  t.string  :name,        null: false
  t.text    :description
  t.integer :cost,        null: false
  t.string  :category,    null: false
  t.integer :stock                       # nullable = unlimited
  t.boolean :active,      null: false, default: true
  t.timestamps
  t.index :category
  t.index [:active, :cost]
  t.check_constraint "cost > 0", name: "rewards_cost_positive"
end

create_table :redemptions do |t|
  t.references :user,   null: false, foreign_key: true
  t.references :reward, null: false, foreign_key: true
  t.integer :points_spent, null: false   # frozen at redemption time
  t.timestamps
  t.index [:user_id, :created_at]
end
```

### Validations live in two places

- Model: `validates :points_balance, numericality: { greater_than_or_equal_to: 0 }` — for friendly errors
- DB: `CHECK (points_balance >= 0)` — for actual safety

Do not skip the DB-level guard. A reviewer wrote: "user has no balance validation for negative values."

---

## 4. Models

**Do:**
- Use scopes for reusable queries (`Reward.affordable_for(user)` as a scope, not an instance method on User).
- Preserve redemption history immutably — Redemptions are append-only and store `points_spent` (don't recompute from current `reward.cost`; cost can change).
- Keep models slim. Business logic goes in service objects.

**Don't:**
- Add aliases that obscure meaning ("Unnecessary aliases => makes the code less readable").
- Add methods that exist only to be called from specs ("Method `redeem_reward` is only called from specs").
- Add unused methods at all — every line is reviewed.

---

## 5. Controllers

```ruby
class Api::V1::RedemptionsController < ApplicationController
  before_action :authenticate_user!

  def index
    redemptions = current_user.redemptions.includes(:reward).order(created_at: :desc)
    render json: RedemptionSerializer.new(redemptions).serializable_hash
  end

  def create
    result = Redemptions::Create.call(
      user: current_user,
      reward_id: redemption_params[:reward_id]
    )

    if result.success?
      render json: RedemptionSerializer.new(result.redemption).serializable_hash, status: :created
    else
      render json: { errors: result.errors }, status: :unprocessable_entity
    end
  end

  private

  def redemption_params
    params.require(:redemption).permit(:reward_id)
  end
end
```

### Rules reviewers will check

- Use `before_action` for shared setup. Don't repeat user lookups across actions.
- Use Rails strong parameters (`params.require/permit`). Do **not** parse params manually.
- Be consistent: if one endpoint uses a serializer, all related endpoints use serializers.
- Don't return the whole `User` object from random endpoints. Be deliberate about API surface.
- No hard-coded paths inside controller methods.
- Namespace under `Api::V1::` from day one — versioning is convention, signals senior-level thinking.

---

## 6. Authentication

The spec doesn't strictly require auth. If you implement it, **use a library**. Reviewers flagged "Manually implementing authentication and password logic instead of using a library like Devise is a bold choice" with concerns about "potential information disclosure and no rate limiting."

Pragmatic options, in order of recommendation:
1. **`devise` + `devise-jwt`** for token auth from React.
2. **`has_secure_password`** with Rails 8's built-in authentication generator (`rails generate authentication`).
3. **Faked auth via a seeded `current_user`** — only acceptable if you call this out explicitly in the README as a deliberate scope cut. Don't half-build auth.

Add `rack-attack` for rate limiting if you ship real auth — reviewers noted absence of rate limiting as a security concern.

---

## 7. Background / Async Work

Feedback 2 flagged "no async reward redemption handling." For an app this size, the right answer is:
- Use Solid Queue (Rails 8 default) for jobs.
- Add a `RedemptionConfirmationJob` to send notifications (even if it's a no-op stub) — this demonstrates you know where async belongs without over-engineering.

**Don't make the redemption itself async** — that breaks the user expectation. The redemption is synchronous and transactional; the *side effects* (notifications, analytics events) are async.

```ruby
# Inside Redemptions::Create, after the transaction commits:
RedemptionConfirmationJob.perform_later(redemption.id)
```

---

## 8. Serialization

Use a deliberate serializer library — `alba` (fast, modern) or `jsonapi-serializer`. Apply it consistently. Don't sprinkle `to_json`, `as_json` overrides, and serializer calls across different endpoints — reviewers explicitly call this out as inconsistent.

A small serializer registry is fine. Don't over-engineer per-endpoint serializers if one shape works.

---

## 9. Frontend: Where Most Candidates Lose

> "Does not demonstrate any familiarity with React, Typescript, etc."  
> "UI is not tested — underscoring why shouldn't have been written in react"  
> "Using Old way react patterns (Class based components)"  
> "Frontend async fetch is not implemented well"

### Required posture

- **TypeScript**, strict mode (`"strict": true` in `tsconfig.json`).
- **Functional components + hooks only**. Zero class components.
- **Vite** for tooling.
- **TanStack Query (React Query)** or **SWR** for data fetching. Hand-rolled `useEffect` + `useState` ladders are exactly what reviewers mean by "frontend async fetch is not implemented well."
- **React Router** for routing.
- **Tailwind CSS** for styling.
- **Component primitives** from Radix UI / shadcn/ui — saves time, raises polish, gives accessibility for free.
- **Sonner** or **react-hot-toast** for notifications. No `setTimeout` on success messages.

### Component organization (feature-based)

```
src/
  features/
    rewards/
      components/
        RewardCard.tsx
        RewardList.tsx
        RewardFilters.tsx
        RedeemButton.tsx
        RedeemConfirmModal.tsx
      api.ts            # API calls scoped to rewards
      types.ts
      hooks.ts          # useRewards, useRedeemReward
    redemptions/
      components/
        RedemptionHistory.tsx
        RedemptionRow.tsx
      api.ts
      types.ts
      hooks.ts
    points/
      components/
        PointsBalance.tsx
      api.ts
      hooks.ts
  components/           # genuinely shared, presentational
    Button.tsx
    Modal.tsx
    Skeleton.tsx
    EmptyState.tsx
    ErrorBoundary.tsx
  lib/
    api-client.ts       # fetch/axios wrapper, auth, error normalization
    query-client.ts     # React Query config
  pages/                # route components, very thin
  App.tsx
  main.tsx
```

Reviewers explicitly complained about poor segregation by responsibility/resource. Feature folders directly answer that critique.

### UX requirements (every row maps to a flagged issue)

| Don't | Do |
|---|---|
| `window.alert("Redeem Browse Rewards for ?")` | Modal confirmation rendering reward name and cost from props |
| Generic "error" toasts | Specific, actionable error messages from the API response body |
| `setTimeout` for success messages | Toast library with proper lifecycle |
| Hard-coded query selectors (`document.querySelector`) | Refs and state only |
| Disabled-only state for redeeming | Button shows spinner during request; refetch (or invalidate) on success |
| Page transitions delayed by setTimeout | Navigate immediately on success, show toast |
| No loading states | Skeleton placeholders for every async list |
| No empty states | "No rewards available" / "No redemption history yet" components |
| No error boundary | Top-level `<ErrorBoundary>` plus route-level fallbacks |

### Specifically required features (drawn from what reviewers praised)

- **Sortable rewards** (by cost, by name).
- **Searchable rewards** (text filter).
- **Categorized rewards** (filter by category).
- **Out-of-stock visual indicator** (greyed out + "Out of stock" badge).
- **Affordable vs unaffordable distinction** (disable redeem button + tooltip explaining why).

---

## 10. Testing

### Backend — RSpec

Required spec types:

- **Request specs** (NOT controller specs). One reviewer wrote: "tests controllers instead of requests."
- **Model specs** for validations and scopes.
- **Service object specs** for the redemption interactor.
- **A concurrency spec** for the redemption flow. Use threads with a shared barrier to fire two redemptions simultaneously and assert exactly one succeeds. **This single test will distinguish you.**

```ruby
# spec/services/redemptions/create_concurrency_spec.rb
require 'rails_helper'

RSpec.describe Redemptions::Create do
  it "prevents double-spend under concurrent requests" do
    user = create(:user, points_balance: 100)
    reward = create(:reward, cost: 100, stock: 5)

    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          described_class.call(user: user, reward_id: reward.id)
        end
      end
    end
    results = threads.map(&:value)

    expect(results.count(&:success?)).to eq(1)
    expect(results.count { |r| !r.success? }).to eq(1)
    expect(user.reload.points_balance).to eq(0)
    expect(Redemption.count).to eq(1)
  end
end
```

Stack: `rspec-rails`, `factory_bot_rails`, `faker`, `shoulda-matchers`.

### Frontend — Vitest + React Testing Library

Use **MSW (Mock Service Worker)** to mock the API at the network layer (not by stubbing fetch).

At minimum:
- Rewards list test: renders, filters by search, sorts by cost.
- Redemption flow test: click redeem → modal opens with reward name + cost → confirm → API called → toast shown → history updated.
- Error state test: API returns 422 → user sees the actual error message, not "error".

The complete absence of frontend tests is the single most-cited weakness across the feedback. Even three solid component tests will put you ahead.

---

## 11. Code Quality & Tooling

Run before submitting:

```bash
# Backend
bundle exec rubocop -A
bundle exec rspec
bundle exec brakeman --no-pager
bundle exec bundle-audit check

# Frontend
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

A reviewer literally wrote: "Has the latest rubocop gem, but didn't run it - 35 files inspected, 35 offenses detected, 29 offenses autocorrectable." **Run rubocop. Run rubocop. Run rubocop.**

Recommended additional gems:
- `rubocop-rails`, `rubocop-rspec`, `rubocop-performance`
- `bullet` in development to catch N+1s before reviewers do.

---

## 12. Documentation: AGENTS.md and README

This is where the **agentic posture** matters most explicitly.

### `README.md`
- Setup commands (`bin/setup`).
- How to run the app (backend + frontend) in separate terminals.
- How to run tests.
- Brief architecture section (one diagram or three paragraphs).
- "Trade-offs and what I'd do with more time" section — reviewers respect honest scope cuts more than they respect missing features pretending to be complete.
- Deployment notes (even if just "would deploy via Fly.io / Render"). Feedback 3 flagged "No deployment information is provided."

### `AGENTS.md` (or `CLAUDE.md`)

Since Thanx is investing heavily in agentic development, including this is a strong signal — it says you've thought about how this code will be modified by both humans and agents after you're done. Cover:

- **Codebase structure** — where to find what, with the feature-folder mental model spelled out.
- **Commands the agent should run for verification** — `bin/test`, `bin/lint`, `bin/typecheck`. Make these scripts exist.
- **Conventions to follow** — service object pattern, request spec style, feature folder pattern, alba serializers.
- **Patterns to NOT use** — no business logic in models, no class components, no bypassing strong params, no `window.alert`, no `document.querySelector`.
- **End-to-end recipe for adding a feature** — migration → model → service → controller → serializer → spec → frontend types → API hook → component → component test.

---

## 13. Decision-Making Heuristics

When the spec is silent, ask:

1. **"Would a Rails generator do this for me?"** If yes, use it. Reviewers flagged "writes functions that are available in the framework."
2. **"Is there a battle-tested gem?"** Devise > hand-rolled auth. Solid Queue > hand-rolled job runners. Alba > hand-rolled JSON.
3. **"Is this convention or invention?"** Convention wins unless invention has a documented reason. Idiosyncratic patterns hurt agent legibility and reviewer trust.
4. **"Could two requests to this endpoint, arriving simultaneously, corrupt state?"** If yes, you need transaction + lock + DB constraint backstop.
5. **"Will a future engineer (or agent) know where to look for this code?"** Feature folders, service objects in `app/services`, jobs in `app/jobs`. No surprises.
6. **"Am I building something that wasn't asked for?"** Cut it. A reviewer wrote: "implemented extra functionality that was not required, and increases the code's surface area."
7. **"Is the response shape obvious?"** Return the resource you created/modified. Don't bundle unrelated state into the response.

---

## 14. Scope Discipline

The spec asks for four things:
1. Get points balance.
2. List rewards.
3. Redeem a reward.
4. List redemption history.

That's four endpoints, three or four screens. **Resist:**
- Building a full admin panel.
- Building reward CRUD.
- Building user signup flows (unless authenticating).
- Adding gamification, achievements, leaderboards.

Spend the time saved on: tests, the concurrency test, README polish, AGENTS.md, and the redemption modal flow.

---

## 15. Pre-Submission Checklist

**Backend**
- [ ] `rails new --api` mode
- [ ] Pessimistic lock on user inside redemption transaction
- [ ] Affordability check inside the lock
- [ ] DB constraints: NOT NULL, indexes on FKs, CHECK on `points_balance >= 0`
- [ ] Compound index `[user_id, created_at]` on redemptions
- [ ] Service object for redemption (`Redemptions::Create`)
- [ ] Thin controllers using `before_action` and strong params
- [ ] Serializer library used consistently
- [ ] Idempotent seeds (`find_or_create_by!`, not `create!`)
- [ ] Solid Queue configured, even if used minimally
- [ ] Rubocop clean (zero offenses)
- [ ] Brakeman clean
- [ ] Request specs (not controller specs)
- [ ] Concurrency spec for redemption
- [ ] Model + service + request specs all green

**Frontend**
- [ ] Vite + React + TypeScript (strict mode)
- [ ] Functional components + hooks only
- [ ] React Query (or SWR) for data fetching
- [ ] Feature-folder structure
- [ ] Modal for redemption confirmation showing reward name and cost
- [ ] Loading skeletons for async lists
- [ ] Empty states for every list
- [ ] Error boundary at root + route fallbacks
- [ ] Toast library for success/error feedback
- [ ] Sortable, searchable, categorized rewards
- [ ] Affordable / unaffordable / out-of-stock visual states
- [ ] ESLint + Prettier clean
- [ ] `tsc --noEmit` clean
- [ ] At least 3 component tests + 1 integration test with MSW

**Documentation**
- [ ] README with setup, run, test, architecture, trade-offs, deployment notes
- [ ] AGENTS.md with conventions and verification commands
- [ ] Inline comments only where the *why* isn't obvious — never restating the *what*

**Process**
- [ ] No `node_modules` in zip
- [ ] No `.bundle`, `tmp/`, `log/` in zip
- [ ] All tests pass on a fresh clone (`bin/setup && bin/test`)
- [ ] README setup instructions verified on a fresh checkout

---

## 16. The One-Sentence Summary

**Build a small, conventional, well-tested Rails 8 API + TypeScript React app where the redemption endpoint is transactionally and concurrently bulletproof, the React code looks like 2026 React, and an agent reading the repo for the first time can find anything in under a minute.**
