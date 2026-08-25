# Fix All Login System Issues

Fix 6 interconnected issues in the auth/login system: unmounted routes, broken schema, no shared auth state, no run persistence, no run-saving API, and broken sign-out.

## Proposed Changes

### Backend — Schema & Route Fixes

#### [MODIFY] [user.model.js](file:///d:/RailType-India/backend/models/user.model.js)
- Add missing `picture` field (`type: String`) — currently `googleLogin` saves it, but Mongoose silently drops it because it's not in the schema.
- Add `totalRuns` field (`type: Number, default: 0`) — `ProfileDashboard` already tries to display `user.totalRuns`.
- Add `stamps` field (`type: Number, default: 0`) — `ProfileDashboard` already tries to display `user.stamps`.

#### [MODIFY] [index.js](file:///d:/RailType-India/backend/index.js)
- Import `userRoutes` and mount it: `app.use("/api/users", userRoutes)`
- Import `runRoutes` (new) and mount it: `app.use("/api/runs", runRoutes)`

---

### Backend — Run Saving API

#### [NEW] [runRoutes.js](file:///d:/RailType-India/backend/routers/runRoutes.js)
- `POST /api/runs` — save a single run (requires auth via `protect` middleware)
- `POST /api/runs/bulk` — save multiple guest runs on first login (requires auth)
- `GET /api/runs/mine` — get the logged-in user's run history (requires auth)

#### [NEW] [run.controller.js](file:///d:/RailType-India/backend/controllers/run.controller.js)
- `saveRun` — validate & save a single run document, increment `user.totalRuns`
- `bulkSaveRuns` — accept an array of guest runs, save them all, update `user.totalRuns` accordingly
- `getMyRuns` — return runs for the logged-in user, sorted by most recent

---

### Frontend — Shared Auth Context

#### [NEW] [AuthContext.jsx](file:///d:/RailType-India/frontend/src/context/AuthContext.jsx)
- Create a React Context that holds `{ user, token, login, logout, loading }`
- On mount: reads `token` from `localStorage`, calls `/api/users/profile` to restore session
- `login(googleAccessToken)`: calls `POST /api/users/google`, stores JWT, sets user, **then checks localStorage for guest runs and bulk-syncs them**
- `logout()`: clears token from localStorage, clears user state — solves the sign-out bug where AuthIcon kept showing the avatar

#### [MODIFY] [main.jsx](file:///d:/RailType-India/frontend/src/main.jsx)
- Wrap `<App />` with `<AuthProvider>`

#### [MODIFY] [AuthIcon.jsx](file:///d:/RailType-India/frontend/src/components/AuthIcon.jsx)
- Remove all local `user` state, `useEffect` session restoration, and the `useGoogleLogin` hook's direct fetch logic
- Instead, consume `useAuth()` from context: `const { user, login, logout } = useAuth()`
- Becomes a thin ~30-line presentational component

#### [MODIFY] [ProfileDashboard.jsx](file:///d:/RailType-India/frontend/src/components/ProfileDashboard.jsx)
- Replace the local token-fetch logic with `const { user, logout } = useAuth()`
- `handleSignOut` calls `logout()` (which clears state globally)

---

### Frontend — Guest Run Persistence

#### [NEW] [guestRuns.js](file:///d:/RailType-India/frontend/src/utils/guestRuns.js)
Utility module for managing guest (unauthenticated) runs in `localStorage`:
- `saveGuestRun(runData)` — appends a run to `localStorage["railtype-guest-runs"]`
- `getGuestRuns()` — returns the array of saved guest runs
- `clearGuestRuns()` — wipes guest runs after they've been synced to the backend

#### [MODIFY] [SummaryPage.jsx](file:///d:/RailType-India/frontend/src/components/SummaryPage.jsx)
- On mount: if user is logged in (`useAuth()`), `POST /api/runs` to save the run to the backend
- If user is NOT logged in, call `saveGuestRun()` to persist to localStorage
- This is where runs get captured — right now they're displayed and discarded

---

## Data Flow: Guest → New User Sync

This is the key flow you asked about:

```
Guest plays 5 games
  └─ Each SummaryPage calls saveGuestRun() → localStorage

Guest clicks 👤 → Google Login
  └─ AuthContext.login() is called
      ├─ POST /api/users/google → gets JWT + user
      ├─ Checks localStorage for guest runs
      ├─ If guest runs exist:
      │   └─ POST /api/runs/bulk with all guest runs
      │   └─ clearGuestRuns() from localStorage
      └─ Sets user state globally
```

## Open Questions

> [!IMPORTANT]
> **Guest run cap**: Should we limit how many guest runs are stored in localStorage? Suggest capping at **50 runs** to avoid bloating storage.

> [!IMPORTANT]
> **Run deduplication**: When bulk-syncing guest runs, should we check for duplicate runs (e.g., same `cityId + lineId + timeMs + timestamp`)? Or just insert all? I'll go with insert-all unless you say otherwise.

## Verification Plan

### Manual Verification
1. Start backend → confirm routes respond (no more 404s)
2. Click 👤 → Google popup → login succeeds → avatar appears
3. Navigate to `/profile` → user data loads correctly (name, picture, totalRuns, stamps)
4. Sign out from profile → avatar resets to 👤 immediately (no page refresh needed)
5. Play a game as guest → check `localStorage["railtype-guest-runs"]` has the run
6. Log in → confirm guest runs are synced and cleared from localStorage
7. Play a game while logged in → confirm run is saved directly to backend
