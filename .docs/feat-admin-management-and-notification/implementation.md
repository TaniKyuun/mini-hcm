# Admin Management & Notifications - Implementation Walkthrough

## 1. Architecture at a glance

```
┌────────────────────────────────────────────┐    Bearer ID token     ┌─────────────────────┐
│  React (Vite)                              │  ───────────────────▶  │  Express (Bun)      │
│  - Firebase Auth                           │  ◀─── JSON ──────────  │  - Admin SDK        │
│  - AddEmployeeDialog / EditEmployeeDialog  │                        │  - createEmployee   │
│  - RequestFixModal / AdminEditRequests     │                        │  - notify writes    │
│  - NotificationBell + useNotifications     │                        │  - edit-request svc │
└────────────────────────────────────────────┘                        └──────────┬──────────┘
              │                                                                 │
              │ onSnapshot (rules-gated, recipient only,                        │ Admin SDK
              │  single-field query - no composite index)                       │ writes
              └─────────────────────────┐                                       │
                                        ▼                                       ▼
                                  ┌─────────────────────────────────────────────────┐
                                  │  Firestore                                      │
                                  │  - users (extended w/ location, employmentType, │
                                  │           schedule.workingDays)                 │
                                  │  - attendance                                   │
                                  │  - dailySummary                                 │
                                  │  - notifications  ← NEW                         │
                                  │  - attendanceEditRequests  ← NEW                │
                                  └─────────────────────────────────────────────────┘
```

The browser still **never writes to `users`, `attendance`, or `attendanceEditRequests` directly** - those go through Express. The one wrinkle is that the browser **reads** `notifications` directly via `onSnapshot`. Mutations on `notifications` (mark-as-read) still go through Express so ownership is enforced server-side. Security rules permit the recipient to flip only the `read` field, so even a malicious client can't tamper with `title`/`actorUid`/etc. The `attendanceEditRequests` collection is entirely server-mediated (REST in + REST out) — no live listener on it.

---

## 2. Server (`server/src/`)

### 2.1 Models, constants, serialization

`server/src/types/models.ts` - Adds notification types, edit-request types, and extends `UserSchedule`:

- `NotificationType = 'punch_edited' | 'edit_request_created' | 'edit_request_approved' | 'edit_request_rejected'` (extensible union)
- `NotificationMetadata = { attendanceId?: string; date?: string }`
- `NotificationDoc` - full Firestore document shape with `recipientUid`, `actorUid`, `type`, `read`, `title`, `body`, optional `metadata`, and `createdAt: Timestamp`.
- `EditRequestStatus = 'pending' | 'approved' | 'rejected'`
- `AttendanceEditRequestDoc` - `attendanceId`, `requesterUid`, `date`, `originalTimeIn/Out` snapshot, `requestedTimeIn/Out` (string or null), `reason`, `status`, `createdAt`, `resolvedAt`, `resolvedBy`, `adminNote`.
- `UserSchedule` now has an optional `workingDays?: number[]` (`0=Sun..6=Sat`). Missing/empty reads as Mon–Fri via the shared helper, so pre-migration documents stay valid.

`server/src/lib/constants.ts` - Adds `NOTIFICATIONS_COLLECTION = 'notifications'` and `EDIT_REQUESTS_COLLECTION = 'attendanceEditRequests'`. Consistent with the existing `USERS_COLLECTION` / `ATTENDANCE_COLLECTION` / `DAILY_SUMMARY_COLLECTION` pattern.

`server/src/lib/serialize.ts` - Adds `serializeNotification(id, doc)` and `serializeEditRequest(id, doc)` that prepend the doc ID and convert `Timestamp` fields to ISO-8601. Same pattern as `serializeAttendance`.

`server/src/lib/workingDays.ts` (new) - `DEFAULT_WORKING_DAYS = [1,2,3,4,5]`, `effectiveWorkingDays(schedule)`, `isWorkingDay(schedule, isoDate)`. Mirrored on the client.

### 2.2 Services

`server/src/services/notificationService.ts` - **Was a console-log stub. Replaced.**

Two exported functions:

