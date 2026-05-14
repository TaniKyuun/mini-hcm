# mini-hcm Punch Attendance — Implementation Walkthrough

## 1. Architecture at a glance

```
┌─────────────────────┐    Bearer ID token     ┌─────────────────────┐
│  React (Vite)       │  ───────────────────▶  │  Express (Bun)      │
│  - Firebase Auth    │  ◀─── JSON ──────────  │  - Admin SDK        │
│  - React Router     │                        │  - Firestore writes │
└─────────────────────┘                        └─────────────────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────────┐
                                              │  Firestore          │
                                              │  - users            │
                                              │  - attendance       │
                                              │  - dailySummary     │
                                              └─────────────────────┘
```

The browser **never writes to Firestore directly**. It only authenticates with Firebase Auth, then attaches the resulting ID token to every `/api/*` call. The Express server verifies the token, performs all reads/writes through the Admin SDK (which bypasses security rules), and returns plain JSON. Security rules exist as a defense-in-depth fence against a malicious client trying to talk to Firestore directly.

---

## 2. Server (`server/src/`)

### 2.1 Bootstrapping & lib

`server/src/lib/firebase.ts` — Singleton getters for `App`, `Auth`, and the new **`Firestore`** instance. All three are lazily initialized using the service-account credentials from `env.firebase`, so the SDK is initialized exactly once and reused across requests.

`server/src/lib/constants.ts` — Collection names (`USERS_COLLECTION`, `ATTENDANCE_COLLECTION`, `DAILY_SUMMARY_COLLECTION`) plus defaults for new profiles (`DEFAULT_TIMEZONE = 'Asia/Manila'`, `DEFAULT_SCHEDULE = 09:00–18:00`). Centralizing collection names avoids typos that silently create a sibling collection.

`server/src/lib/serialize.ts` — Firestore `Timestamp` objects don't JSON-serialize cleanly (they become `{ _seconds, _nanoseconds }`). Three helpers (`serializeProfile`, `serializeAttendance`, `serializeDailySummary`) convert every `Timestamp` field to ISO-8601 strings before responses leave the server.

`server/src/types/models.ts` — TypeScript shapes for `UserProfile`, `AttendanceDoc`, `DailySummaryDoc`, plus `UserRole`, `UserSchedule`, `ComputedAttendance`. These are the **server-internal** shapes (with `Timestamp`s). The client has parallel types with strings.

### 2.2 Middleware

`authenticateFirebase.ts` (existing) — reads `Authorization: Bearer <token>`, verifies it with Firebase Admin, stashes the `DecodedIdToken` in `res.locals.firebaseUser`. All protected routes mount this.

`server/src/middleware/requireAdmin.ts` — runs after `authenticateFirebase`. Looks up the user's `users/{uid}` doc, returns **403** unless `role === 'admin'`. Used by the entire `/api/admin/*` subtree.

### 2.3 Services (pure-ish business logic)

`server/src/services/computeService.ts` — **The most safety-critical file.** Pure functions, no Firestore I/O. Computes:

- **Lateness** = `max(0, timeIn − scheduledStart)` in minutes
- **Undertime** = `max(0, scheduledEnd − timeOut)` in minutes
- **Regular hours** = overlap between actual `[timeIn, timeOut]` and scheduled `[start, end]`
- **Overtime** = `max(0, timeOut − scheduledEnd)`
- **Night differential** = overlap with `[22:00, 06:00 next day]` in local time, summed across spanned nights

Two non-obvious bits:

- **Overnight shifts** are auto-detected: if `schedule.end <= schedule.start` (e.g., 22:00–06:00), `scheduledEnd` is shifted to the next local calendar day.
- **Timezone conversion** uses `date-fns-tz`'s `fromZonedTime`: schedule strings like `"09:00"` are interpreted in the user's `timezone` and then converted to UTC for comparison with the UTC `timeIn`/`timeOut`. This means a Manila user's "09:00" and a Tokyo user's "09:00" produce different UTC moments — exactly what you want.

`server/src/services/userService.ts` — `getOrCreateUserProfile` is the **auto-bootstrap** that runs the first time any authenticated request hits the server for a user with no `users/{uid}` doc. It creates the doc with defaults (employee role, Manila tz, 09:00–18:00). `updateOwnProfile` lets users edit only `name`, `timezone`, `schedule` (role is admin-only). `adminUpdateProfile` adds `role` and `email`. `listAllProfiles` is for admin reports.

`server/src/services/attendanceService.ts` — five exported operations:

| Function | What it does |
|---|---|
| `findActiveSession(uid)` | One-row lookup: `where userId == uid AND status == 'active' LIMIT 1` |
| `punchIn(profile)` | Refuses if active session exists (throws `AttendanceConflictError` → 409). Creates `{uid}_{YYYY-MM-DD}_{timestamp}` doc with `status: 'active'`. |
| `punchOut(profile)` | Finds active session, fills in `timeOut`, runs `computeHours`, writes back, then triggers `writeDailySummary` for that user/date. |
| `getHistory(uid, start, end)` | Ranged + ordered query (needs composite index) |
| `adminUpdateAttendance(id, input)` | Edits punch times, recomputes, re-aggregates the day. If the edit moved the record to a different `date`, **both** old and new daily summaries are recomputed so neither is stale. |

