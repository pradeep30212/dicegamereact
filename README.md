# Winner Stays On — Dice Game

A multiplayer "winner stays on" dice game built with React + Redux Toolkit,
with JWT-based auth services ready to plug into a .NET Core Web API.

## 1. Setup instructions

```bash
npm install
cp .env.example .env   # then point REACT_APP_API_BASE_URL at your API
npm start
```

Dependencies installed by `npm install` (already listed in `package.json`):

- `react`, `react-dom` — UI
- `@reduxjs/toolkit`, `react-redux` — state management
- `axios` — HTTP client for the auth services
- `react-scripts` — CRA build tooling

## 2. Project structure

```
src/
  app/store.js                   Redux store
  features/game/gameSlice.js     Local dice rules reference (not wired into App.js)
  features/auth/authSlice.js     Auth state (login/register/refresh/logout)
  features/groups/groupsSlice.js Dashboard list + live state of the joined group
  services/tokenService.js       In-memory access-token holder
  services/api.js                Axios instance: attaches JWT, auto-refreshes on 401
  services/authService.js        Thin wrappers around the auth endpoints
  services/groupService.js       Thin wrappers around the group endpoints
  components/Dashboard.js        Lists groups, join a group with room
  components/GameArena.js        Active match, dice, roll button, queue, history
  components/Login.js            Login / register form
  components/Setup.js            Local-only setup form (not wired into App.js)
  App.js                         Auth bootstrap + screen routing
```

## 3. Dice rules (see `gameSlice.js` for the implementation)

Given a roll `(die1, die2)` — order doesn't matter, so it's sorted before
comparison:

- **Lose**: (1,1), (1,2), (2,2), (4,4) — the roller loses the match; the
  other active player wins and stays on.
- **Win**: (3,3), (5,5), (6,6), (5,6) — the roller wins and stays on.
- **Neutral**: anything else — no decision, turn passes to the other active
  player.

On a win or loss: the loser goes to the **back of the waiting queue**, the
next person in the queue steps up against the winner, and the winner rolls
first against the new challenger. If the queue is empty when a match ends,
the game is over and the winner is declared for the whole group.

## 4. Auth: expected .NET Core Web API contract

The frontend assumes short-lived JWT **access tokens** returned in the
response body, and a long-lived **refresh token** issued as an **HttpOnly,
Secure, SameSite** cookie (never exposed to JavaScript). This is the standard
mitigation against refresh-token theft via XSS — if an attacker injects a
script, they can't read an HttpOnly cookie.

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/api/auth/register` | POST | `{ username, password, displayName }` | `{ accessToken, expiresIn, user }` + sets refresh cookie |
| `/api/auth/login` | POST | `{ username, password }` | `{ accessToken, expiresIn, user }` + sets refresh cookie |
| `/api/auth/refresh` | POST | *(none — reads refresh cookie)* | `{ accessToken, expiresIn, user }` |
| `/api/auth/logout` | POST | *(none — reads refresh cookie)* | `204`, revokes refresh token server-side |
| `/api/auth/me` | GET | *(Bearer token)* | `{ id, username, displayName }` |

On the .NET side, that typically means:

- Issue the access token as a standard JWT (`System.IdentityModel.Tokens.Jwt`),
  short-lived (5–15 min), signed with a server-side secret/key.
- Issue the refresh token as an opaque random value, stored (hashed) server-side
  against the user, with an expiry — and set it via
  `Response.Cookies.Append("refreshToken", token, new CookieOptions { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict, Expires = ... })`.
- Enable CORS with `AllowCredentials()` for your React origin so
  `withCredentials: true` requests carry the cookie.
- On `/auth/refresh`, validate the cookie's token against the stored hash,
  rotate it (issue a new refresh token, invalidate the old one), and return a
  new access token.

## 5. How the frontend uses auth

- `tokenService.js` keeps the access token **in memory only** (a JS module
  variable) — never in `localStorage`. That's why `App.js` calls
  `bootstrapAuth()` once on load: a page refresh clears the in-memory token,
  so the app silently swaps the refresh cookie for a new access token.
- `api.js` is a shared Axios instance: every request gets
  `Authorization: Bearer <token>` attached automatically, and a 401 response
  triggers exactly one `/auth/refresh` call (concurrent 401s queue and reuse
  it) before retrying the original request.

## 6. Dashboard & groups: server-authoritative multiplayer

Since each browser tab is a different logged-in user, the queue/turn/dice
state can't live only in one tab's Redux store anymore — every tab needs to
see the same shared state for a group. The game is now **server-authoritative**:
the .NET API owns each group's state, and every client polls it.

Flow: **Login → Dashboard → Game Arena**. `Setup.js` and `gameSlice.js` are
no longer wired into `App.js` — they're left in the project as a local/offline
reference implementation of the same dice rules, but the live game now runs
through `groupsSlice.js` / `groupService.js` instead.

### New files

- `src/services/groupService.js` — Axios calls for the group endpoints.
- `src/features/groups/groupsSlice.js` — dashboard list + the currently
  joined group's live state, including polling support.
- `src/components/Dashboard.js` / `Dashboard.css` — lists the admin-configured
  groups and lets the user join one that isn't full.

### Expected .NET Core API contract

| Endpoint | Method | Response |
|---|---|---|
| `/api/groups` | GET | `[{ id, name, memberCount, maxMembers, status }]` |
| `/api/groups/{id}` | GET | full group state (below) — used for polling |
| `/api/groups/{id}/join` | POST | full group state; adds caller to the back of the queue, or into `activePlayers` if fewer than 2 are active |
| `/api/groups/{id}/roll` | POST | full group state with the roll resolved server-side; `403` if it isn't the caller's turn |
| `/api/groups/{id}/leave` | POST | `204`; removes caller from the group |

Full group state shape (mirrors the original `gameSlice` shape so the UI
translated over almost unchanged):

```json
{
  "id": "galaxy",
  "name": "Group Galaxy",
  "maxMembers": 5,
  "activePlayers": ["Pradeep", "Sunil"],
  "waitingQueue": ["Asha"],
  "currentTurn": "Pradeep",
  "diceValues": [null, null],
  "gameHistory": ["Group Galaxy kicked off: Pradeep vs Sunil."],
  "status": "playing",
  "winner": null
}
```

The caller is identified from the JWT on every request — the client never
sends its own name, which is what stops one tab from rolling or joining as
someone else. The dice logic itself (win/loss/neutral combos, queue
rotation) should be ported server-side from `evaluateRoll` in
`gameSlice.js` — the rules are identical, just enforced on the server now.

`GameArena.js` polls `GET /api/groups/{id}` every 3 seconds while a group is
open, so other players' rolls and queue changes show up without a refresh.
For lower latency and less polling overhead, consider swapping this for a
SignalR hub pushing state updates on each roll/join/leave instead.