| Function | Purpose |
|---|---|
| `createNotification({ recipientUid, actorUid, type, title, body, metadata? })` | Generic Firestore write. Sets `read: false` and `createdAt: serverTimestamp()`. Returns the new doc ID. |
| `notifyEmployeeOfEdit(recipientUid, actorUid, reason, metadata)` | Composes a `punch_edited` notification with a human-friendly title/body (`"Reason: ..."` or `"An admin updated your time entry."`) and calls `createNotification`. Still logs an `[notify]` line for debugging. |

`server/src/services/userService.ts` - Exports `ValidationError` and `assertValidSchedule`, plus the existing `EmailAlreadyExistsError`.

- `ValidationError(message, field?)` - thrown for any malformed input. The route layer translates it to HTTP 400 with `{ error, field }`.
- `assertValidSchedule(value)` - returns a sanitized `UserSchedule` or throws. Catches:
  - Non-object or missing `start`/`end`
  - Malformed `HH:MM` strings
  - **`start === end`** (a previously-silent bug - admins saw "saved" but nothing changed)
  - `workingDays` not an array, empty, out of `0..6`, non-integer, or with duplicates
- `adminUpdateProfile` and `updateOwnProfile` now **throw on invalid input** instead of silently dropping fields. Every assignable field (name, email, role, timezone, schedule, location, employmentType) has its own targeted error message.
- `createEmployeeProfile(input)`:
  - Trims inputs, validates name/email/password (`isValidEmail`, 8+ chars).
  - Validates timezone via `isValidTimezone` (Intl.DateTimeFormat probe) and schedule via `assertValidSchedule`.
  - Calls `auth.createUser({ email, password, displayName: name })`. Catches `auth/email-already-exists` and re-throws as `EmailAlreadyExistsError` for the 409 branch.
  - Writes the Firestore profile doc with `FieldValue.serverTimestamp()` for `createdAt`.

`server/src/services/editRequestService.ts` (NEW) - everything around employee-filed amendments.

Exports `createEditRequest`, `listEditRequestsForUser`, `listEditRequests`, `getEditRequest`, `approveEditRequest`, `rejectEditRequest`.

- `createEditRequest({ attendanceId, requesterUid, requestedTimeIn?, requestedTimeOut?, reason })`:
  - Trims and validates the reason (`ValidationError` if empty or > 500 chars).
  - Parses each requested time via `parseRequestedTime`: `null`/`undefined`/empty-string mean "leave unchanged"; a non-empty string must parse to a `Date` or throws. **Employees cannot clear times** - the helper rejects that.
  - Requires at least one proposed time after parsing (both `null` → 400).
  - Reads the linked attendance doc; throws `NotFoundError` (404) if missing, `ValidationError` if `userId !== requesterUid`.
  - Queries `where('attendanceId', '==', X).where('status', '==', 'pending')` and rejects if any pending request already exists.
  - Writes the new doc with `status: 'pending'`, `createdAt: serverTimestamp()`, and a snapshot of the original times.
- `approveEditRequest(id, adminUid, adminNote?)`:
  - Loads the doc, throws 404 if missing, 400 if `status !== 'pending'`.
  - Calls **`adminUpdateAttendance(attendanceId, { timeIn, timeOut, reason: "Approved edit request from employee: ...", notify: false }, adminUid)`** - so the same compute + summary + audit-log pipeline runs. `null` requested times are translated to `undefined` so they're left alone rather than cleared.
  - Updates the request doc to `{ status: 'approved', resolvedAt, resolvedBy, adminNote }`.
  - Calls `createNotification` with type `'edit_request_approved'` addressed to the requester, title "Your time-entry change was approved", body using the admin note when present.
- `rejectEditRequest(id, adminUid, adminNote?)`:
  - Same status guard.
  - Updates `{ status: 'rejected', resolvedAt, resolvedBy, adminNote }`.
  - Calls `createNotification` with type `'edit_request_rejected'`.

`server/src/services/attendanceService.ts` - `adminUpdateAttendance` now throws `ValidationError` (from `userService`) in three places:

- `parseDateOrThrow` / `parseTimeOutOrThrow` → field `'timeIn'` or `'timeOut'`
- `nextTimeOut <= nextTimeIn` → `'Clock-out must be after clock-in.'`, field `'timeOut'`

This is the source of the "unhandled server error" the admin used to see; it's now a tidy 400 the dialog renders inline. The `notify` call site is also async-await with full metadata:

```ts
if (input.notify) {
  await notifyEmployeeOfEdit(existing.userId, actingUid, reason, {
    attendanceId: id,
    date: nextDate,
  });
}
```