`server/src/services/summaryService.ts` — `writeDailySummary(db, uid, date)` re-queries all `completed` sessions for that user/date, sums every field of `computed`, and **overwrites** `dailySummary/{uid_date}`. This "recompute from scratch on every change" strategy is deliberately chosen in the system design: it costs an extra read per punch-out but eliminates aggregation drift entirely. `readDailySummary` and `readWeeklySummaries` (which uses doc-ID lookups, no query needed) feed the dashboard. `buildWeekDates(startDate)` generates 7 ISO date strings.

### 2.4 Routes

Mounted in `server/src/app.ts` under these prefixes:

| Prefix | File | Endpoints |
|---|---|---|
| `/api/me` | `routes/users.ts` | `GET`, `PUT` — current user's profile (auto-bootstrap on GET) |
| `/api/attendance` | `routes/attendance.ts` | `GET /active`, `POST /punch-in`, `POST /punch-out`, `GET /history?startDate&endDate` |
| `/api/summary` | `routes/summary.ts` | `GET /daily?date`, `GET /weekly?startDate` |
| `/api/admin` | `routes/admin.ts` | All admin-only: employees CRUD, attendance edit, daily/weekly reports |

Every route handler is typed with `AuthenticatedLocals` (or `AdminLocals` for admin), so `res.locals.firebaseUser.uid` is non-null and strongly typed inside the handler. Errors from the service layer flow through `next(error)` → existing `errorHandler` for 500s, except `AttendanceConflictError` (409) and `NotFoundError` (404) which are translated to specific responses.

---

## 3. Client (`client/src/`)

### 3.1 Plumbing

`client/src/lib/auth.ts` — Tiny React context exposing `{ user, authReady }`. The Provider is set in `App.tsx` after the auth state resolves, so any nested component can do `useAuth()` and get the current `User`.

`client/src/lib/apiClient.ts` — One function: `apiRequest<T>(user, path, options)`. Mints a fresh Firebase ID token via `user.getIdToken()`, attaches it as `Bearer`, serializes/deserializes JSON, and throws a typed `ApiError` (with `status`) when the response is not OK. Every service call goes through this — no fetch calls are scattered across the codebase.

`client/src/types/api.ts` — Parallel-but-string-typed versions of the server models (timestamps are `string | null`). Plus response wrappers (`HistoryResponse`, `WeeklyReportResponse`, etc.) that match exactly what the routes return.

### 3.2 Service modules

`client/src/services/attendanceService.ts` — Typed wrappers around every employee endpoint: `fetchMe`, `updateMe`, `fetchActiveSession`, `postPunchIn`, `postPunchOut`, `fetchHistory`, `fetchDailySummary`, `fetchWeeklySummary`. Each takes a `User` and an optional `AbortSignal`.

`client/src/services/adminService.ts` — Same pattern for admin endpoints.

### 3.3 Hooks

All four follow the same shape: `{ data, loading, error, refresh }` plus an internal `useEffect` that cancels in-flight requests via `AbortController` when the user changes or the component unmounts.

- `useProfile.ts` — current user's profile
- `useActiveSession.ts` — also exposes `setSession` so PunchCard can optimistically update after punch-in/out
- `useDailySummary.ts` — KPI source for Dashboard
- `useWeeklySummary.ts` — available but not yet rendered (you can wire it into a weekly view whenever)

### 3.4 Components

`client/src/components/PunchCard.tsx` — The headline UI. Shows "Not punched in" or live `Xh YYm` elapsed (a `setInterval(..., 1000)` driven by component state, started only when an active session exists and torn down otherwise). The button toggles between teal "Punch in" and rose "Punch out". After punch-out it calls `onChange(null)` so the parent clears state and refreshes summary KPIs.

`client/src/components/KpiCard.tsx` — Reusable label/value/hint card with five accent colors.

`client/src/components/AttendanceTable.tsx` — Renders an array of `AttendanceRecord`s as a striped table. If `onEdit` is provided (admin context), each row gets an Edit link.

`client/src/components/ReportTable.tsx` — Cross-joins `employees` with `summaries` by `userId` so every employee shows up even if they have no sessions that day (their row is just zeros).

### 3.5 Pages

`client/src/pages/SignIn.tsx` — Extracted from the old `App.tsx`. Pure email/password form, no router.

`client/src/pages/AppLayout.tsx` — The shell rendered for authenticated users. Header with mini-hcm branding, `NavLink`s for **Dashboard / History / Admin**, sign-out button. The Admin link is **conditionally rendered** only when `profile?.role === 'admin'` — so for employees, the admin link is invisible (and the server still 403s if they hit `/api/admin/*` directly).

