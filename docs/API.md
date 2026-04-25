# API Reference

Base URL: `http://localhost:3000` (development)

## Authentication

All endpoints require an `X-User-Id` header containing the numeric ID of the acting user.

```
X-User-Id: 1
```

**This is a deliberate scope cut.** The header exists purely to identify the current user during development without requiring a full auth flow. In production this would be replaced by `Authorization: Bearer <jwt>` issued by Devise + devise-jwt; the `current_user` method in `ApplicationController` would verify the token and resolve the same `User` record. Nothing else in the codebase needs to change — the auth seam is confined to that one method.

---

## Endpoints

### GET /api/v1/user

Returns the current user's profile, including their live points balance.

**Note on path shape:** `resource :user` (singular) is used deliberately — there is no concept of looking up *a* user by id in this API, only *the* current user. A plural collection route (`/users`) would imply browsing other users, which is out of scope. `/me` is a common convention but requires a custom route; Rails' singular resource generates `/user` out of the box and is unambiguous given that auth identifies exactly one user per request.

| | |
|---|---|
| **Headers** | `X-User-Id: <id>` |
| **Body** | none |
| **Success** | `200 OK` |
| **Auth failure** | `401 Unauthorized` |

**Response body**
```json
{
  "id": 1,
  "email": "demo@example.com",
  "name": "Demo User",
  "points_balance": 1500
}
```

**curl**
```bash
curl http://localhost:3000/api/v1/user \
  -H "X-User-Id: 1"
```

---

### GET /api/v1/rewards

Returns all active rewards, ordered by cost ascending. Includes `available` (a computed field — false when out of stock) so the frontend can render redeem-button state without a second request.

| | |
|---|---|
| **Headers** | `X-User-Id: <id>` |
| **Body** | none |
| **Success** | `200 OK` — bare array |
| **Auth failure** | `401 Unauthorized` |

**Response body**
```json
[
  {
    "id": 2,
    "name": "Coffee Size Upgrade",
    "description": "Upgrade any drink to next size",
    "cost": 100,
    "category": "Coffee",
    "stock": null,
    "active": true,
    "available": true
  },
  {
    "id": 4,
    "name": "Free Lunch Sandwich",
    "description": "One free sandwich",
    "cost": 800,
    "category": "Food",
    "stock": 0,
    "active": true,
    "available": false
  }
]
```

`stock: null` means unlimited. `available: false` means the reward exists but cannot be redeemed (out of stock or inactive).

**curl**
```bash
curl http://localhost:3000/api/v1/rewards \
  -H "X-User-Id: 1"
```

---

### POST /api/v1/redemptions

Redeems a reward for the current user. Checks balance and availability inside a pessimistic-locked transaction — exactly one redemption is created even under concurrent requests.

Returns the created redemption with the reward nested inside. The `points_spent` field is frozen at redemption time; it will not change if the reward's cost changes later.

| | |
|---|---|
| **Headers** | `X-User-Id: <id>`, `Content-Type: application/json` |
| **Body** | `{"redemption": {"reward_id": <id>}}` |
| **Success** | `201 Created` |
| **Business failure** | `422 Unprocessable Entity` |
| **Auth failure** | `401 Unauthorized` |

**Success response body**
```json
{
  "id": 1,
  "points_spent": 200,
  "created_at": "2026-04-25T14:00:00.000Z",
  "reward": {
    "id": 1,
    "name": "Free Coffee",
    "description": "Any coffee on us",
    "cost": 200,
    "category": "Coffee",
    "stock": 49,
    "active": true,
    "available": true
  }
}
```

**Failure response body** (insufficient balance, out of stock, reward not found)
```json
{
  "errors": ["Insufficient points"]
}
```

**curl**
```bash
curl -X POST http://localhost:3000/api/v1/redemptions \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{"redemption": {"reward_id": 1}}'
```

---

### GET /api/v1/redemptions

Returns the current user's full redemption history, newest first. Each entry includes the reward as it was at redemption time (`points_spent` is the frozen snapshot).

| | |
|---|---|
| **Headers** | `X-User-Id: <id>` |
| **Body** | none |
| **Success** | `200 OK` — bare array (empty array if no history) |
| **Auth failure** | `401 Unauthorized` |

**Response body**
```json
[
  {
    "id": 2,
    "points_spent": 100,
    "created_at": "2026-04-25T14:05:00.000Z",
    "reward": {
      "id": 2,
      "name": "Coffee Size Upgrade",
      "description": "Upgrade any drink to next size",
      "cost": 100,
      "category": "Coffee",
      "stock": null,
      "active": true,
      "available": true
    }
  },
  {
    "id": 1,
    "points_spent": 200,
    "created_at": "2026-04-25T14:00:00.000Z",
    "reward": {
      "id": 1,
      "name": "Free Coffee",
      "description": "Any coffee on us",
      "cost": 200,
      "category": "Coffee",
      "stock": 49,
      "active": true,
      "available": true
    }
  }
]
```

**curl**
```bash
curl http://localhost:3000/api/v1/redemptions \
  -H "X-User-Id: 1"
```