### 2.3 Routes

`server/src/routes/admin.ts` - now mounts the existing admin handlers plus three new edit-request handlers, all with the `ValidationError → 400` branch:

| Endpoint | Notes |
|---|---|
| `POST /api/admin/employees` | Validates `name`/`email`/`password` presence (early 400), calls `createEmployeeProfile`, returns 201. Branches: `EmailAlreadyExistsError → 409`, `ValidationError → 400 { error, field }`. |
| `PUT /api/admin/employees/:uid` | Calls `adminUpdateProfile`. `ValidationError → 400 { error, field }`. |
| `PUT /api/admin/attendance/:id` | Calls `adminUpdateAttendance`. `NotFoundError → 404`, `ValidationError → 400 { error, field }`. |
| `POST /api/admin/notifications/test` | Creates a self-addressed `punch_edited` notification via `createNotification`. Optional `recipientUid` body param targets someone else. Used by the Settings demo button. |
| `GET /api/admin/edit-requests` | Calls `listEditRequests(?status)`, returns `{ editRequests }` sorted newest-first. |
| `POST /api/admin/edit-requests/:id/approve` | Calls `approveEditRequest`. `NotFoundError → 404`, `ValidationError → 400`. |
| `POST /api/admin/edit-requests/:id/reject` | Calls `rejectEditRequest`. Same error mapping. |

`server/src/routes/users.ts` - `putMe` now also maps `ValidationError → 400`.

`server/src/routes/notifications.ts` - Three handlers, all typed with `AuthenticatedLocals`:

| Handler | Behavior |
|---|---|
| `listNotifications` | Queries `recipientUid == uid orderBy createdAt desc limit 20`, returns `{ notifications, unreadCount }` - used by non-realtime callers / fallback |
| `markRead` | Looks up the doc by ID, returns 404 if missing, 403 if `recipientUid !== uid`. If `read` is already `true`, returns 204 without writing. Otherwise updates `{ read: true }` and returns 204 |
| `markAllRead` | Queries `recipientUid == uid AND read == false`, batches `update({read:true})` across all matches in a single commit. Returns 204 |

Mounted at `/api/notifications` in `app.ts` behind `authenticateFirebase` (no admin guard - every user can read their own).

`server/src/routes/editRequests.ts` - **NEW.** Two employee-side handlers behind `authenticateFirebase` (no admin guard):

| Handler | Behavior |
|---|---|
| `postEditRequest` | Validates `attendanceId` presence (early 400), calls `createEditRequest({ ...body, requesterUid: caller })`, returns the serialized doc with 201. `NotFoundError → 404`, `ValidationError → 400 { error, field }`. |
| `getMyEditRequests` | Returns `{ editRequests }` for the caller, sorted newest-first. |

`server/src/app.ts` - registers two new mounts: `app.use('/api/notifications', notificationsRouter)` and `app.use('/api/edit-requests', editRequestsRouter)`.

---

## 3. Client (`client/src/`)

### 3.1 Firebase plumbing

`client/src/lib/firebase.ts` - Now also initializes Firestore:

```ts
import { getFirestore } from 'firebase/firestore';
export const db = getFirestore(firebaseApp);
```

This is the **first** place the client SDK touches Firestore. Previously the project used only Firebase Auth on the client. Everything still flows through Express **except** the notifications listener.

### 3.2 Types and service modules

`client/src/types/api.ts` - Adds `NotificationType` (extended union), `NotificationMetadata`, `Notification`, `NotificationsResponse`, and now also `EditRequestStatus`, `EditRequest`, `EditRequestsResponse`. The string-typed timestamp fields mirror the server's serialize output. `UserSchedule` is extended with optional `workingDays?: number[]`.

`client/src/services/adminService.ts` - Three additions:
- `createEmployee(user, body: CreateEmployeeBody)` → `POST /api/admin/employees`
- `triggerTestNotification(user, recipientUid?)` → `POST /api/admin/notifications/test`
- `AdminUpdateProfileBody` extended with `location?` and `employmentType?`. `CreateEmployeeBody` is the same shape plus `password`. Both flow through the existing `UserSchedule` type, so `workingDays` rides along automatically.