`client/src/pages/Dashboard.tsx` — Hello + scheduled hours, PunchCard, then six KPI cards (Regular, OT, ND, Total, Late, Undertime). When the user punches in/out, `handleSessionChange` triggers both `refreshSession()` and `refreshSummary()` so the metrics update immediately after a punch-out.

`client/src/pages/History.tsx` — Two date inputs (defaults to last 14 days), Refresh button, AttendanceTable. Date changes refetch via `useEffect` dependency.

`client/src/pages/Admin.tsx` — Three sections:

1. **Date picker + ReportTable** showing every employee's totals for the selected date.
2. **Per-employee inspector**: select an employee, see all their sessions for that date, click Edit on any row.
3. **Edit modal**: two `datetime-local` inputs (timeIn, timeOut). Leaving timeOut blank reverts the session to `active`. On save, the server recomputes the session and re-aggregates that day's summary; the page then reloads both views.

### 3.6 Routing entrypoint

`client/src/App.tsx` — Restores auth state, shows a "Restoring secure session…" placeholder, then either `<SignIn />` or the router tree wrapped in `<AuthContext.Provider>`. Routes:

- `/` → `<Dashboard />`
- `/history` → `<History />`
- `/admin` → `<Admin />`
- `*` → redirects to `/`

---

## 4. Firebase artifacts

`firestore.rules` — Defense-in-depth even though the server bypasses them:

- Users can read/create their own `users/{uid}`; only admins update.
- Users can read their own `attendance`; only the Admin SDK can update or delete (rules deny these for everyone).
- `dailySummary` is read by owner or admin; never client-writable.
- `isAdmin()` reads the caller's user doc and checks `role == 'admin'`.

`firestore.indexes.json` — Three composite indexes needed by our queries:

1. `(userId asc, status asc)` — `findActiveSession`
2. `(userId asc, date asc, status asc)` — `writeDailySummary`'s session pull
3. `(userId asc, date desc, timeIn desc)` — `getHistory`

`.firebaserc` + `firebase.json` — let `firebase deploy --only firestore:indexes,firestore:rules` find the two files above.

---

## 5. Key flows end-to-end

### Punch In

```
User clicks "Punch in"
  → POST /api/attendance/punch-in (Bearer ID token)
    → authenticateFirebase verifies token
    → getOrCreateUserProfile(uid) — bootstraps if first time
    → findActiveSession(uid) — must be null, else 409
    → Firestore: SET attendance/{uid}_{date}_{ts}
       { status: 'active', timeIn: now, computed: null }
    → returns serialized record
  → Client: PunchCard.onChange(record) → setSession(record)
  → Live timer starts ticking
```

### Punch Out

```
User clicks "Punch out"
  → POST /api/attendance/punch-out
    → findActiveSession(uid) — must exist, else 404
    → computeHours({ timeIn, now, schedule, timezone })
      → resolves scheduled window in user's tz
      → computes regular/OT/ND/late/undertime
    → Firestore: UPDATE attendance/{id}
       { status: 'completed', timeOut, computed }
    → writeDailySummary(db, uid, date)
      → reads all completed sessions for uid+date
      → SUMs into dailySummary/{uid_date}
    → returns serialized record
  → Client: handleSessionChange(null)
    → useActiveSession.refresh() and useDailySummary.refresh()
  → KPI cards update with new totals
```

### Admin edits a punch

```
Admin opens modal, changes timeIn, saves
  → PUT /api/admin/attendance/:id
    → requireAdmin (looks up role from users/{uid})
    → fetch original attendance doc + owner's profile
    → computeHours with new times
    → UPDATE attendance/{id} with new times+computed+date
    → writeDailySummary for new date
    → if date changed, also writeDailySummary for OLD date
  → Admin page reloads daily report + employee's sessions
```

---

## 6. Design decisions worth knowing

- **All time stored UTC; tz only applied at boundaries.** `timeIn`/`timeOut` are UTC `Timestamp`s. The `timezone` field on the user profile is consulted only when (a) resolving schedule strings to absolute moments, (b) deriving the `date` partition key, and (c) formatting display strings. This makes cross-timezone reasoning trivial.
- **Daily summary recompute, not delta-update.** Every punch-out re-sums the day from scratch. Slightly more I/O, zero possibility of drift after admin edits or late punches.
- **Auto-bootstrap profiles.** Anyone who can sign in (created in Firebase Console) becomes an `employee` automatically on first authenticated request. There is no in-app registration. To create the first admin, you flipped `role` to `'admin'` in Console; subsequent admins can be promoted via `PUT /api/admin/employees/:uid`.
- **No client-side Firestore.** Adding a feature means adding a route, not loosening rules. Rules stay restrictive.
- **`noUncheckedIndexedAccess` on server.** That's why we use `snapshot.docs[0]` and check for undefined before destructuring — TS forces it.
- **React Compiler enabled** (per `vite.config.ts`). We deliberately did **not** sprinkle `useMemo`/`useCallback` everywhere — the compiler handles memoization. The `useCallback`s that remain are only the ones whose identity participates in a dependency array (e.g., `loadReport` passed to `useEffect`).
