# frontend/AGENTS.md

Frontend-specific conventions. Read `../AGENTS.md` first for repo-wide rules.

## Where to find canonical examples

- **Read path** — `src/features/rewards/`. The full pattern: `types.ts` → `api.ts` → `hooks.ts` → `components/RewardList.tsx` (skeleton + empty + error states). Copy this shape for any new read-only feature.
- **Mutation + error handling** — `src/features/redemptions/hooks.ts` (`useRedeemReward`) for the mutation hook shape, and `src/features/rewards/components/RedeemConfirmModal.tsx` for the component consuming it.
- **MSW test setup** — `src/test/handlers.ts` (default handler array) + `src/test/setup.ts` (`onUnhandledRequest: 'error'`). Copy the test wrapper pattern from any `*.test.tsx` in `features/`.

## Verification

```bash
pnpm check           # full gate: eslint, tsc -b --noEmit, vitest, vite build
pnpm lint            # eslint only
pnpm typecheck       # tsc -b --noEmit only
pnpm test            # vitest run only
pnpm test:watch      # vitest in watch mode during development
```

A change is not done until `pnpm check` passes clean.

**`tsc -b` quirk:** The root `tsconfig.json` has `"files": []` — bare `tsc --noEmit` silently checks zero files and exits green. The `typecheck` script is `tsc -b --noEmit`, which follows the project references to `tsconfig.app.json` and `tsconfig.node.json` and actually checks app source. Do not change it back.

## Adding a new feature folder

Follow this order:

1. `src/features/<name>/types.ts` — TypeScript interfaces matching the API response shapes in `../docs/API.md`.
2. `src/features/<name>/api.ts` — fetcher functions using `apiClient` from `src/lib/api-client.ts`.
3. `src/lib/query-keys.ts` — add the new key to the `queryKeys` object. Never hard-code key arrays inline.
4. `src/features/<name>/hooks.ts` — `useQuery` / `useMutation` wrappers. Mutations must invalidate all affected keys on success and fire `toast.success`.
5. `src/features/<name>/components/` — components with loading skeleton, empty state, and error state.
6. `src/test/handlers.ts` — add a default MSW handler for every new endpoint. Missing handlers cause `onUnhandledRequest: 'error'` to fail all tests that render any component touching that endpoint.
7. Write at least one component test per new component.
8. Run `pnpm check`.

## Conventions specific to this codebase

- **Feature-folder isolation.** Each `features/<name>/` owns its `types.ts`, `api.ts`, `hooks.ts`, and `components/`. `src/components/` is for presentational primitives only — no hooks, no API calls, no feature logic.
- **`queryKeys` is the single source of truth.** All three keys (`user`, `rewards`, `redemptions`) are declared in `src/lib/query-keys.ts`. Use `queryKeys.rewards`, not `['rewards']` inline. New features add their key here before writing any hook.
- **Mutation invalidation pattern.** On `onSuccess`, invalidate every key that could be stale and call `toast.success`. On `onError`, read `error.message` if it is an `ApiError` (which already holds `errors[0]` from the Rails JSON body) — never show a generic "Error" string. See `useRedeemReward` for the exact shape.
- **Modal error-recovery state machine.** After a failed mutation: (1) surface `error.message` inline with `role="alert"`, (2) replace the Cancel + Confirm button pair with a single Close button, (3) keep the modal open. On all close paths (Cancel, Close, ESC, overlay click) call `reset()` before `onClose()` so the next open starts with a clean mutation state.
- **`erasableSyntaxOnly: true`** (set in `tsconfig.app.json`) bans TypeScript parameter properties. Do not write `constructor(public readonly foo: T)`. Declare the field explicitly above the constructor body and assign in the body.
- **`available: false` means out of stock, not inactive.** The rewards endpoint already filters `active: false` rewards server-side — the frontend never sees them. `available: false` on a returned reward means the item is in stock but currently at zero. Treat it as "out of stock" in UI copy; do not assume or test for inactive-reward logic on the frontend.
- **Disabled buttons need a focusable wrapper for tooltips.** Disabled elements suppress pointer events, so `Tooltip.Trigger` won't fire. Wrap the disabled button in `<span tabIndex={0}>` and use that as the trigger. See `RedeemButton.tsx`.
- **`useRedeemReward` lives in the modal, not the button.** One modal mount = one mutation instance. Moving it to `RedeemButton` would create an instance per card, orphaning `isPending` and `error` state when the modal closes.

## Patterns to NOT use

- `useEffect` + `useState` ladders for async data — use React Query (`useQuery` / `useMutation`).
- Hard-coded query key arrays inline — use `queryKeys.*` from `src/lib/query-keys.ts`.
- Parameter properties in class constructors (`public readonly foo: T`) — banned by `erasableSyntaxOnly`.
- `window.alert`, `window.confirm`, `document.querySelector` — use modals and React refs.
- `any` without a comment explaining why the type system cannot express the constraint.
- API calls or hook invocations inside `src/components/` — that folder is presentational only.
- Adding a new endpoint call without a matching default MSW handler — `onUnhandledRequest: 'error'` will break every test that renders the affected component tree.