`client/src/services/notificationService.ts` - Three thin wrappers around `apiRequest`/`apiRequestJson`: `fetchNotifications`, `markNotificationRead`, `markAllNotificationsRead`. The realtime listener doesn't go through these - they exist for the mutations.

`client/src/services/editRequestService.ts` - **NEW.** Thin wrappers covering both employee + admin endpoints:
- `createEditRequest(user, body)` → `POST /api/edit-requests`
- `fetchMyEditRequests(user)` → `GET /api/edit-requests`
- `fetchAdminEditRequests(user, status?)` → `GET /api/admin/edit-requests[?status=...]`
- `approveEditRequest(user, id, adminNote?)` → `POST /api/admin/edit-requests/:id/approve`
- `rejectEditRequest(user, id, adminNote?)` → `POST /api/admin/edit-requests/:id/reject`

### 3.3 Validation utility

`client/src/utils/validateProfile.ts` - Shared per-field validators used by `AddEmployeeDialog`, `EditEmployeeDialog`, and (via reuse) the schedule sub-validator:

- `validateName`, `validateEmail`, `validatePassword`, `validateTimezone`, `validateTimeString`, `validateWorkingDays`.
- `validateSchedule(start, end, workingDays?)` - composite. Returns a `FieldErrors` keyed by string paths like `'schedule.start'`, `'schedule.end'`, `'schedule.workingDays'`, `'schedule'` (for cross-field errors like start === end).
- `hasErrors(errors)` - guard used to disable the Save button.

### 3.4 Working-days utility

`client/src/utils/workingDays.ts` - Mirrors the server module plus presentation helpers:

- `DEFAULT_WORKING_DAYS = [1,2,3,4,5]`
- `DAY_LABELS = ['Sun', 'Mon', ..., 'Sat']` - used by the toggle chips and the summary formatter.
- `effectiveWorkingDays(schedule)` - returns sorted indices, falling back to Mon–Fri.
- `isWorkingDay(schedule, isoDate)` - parses the `YYYY-MM-DD` as local time and checks membership.
- `formatWorkingDays(schedule)` - compact labels: `"Mon–Fri"`, `"Mon–Sat"`, `"All days"`, or comma-joined `"Mon, Wed, Fri"` for arbitrary sets.

### 3.5 The `useNotifications` hook

`client/src/hooks/useNotifications.ts` - The core of the real-time UX.

```ts
useEffect(() => {
  if (!user) return setNotifications([]);
  // NOTE: no orderBy/limit - sorting + slicing happens client-side
  //       so we don't need a composite index.
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', user.uid),
  );
  const unsub = onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map(toNotification)
        .sort((a, b) => /* createdAt desc */)
        .slice(0, LIST_LIMIT);
      setNotifications(items);
      setError(null);
    },
    (err) => {
      console.error('[useNotifications] onSnapshot error:', err);
      setError(err.message);
    },
  );
  return () => unsub();
}, [user]);
```

`markRead(id)` and `markAllRead()` both **optimistically** mutate local state and then call the REST API. If the REST call fails, the next `onSnapshot` tick from Firestore will heal the state (Firestore is the source of truth).

`unreadCount` is derived in the hook body (`notifications.reduce(...)`) - no separate state, so it can't drift from the list.

`error` is returned alongside `notifications/unreadCount` so the bell can render an inline diagnostic when the listener fails (e.g., undeployed security rules).

### 3.6 Components

`client/src/components/AddEmployeeDialog.tsx` - Controlled dialog. Props: `{ open, busy?, error?, onOpenChange, onSave }`. Fields:

- Name, email, password (all required; password ≥ 8 chars)
- Role - button group (employee / admin)
- Timezone (text input, defaults `Asia/Manila`)
- **Working days** - row of seven `Sun … Sat` toggle chips, default Mon–Fri
- Shift start / end - two `type="time"` inputs with a live "Xh Ym" duration label
- Employment type - button group (Full-time / Part-time / Contractual)
- Location - button group (On-Site / Remote / Hybrid)

Each field with an error gets `aria-invalid`, a red border, and a small inline `<p className="text-destructive">` message. Save is disabled while the user has unresolved errors (after the first save attempt).

`client/src/components/EditEmployeeDialog.tsx` - Same dialog skeleton seeded from a `UserProfile` prop via `useEffect`. Same fields **minus** password; the working-days row is seeded from `effectiveWorkingDays(employee.schedule)`. Validation errors render the same inline way.

`client/src/components/EditPunchModal.tsx` - Same validation pattern for clock-in/out:

- Clock-in date/time required; time must be `HH:MM` or `HH:MM:SS`
- Clock-out date set without a time → error
- Computed comparison: clock-out ≤ clock-in → error
- Reason length cap (500 chars) with a live `N/500` counter
- Save disabled when invalid

`client/src/components/NotificationBell.tsx` - Connects the hook to a `DropdownMenu`:

- Bell icon with a small absolute-positioned rose-colored dot when `unreadCount > 0` (no number - the count appears next to "Notifications" inside the dropdown).
- Each row is a button that calls `markRead(n.id)` on click. Unread items get a `border-l-primary` strip + `bg-primary/5` tint + bold title.
- Relative time via `date-fns` `formatDistanceToNow`.
- Empty state: "No notifications yet."
- **Error banner** - when the hook's `error` is set, a destructive-style block at the top of the dropdown explains the failure and suggests `firebase deploy --only firestore:rules` (the most common cause).

`client/src/components/RequestFixModal.tsx` (NEW) - Employee-side dialog for proposing a punch fix. Props: `{ open, record: AttendanceRecord | null, employeeName?, timezone?, busy?, error?, onOpenChange, onSubmit }`.

- Pre-fills both date+time pickers from the current `record.timeIn` / `record.timeOut` (so the employee tweaks only what's wrong).
- Same date+time picker pattern as `EditPunchModal` (`Popover` + `Calendar` + `<Input type="time" step="1">`).
- Reason input with a live `N/500` character counter; required.
- Per-field validation via `useMemo`: HH:MM[:SS] format, clock-out > clock-in when both are set, **at least one time must differ from the original** (otherwise the form is invalid - prevents empty requests).
- Inline destructive messages per invalid field; a separate amber banner appears when the "no change" rule fails so it's visually distinct from value errors.
- Submit serializes only the fields the employee actually changed into the `CreateEditRequestBody`. Untouched fields are simply absent from the request body.

### 3.7 Page wiring

`client/src/pages/AdminPeople.tsx`:
- New dialogs (`addOpen/addBusy/addError`, `editOpen/editBusy/editError`) wired to the "Add employee" and "Edit profile" buttons.
- "Open attendance" button calls `navigate('/admin/attendance?uid=<selected.profile.uid>')`.
- "Off-board" placeholder removed.
- Search input has a Clear-search **X** button that resets `search` to `''` (disabled when empty).
- Roster paginates 10 rows at a time. Footer shows `1–10 of 27` + prev/next buttons + `1 / 3` page counter. Search/clear resets to page 1.
- Roster columns: **Employee** (name + email), **Schedule** (`HH:MM–HH:MM`), **Role** (admin/employee badge).
- Profile drawer shows Employee ID = Firebase UID (no more mock 5-digit ID) and the Shift row reads e.g. `09:00–18:00 · Mon–Fri` via `formatWorkingDays`.

`client/src/pages/AdminAttendance.tsx`:
- Reads `?uid=` query param via `useSearchParams` and uses it as the initial `selectedUid` (so the AdminPeople → "Open attendance" redirect lands on the right employee).
- New `rest-day` row state. When `!isWorkingDay(employee.schedule, date)` and the employee has no session, render a neutral outline `rest day` badge instead of red `absent`. The status filter has a "Rest day" chip and the header summary shows a count badge.
- Filter icon button → Clear-search **X** button (matches AdminPeople).
- Placeholder "Approve OT" and "Notify" footer buttons removed.
- `todayIso()` uses `dateToIso(new Date())` (local time) - the UTC-based version showed yesterday's date in early-morning Manila.

`client/src/pages/Admin.tsx`:
- The dashboard's "Add employee" button opens the same `AddEmployeeDialog`. On success, `loadReport()` re-pulls employees + daily report.

`client/src/pages/AdminReports.tsx`, `client/src/pages/Dashboard.tsx`, `client/src/utils/computeAttendance.ts`:
- All converted to local-time date math (`dateToIso` / `addDaysIso`) so "today" matches the user's clock.

`client/src/pages/Settings.tsx`:
- New admin-only **"Notification demo"** card. Button calls `triggerTestNotification(user)` → `POST /api/admin/notifications/test`. On success, "Sent - check the bell in the header." appears next to the button; the bell badge then lights up via the live listener.

`client/src/pages/History.tsx`:
- Wires the existing "Request fix" footer button to open `RequestFixModal` with the currently selected day's record. The button is disabled when no record exists for the day.
- On submit, calls `createEditRequest(user, body)`, then shows an inline emerald success banner ("Request submitted. An admin will review it.") above the footer and refreshes the month via `load()`.
- Right-side card capped at `max-h-[80vh]` and audit-log list set to `flex-1 min-h-0 overflow-y-auto`, so the entry list scrolls inside the card on tall histories instead of stretching the card past the viewport.
- "Add note" placeholder removed - "Request fix" now spans the full footer width.

`client/src/pages/AdminEditRequests.tsx` (NEW) - the admin review queue.
- Loads `/api/admin/edit-requests?status=...` plus `/api/admin/employees` so it can render employee avatar + name next to each request.
- Filter row: **Pending** (default) / Approved / Rejected / All. The Pending filter chip shows a count badge when there are open requests.
- Each request renders as a card: avatar + name + date + status badge in the header; side-by-side **Original** vs **Requested** time blocks (the Requested block is highlighted in primary while pending); the reason and any admin note follow.
- Pending cards have a footer with an optional `<Input>` for an admin note plus two buttons: a destructive-hover **Reject** and a primary **Approve & apply**. Both disable the row while one is in flight; errors render inline in a destructive banner.

`client/src/App.tsx`:
- New route `<Route path="edit-requests" element={<AdminEditRequests />} />` under the admin tree (`/admin/edit-requests`).

`client/src/components/app-sidebar.tsx`:
- New nav entry **"Edit requests"** with `InboxIcon`, inserted between Attendance and Reports in `adminNav`.

`client/src/components/site-header.tsx`:
- Static `<Button><BellIcon /></Button>` is replaced with `<NotificationBell />`. Everything else in the header is unchanged.

---

## 4. Firestore artifacts

`.firebase/firestore.rules` - One new collection block:

```javascript
match /notifications/{notificationId} {
  allow read: if request.auth != null
    && resource.data.recipientUid == request.auth.uid;
  allow update: if request.auth != null
    && resource.data.recipientUid == request.auth.uid
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
  allow create, delete: if false;
}
```

The `hasOnly(['read'])` clause is what makes a direct `onSnapshot` listener safe: a logged-in user **cannot** modify any field other than `read` on a doc they own, and they cannot modify a doc that isn't theirs at all.

Deploy with `firebase deploy --only firestore:rules`. Without that deploy the listener will fail with a permission-denied error, which the bell now surfaces inline.

**No composite index needed.** The client query is single-field (`where('recipientUid', '==', uid)`); sorting + the 20-item cap happen in `useNotifications`. The original design used `orderBy('createdAt','desc').limit(20)` - that required a composite index that had to be provisioned in Firestore before reads worked, and a missing index showed up as a `FAILED_PRECONDITION` error that the silent listener never surfaced.

---

## 5. Key flows end-to-end

### Admin creates a new employee

```
Admin fills AddEmployeeDialog, clicks "Create employee"
  → POST /api/admin/employees (Bearer ID token)
    → authenticateFirebase
    → requireAdmin (must have role: 'admin')
    → createEmployeeProfile(input)
      → assertValidSchedule(input.schedule)   ← throws ValidationError → 400 on bad input
      → isValidEmail(email) / password.length ≥ 8 / isValidTimezone(...)
      → auth.createUser({ email, password, displayName })
         → if email taken: throw EmailAlreadyExistsError → 409
      → Firestore: SET users/{newUid}
         { uid, name, email, role, timezone, schedule (incl. workingDays?),
           location?, employmentType?, createdAt }
      → returns fresh profile
    → 201 serialized profile
  → Client closes dialog, refreshes the roster via load()
```

### Admin edits an employee schedule

```
Admin clicks "Edit profile" on selected employee
  → EditEmployeeDialog opens, fields seeded from selected.profile
    (workingDays pre-checked from effectiveWorkingDays(schedule))
  → Admin toggles Saturday on, changes end time, clicks Save
  → validateSchedule(...) green-lights both sides client-side
  → PUT /api/admin/employees/:uid
    → adminUpdateProfile sanitizes every assignable field
       (throws ValidationError → 400 { error, field } on any bad input)
    → assertValidSchedule(schedule) ← validates start/end/workingDays
    → Firestore: UPDATE users/{uid} with only the touched fields
  → Client closes dialog, refreshes the roster
  → AdminAttendance page now treats Saturday as a working day for this employee
    (no more "rest day" badge on Sat)
```

### Admin edits a punch with "Notify employee" on

```
Admin opens EditPunchModal, changes timeIn, ticks Notify, clicks Save
  → Client validates: in/out parseable, out > in, reason ≤ 500
  → PUT /api/admin/attendance/:id { timeIn, timeOut, reason, notify: true }
    → adminUpdateAttendance recomputes, writes attendance doc, re-aggregates dailySummary
    → if input.notify:
        await notifyEmployeeOfEdit(employeeUid, adminUid, reason, { attendanceId, date })
          → createNotification → Firestore ADD notifications/...
             { recipientUid: employeeUid, actorUid: adminUid, type: 'punch_edited',
               read: false, title: 'Your time entry was edited',
               body: 'Reason: ...', metadata, createdAt: serverTimestamp() }
    → 200 serialized attendance  (or 400 with field on validation error)
  → Meanwhile, on the EMPLOYEE'S browser:
    useNotifications.onSnapshot fires within ~1s
    → notifications state updates (sorted + sliced to 20 client-side)
    → NotificationBell rerenders with a red dot
    → Employee clicks the bell → dropdown opens with the new notification (bold title)
    → Employee clicks the item:
        markRead(id) optimistically flips read locally
        PATCH /api/notifications/:id/read
          → ownership check → Firestore UPDATE { read: true }
```

### Admin sends a demo notification from Settings

```
Admin opens /settings, clicks "Send test notification"
  → POST /api/admin/notifications/test
    → requireAdmin
    → createNotification({ recipientUid: actorUid, actorUid, type: 'punch_edited',
                           title: 'Test notification', body: 'Demo from admin settings · ...' })
    → 201 { id, recipientUid }
  → "Sent - check the bell in the header." appears next to the button.
  → useNotifications.onSnapshot fires → bell badge appears within ~1s.
```

### Admin navigates from the roster to an employee's attendance

```
Admin selects an employee in AdminPeople, clicks "Open attendance"
  → navigate('/admin/attendance?uid=<uid>')
  → AdminAttendance reads ?uid via useSearchParams
  → setSelectedUid(uid)   ← initial state, before the "first employee fallback"
  → Roster + detail panel both already pointing at the right employee on first render
```

### Employee requests a punch fix, admin approves

```
Employee opens /history → selects a day → clicks "Request fix"
  → RequestFixModal opens, pre-filled with current clock-in/out
  → Employee tweaks one or both times, writes a reason, Submit
  → Client validates (HH:MM[:SS], out > in, at least one time changed, reason 1-500 chars)
  → POST /api/edit-requests { attendanceId, requestedTimeIn?, requestedTimeOut?, reason }
    → authenticateFirebase
    → createEditRequest validates:
       - reason length, time parseability, at least one time present
       - attendance exists and is owned by the caller (or 400)
       - no existing pending request on the same attendance (or 400)
    → Firestore: ADD attendanceEditRequests/... { status: 'pending', original snapshot, ... }
  → 201 serialized request
  → Employee sees inline emerald banner: "Request submitted. An admin will review it."

Admin opens /admin/edit-requests (Pending tab selected by default)
  → GET /api/admin/edit-requests?status=pending → renders one card per request
  → Admin types optional note, clicks "Approve & apply"
  → POST /api/admin/edit-requests/:id/approve { adminNote? }
    → requireAdmin
    → approveEditRequest:
        - guards: pending only
        - adminUpdateAttendance(attendanceId, { timeIn, timeOut, reason: "Approved edit
          request from employee: ...", notify: false }, adminUid)
            → computeHours → writeDailySummary → edits[] gets a new AttendanceEdit
        - update request doc: status=approved, resolvedAt, resolvedBy, adminNote
        - createNotification(type='edit_request_approved', recipientUid=employee, ...)
  → 200 serialized request

  Meanwhile, on the EMPLOYEE'S browser:
    useNotifications.onSnapshot fires within ~1s
    → NotificationBell badge appears
    → Employee opens bell, reads "Your time-entry change was approved" + admin note

(Reject is identical except the attendance doc is NOT touched, only the request doc
 is updated and a type='edit_request_rejected' notification is created.)
```

---

## 6. Design decisions worth knowing

- **`onSnapshot` for reads, REST for writes.** The split is deliberate: live UX is best with a Firestore listener, but the mark-as-read mutation needs an explicit ownership check that's easier to reason about in Express. Security rules also gate the listener - a third defensive layer.
- **No FCM / no service worker.** Push notifications were explicitly out of scope. The user must have the tab open to see notifications; this is acceptable for the current product.
- **No composite index.** Dropping `orderBy`/`limit` from the Firestore query removed the dependency on a provisioned composite index. Sorting + slicing 20 records client-side is free at this scale and removes an entire operational step.
- **`ValidationError` everywhere.** A single typed exception flows through every write path; the route layer turns it into HTTP 400 with `{ error, field }`. Service code stops silently dropping bad input - the original `adminUpdateProfile` was doing that, which led to the "I saved my schedule but nothing changed" class of confusing bugs.
- **`workingDays` is optional in storage, defaulted in code.** Existing documents stay valid. Every consumer routes through `effectiveWorkingDays(schedule)`; validation rejects empty arrays so the only encoding for "Mon–Fri default" is "omit the field."
- **Notification union grows by extension, not migration.** The original `type` was just `'punch_edited'`. Adding `'edit_request_approved'` and `'edit_request_rejected'` was a one-line type extension; the doc shape didn't change so existing rows stay valid.
- **Open-shaped `metadata`.** Forcing every future notification type into the same metadata fields would be a constant source of churn. The current `{ attendanceId?, date? }` is enough for `punch_edited`; future types can add their own keys without coordinating.
- **Optimistic mark-as-read.** UI feels instant. If the REST call fails, Firestore's next snapshot heals state. We don't pop a toast for the failure to avoid noise.
- **The `hasOnly(['read'])` security rule.** Without this, a recipient could theoretically rewrite the title or actorUid of their own notifications. With it, the only thing they can change is the read flag - exactly the right capability.
- **Inline errors, no toast library.** Matches the project's existing pattern (`<p className="bg-destructive/10 text-destructive">`). The bell's listener-error banner uses the same style for consistency.
- **Auth-then-Firestore order in `createEmployeeProfile`.** If the Firestore write fails after `auth.createUser` succeeds, the Auth user is orphaned. For 1–50-employee scale this is acceptable - the admin retries with the same email and gets a 409 to clean up later. A future hardening would wrap the two writes with a rollback on the Auth side.
- **Server still owns notification *creation*.** The `notifications/{id}` rule has `allow create: if false`. Only the Admin SDK can write new notifications, so an employee can't spoof one to themselves.
- **Local-timezone date math.** `dateToIso` / `addDaysIso` are used consistently; the previous `new Date().toISOString().slice(0, 10)` and `setUTCDate` patterns showed yesterday's date in the Manila timezone for the first 8 hours of every day.
- **Approve reuses `adminUpdateAttendance`.** The edit-request approve path doesn't reinvent the time-write logic; it calls into the same service the Edit Punch modal uses. That guarantees: recompute happens, the daily summary re-aggregates, and an `AttendanceEdit` entry is appended to the attendance doc's audit trail just as if the admin had typed the change in by hand. The only deviation is `notify: false` so the generic `punch_edited` notification doesn't fire alongside the request-specific one.
- **Edit-requests are server-mediated only.** Unlike notifications, `attendanceEditRequests` has no client-side listener. All reads and writes go through Express, which keeps the security model simple (default-deny in Firestore rules is enough) and means a malicious client can't sidestep validation. The trade-off: the admin queue isn't real-time - it refreshes on page load and after each approve/reject. For a small org that's a non-issue.
- **One pending request per attendance.** Stacking requests would let an employee invalidate the snapshot diff the admin sees ("Original" might no longer match reality). Rejecting duplicates at creation keeps the UI's "Original → Requested" comparison honest.
- **Employees can set times, not clear them.** Re-opening a closed session is an admin-only operation. The parser collapses `null`/`undefined`/`""` to "no change" rather than "clear field" - so even if the client sent `requestedTimeOut: null` (no input), the request would simply leave the existing time alone rather than reverting the session to active. A clear operation requires going through the normal Edit Punch modal as an admin.
