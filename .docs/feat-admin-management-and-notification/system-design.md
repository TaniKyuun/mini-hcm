# System Design - Admin Management & In-App Notifications

## Overview

Four feature additions on top of the existing punch-attendance foundation, plus the validation, working-days, and UX hardening that landed alongside them:

1. **Admin - Add new employee account** (Firebase Auth user + Firestore profile created server-side in one shot)
2. **Admin - Adjust employee schedule & profile** (full Edit dialog: name, email, role, timezone, shift times, **working days**, employment type, location)
3. **Employee/Admin - In-app notification system** (Firestore `notifications` collection + client `onSnapshot` listener, real-time bell badge)
4. **Employee - Request a punch fix; Admin - Approve/Reject** (employee submits a proposed change to a clock-in/out from History; admin reviews, approves to apply via the existing edit pipeline, or rejects with an optional note. Either outcome notifies the employee in real time.)

Scope decisions:
- Notifications are **in-app only**. No Firebase Cloud Messaging / push / service worker / VAPID. The tab must be open.
- Schedules still use a single shift `{ start: 'HH:MM', end: 'HH:MM' }` shape - no per-day variants - but now also carry an optional `workingDays: number[]` so admins can opt employees in or out of weekends. Default when absent: Mon–Fri.
- All validation errors flow through a shared `ValidationError` type → HTTP 400 with `{ error, field }` so the client can highlight the offending input.
- Edit requests can only **set** new times - they can't clear an open clock-out. Re-opening a session remains an admin-only operation. Only one pending request per attendance record is allowed at a time.

---

## 1. Requirements

### Functional
- An admin can create a Firebase Auth user **and** the matching Firestore `users/{uid}` profile in one server-side action, with a temporary password and the same profile fields (name, email, role, timezone, schedule, working days, employment type, location).
- An admin can edit any employee's name, email, role, timezone, **shift schedule**, **working days**, employment type, and location from a single dialog.
- Working days are configurable per employee - admins toggle a row of Sun–Sat chips. By default new employees start with Mon–Fri.
- The attendance page renders a neutral `rest day` badge (instead of red `absent`) for employees on a non-working day, and lets admins filter the roster by that state.
- When an admin edits an employee's punch record with the "Notify employee" checkbox on, the employee receives an in-app notification, visible on their bell icon in real time (no page refresh needed).
- The notification dropdown shows title, body, relative time, and unread state. Users can mark one read by clicking it, or mark them all read.
- For end-to-end testing, an admin can trigger a self-addressed test notification from the Settings page.
- An employee can request a fix to any of their own attendance records from the History page. They propose a new clock-in and/or clock-out plus a reason, and the request is queued for admin review.
- An admin can view all edit requests (filtered by Pending / Approved / Rejected / All) in a dedicated page. Approving applies the requested times through the same `adminUpdateAttendance` pipeline (recompute, dailySummary aggregation, audit-log entry); rejecting just records the decision. Both outcomes write a notification to the employee.

### Non-Functional
- New writes still go through Express (Admin SDK) - the browser never writes to `users`, `notifications`, or `attendanceEditRequests` directly.
- **Reads** of notifications use the Firestore client SDK's `onSnapshot` for real-time delivery, gated by security rules. Mark-as-read goes through the REST API for server-side ownership checks.
- The `notifications` query is intentionally **single-field** (`where('recipientUid', '==', uid)`) so no composite index is required. Sorting and the 20-item cap happen client-side.
- Validation errors return HTTP 400 with a `field` tag the client can map to inline error UI. Service code throws typed `ValidationError`s rather than silently dropping bad input - the original `adminUpdateProfile` was doing the latter, which was a frequent source of confusing "I saved but nothing changed" bugs.
- Small scale: 1–50 employees. Roster paginates at 10 rows per page so even larger orgs stay snappy.
- No new third-party libraries added; `date-fns` (already installed) handles relative timestamps.

---

## 2. Firestore Data Model

### `users/{uid}` (extended)

The model already supported `location` and `employmentType` on the client; the server was silently dropping them. Both are now persisted. `schedule.workingDays` is new.

```json
{
  "uid": "firebase_uid",
  "name": "Juan dela Cruz",
  "email": "juan@company.com",
  "role": "employee",
  "timezone": "Asia/Manila",
  "schedule": {
    "start": "09:00",
    "end": "18:00",
    "workingDays": [1, 2, 3, 4, 5]
  },
  "location": "On-Site",
  "employmentType": "Full-time",
  "createdAt": "Timestamp"
}
```

`workingDays` is optional - Sun=0..Sat=6. When absent or empty, every consumer reads it as `[1,2,3,4,5]` (Mon–Fri) via the shared helper. This keeps pre-migration documents valid: they keep working with no Firestore migration needed.

### `notifications/{notificationId}` (NEW)

Auto-generated document ID via Firestore `add()`.

```json
{
  "recipientUid": "firebase_uid",
  "actorUid": "admin_firebase_uid",
  "type": "punch_edited",
  "read": false,
  "title": "Your time entry was edited",
  "body": "Reason: Train delay (approved by manager)",
  "metadata": {
    "attendanceId": "abc123_2026-05-14_1715647200000",
    "date": "2026-05-14"
  },
  "createdAt": "Timestamp"
}
```

`type` is now `'punch_edited' | 'edit_request_created' | 'edit_request_approved' | 'edit_request_rejected'`. Future kinds (`'schedule_changed'`, `'admin_message'`, ...) extend the union without a schema change. `metadata` is open-shaped to avoid forcing every notification kind through the same field set.

### `attendanceEditRequests/{requestId}` (NEW)

Auto-generated document ID via Firestore `add()`. Tracks employee-submitted change requests against existing `attendance/{id}` records.

```json
{
  "attendanceId": "abc123_2026-05-14_1715647200000",
  "requesterUid": "firebase_uid",
  "date": "2026-05-14",
  "originalTimeIn": "2026-05-14T01:10:00.000Z",
  "originalTimeOut": "2026-05-14T10:30:00.000Z",
  "requestedTimeIn": "2026-05-14T01:05:00.000Z",
  "requestedTimeOut": null,
  "reason": "Forgot to clock in on time after the morning standup.",
  "status": "pending",
  "createdAt": "Timestamp",
  "resolvedAt": null,
  "resolvedBy": null,
  "adminNote": null
}
```

- `requesterUid` is the employee who filed the request (enforced server-side: must match the `userId` on the linked attendance doc).
- `requestedTimeIn` / `requestedTimeOut` are ISO strings when the employee wants to set a new time, or `null` when that field should stay unchanged. At least one must be a string.
- `originalTimeIn` / `originalTimeOut` are a snapshot of the attendance values at submission time - they let the admin compare proposed vs. existing without an extra fetch.
- `status` transitions `pending → approved` or `pending → rejected`. Resolution is one-way.
- `adminNote` carries the optional message the admin types in the approve/reject form; it's surfaced in the resulting notification body.

---

## 3. API Endpoints (Express)

All routes require `Authorization: Bearer <firebase_id_token>`.

### Admin (role: admin required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/employees` | Create Auth user + Firestore profile. 400 on missing/invalid fields, 409 if email taken |
| `PUT`  | `/api/admin/employees/:uid` | Update any subset of `{name, email, role, timezone, schedule, location, employmentType}`. 400 with `{ field }` on validation failure |
| `POST` | `/api/admin/notifications/test` | Creates a self-addressed test `punch_edited` notification (optional `recipientUid` body param targets someone else). Used by the Settings demo button |
| `GET`  | `/api/admin/edit-requests` | List edit requests, sorted newest first. Optional `?status=pending\|approved\|rejected` filter |
| `POST` | `/api/admin/edit-requests/:id/approve` | Apply the requested change via `adminUpdateAttendance`, mark the request approved, notify the employee. Optional `{ adminNote }` body |
| `POST` | `/api/admin/edit-requests/:id/reject` | Mark the request rejected, notify the employee. Optional `{ adminNote }` body |

**`POST /api/admin/employees` body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "password": "temp-pass-8plus",
  "role": "employee",
  "timezone": "Asia/Manila",
  "schedule": {
    "start": "09:00",
    "end": "18:00",
    "workingDays": [1, 2, 3, 4, 5]
  },
  "employmentType": "Full-time",
  "location": "On-Site"
}
```

Response (201) is the serialized `UserProfile` - same shape as the PUT response.

**Validation-error response (400)** - applies to both employee endpoints and attendance edit:
```json
{ "error": "Schedule start and end cannot be the same time.", "field": "schedule" }
```
The optional `field` lets the client highlight the offending input.

### Notifications (any authenticated user)

| Method | Path | Description |
|--------|------|-------------|
| `GET`   | `/api/notifications` | Returns `{ notifications, unreadCount }` (up to 20, newest first, recipient-scoped) |
| `PATCH` | `/api/notifications/:id/read` | Mark one as read. 403 if it doesn't belong to the caller |
| `PATCH` | `/api/notifications/read-all` | Mark all of the caller's unread as read |

### Edit requests (any authenticated user)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/edit-requests` | Employee submits a new request for their own attendance. Body: `{ attendanceId, requestedTimeIn?, requestedTimeOut?, reason }`. 400 on validation failure, 404 if the attendance doesn't exist |
| `GET`  | `/api/edit-requests` | Returns `{ editRequests }` for the calling user, newest first |

**Submission errors return 400 with `{ error, field }`** for: empty/long reason, malformed `requestedTime*`, both proposed times missing, attendance owned by someone else, a pending request already exists for the same attendance.

The GET endpoint exists for non-realtime clients and for parity, but the live UI uses `onSnapshot` directly (see §5).

### Attendance edit (existing endpoint, hardened)

`PUT /api/admin/attendance/:id` now returns **400** (instead of unhandled 500) when:
- `timeIn` / `timeOut` parse fails
- `timeOut <= timeIn`

…with the same `{ error, field }` shape.

---

## 4. Firestore Security Rules

```javascript
match /notifications/{notificationId} {
  // Recipients can read their own
  allow read: if request.auth != null
    && resource.data.recipientUid == request.auth.uid;

  // Recipients can ONLY flip the `read` field
  allow update: if request.auth != null
    && resource.data.recipientUid == request.auth.uid
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);

  // Creation and deletion are server-only (Admin SDK bypasses rules)
  allow create, delete: if false;
}
```

The `diff().affectedKeys().hasOnly(['read'])` guard is what makes it safe to give the client a direct `onSnapshot` listener: even if a user authenticated as the recipient tried to tamper with `title` or `actorUid`, the rule denies it. The only mutation possible from the browser is marking-as-read - which the REST endpoint also enforces server-side.

Deploy these with `firebase deploy --only firestore:rules`. Without that deploy the listener will fail with a permission-denied error, which the bell now surfaces inline.

`attendanceEditRequests/*` keeps the default-deny rule: all reads and writes go through Express (Admin SDK), so no client-side rule is needed beyond the project-wide `match /{document=**}` deny.

---

## 5. Real-Time Delivery Strategy

A split between Firestore SDK and REST API:

```
┌───────────────────────────────────────┐
│  Client                               │
│  ┌──────────────┐    ┌──────────────┐ │
│  │ useNotif.()  │    │ markRead()   │ │
│  │ onSnapshot   │    │ PATCH /api   │ │
│  └──────┬───────┘    └──────┬───────┘ │
└─────────┼───────────────────┼─────────┘
          │                   │
   ┌──────▼──────┐     ┌──────▼──────┐
   │  Firestore  │     │  Express    │
   │  (rules)    │     │  (Admin SDK)│
   └─────────────┘     └──────┬──────┘
                              │ writes
                       ┌──────▼──────┐
                       │  Firestore  │
                       └─────────────┘
```

- **Read path** - `onSnapshot` on `notifications where recipientUid == uid` (no `orderBy`, no `limit` in the Firestore query). The hook sorts by `createdAt desc` and slices the top 20 client-side. Subscriptions are torn down when the user logs out or the component unmounts.
- **Write paths** - only two:
  - Express creates notifications via `notificationService.createNotification`:
    - …when an admin edits a punch with `notify: true`, or
    - …when an admin triggers a test from the Settings demo button.
  - Mark-as-read mutations go through the REST API (`PATCH /api/notifications/:id/read`) which double-checks ownership before writing. Client state is updated optimistically.

Why not just use REST for reads too? Because then every "new notification" would need either a poll or a websocket. `onSnapshot` already solves that - and security rules make it safe.

Why no `orderBy` in the query? Composite indexes have to be provisioned in Firestore before the query works; a missing index surfaces as a `FAILED_PRECONDITION` error and creates an entire deployment step. Sorting 20 records client-side is free and removes that operational cost.

---

## 6. New Frontend Files

```
client/src/
├── components/
│   ├── AddEmployeeDialog.tsx     ← creates Auth user + profile via POST /api/admin/employees
│   ├── EditEmployeeDialog.tsx    ← edits role, schedule (incl. working days), employment, location
│   ├── NotificationBell.tsx      ← bell icon with unread badge + dropdown list
│   └── RequestFixModal.tsx       ← employee proposes new clock-in/out + reason
├── hooks/
│   └── useNotifications.ts       ← onSnapshot + REST mark-as-read
├── pages/
│   └── AdminEditRequests.tsx     ← admin review queue (Pending / Approved / Rejected / All)
├── services/
│   ├── editRequestService.ts     ← create / list / approve / reject wrappers
│   └── notificationService.ts    ← thin REST wrappers (mark read, mark all read)
└── utils/
    ├── validateProfile.ts        ← shared per-field validators + FieldErrors type
    └── workingDays.ts            ← DEFAULT_WORKING_DAYS, DAY_LABELS, effectiveWorkingDays, isWorkingDay, formatWorkingDays
```

Existing files extended:
- `pages/AdminPeople.tsx` - wires both new dialogs; adds Role column, "Open attendance" redirect, clear-search X button, 10-row pagination footer.
- `pages/AdminAttendance.tsx` - reads `?uid=` query param to preselect the redirected employee; rest-day badge + filter + count; clear-search X button.
- `pages/Admin.tsx` - wires the dashboard's "Add employee" button to `AddEmployeeDialog`.
- `pages/Settings.tsx` - admin-only "Notification demo" card with a Send-test button.
- `pages/History.tsx` - wires the existing "Request fix" button to `RequestFixModal`; capped right card height (`max-h-[80vh]`) so the audit log scrolls inside.
- `pages/Dashboard.tsx` + `utils/computeAttendance.ts` - `daysAgoIso` / `addDays` switched to local-time math.
- `components/site-header.tsx` - replaces the static `<BellIcon />` button with `<NotificationBell />`.
- `components/EditPunchModal.tsx` - per-field validation (clock-in/out parse, clock-out > clock-in, reason length), inline destructive messages, Save disabled when invalid.
- `components/app-sidebar.tsx` - new "Edit requests" nav entry between Attendance and Reports in the admin sidebar.
- `App.tsx` - registers the `/admin/edit-requests` route.
- `lib/firebase.ts` - initializes and exports `db` (Firestore client SDK).
- `types/api.ts` - adds `Notification`, `NotificationsResponse`, `NotificationType`, `NotificationMetadata`; extends `UserSchedule` with optional `workingDays`; adds `EditRequest`, `EditRequestStatus`, `EditRequestsResponse`.
- `services/adminService.ts` - adds `createEmployee`, `triggerTestNotification`; extends `AdminUpdateProfileBody`.

## 7. New Backend Files

```
server/src/
├── lib/
│   └── workingDays.ts            ← DEFAULT_WORKING_DAYS, effectiveWorkingDays, isWorkingDay
├── services/
│   └── editRequestService.ts     ← create / list / approve / reject + validation
└── routes/
    ├── editRequests.ts           ← POST / + GET / (employee endpoints)
    └── notifications.ts          ← GET / PATCH /:id/read / PATCH /read-all
```

Existing files extended:
- `services/notificationService.ts` - was a console-log stub. Now writes real Firestore documents via `createNotification`; `notifyEmployeeOfEdit` composes a `punch_edited` doc.
- `services/userService.ts` - adds `createEmployeeProfile`, extends `adminUpdateProfile` with `location` and `employmentType`, exports `EmailAlreadyExistsError` **and** `ValidationError`. `assertValidSchedule` throws on bad input (including malformed `workingDays`).
- `services/attendanceService.ts` - `adminUpdateAttendance` throws `ValidationError` for bad date parsing or `timeOut <= timeIn`; `notifyEmployeeOfEdit` call now passes `actingUid` + attendance metadata.
- `routes/admin.ts` - adds `POST /employees`, `POST /notifications/test`, `GET /edit-requests`, `POST /edit-requests/:id/approve`, and `POST /edit-requests/:id/reject` handlers; `putEmployee` and `putAttendance` translate `ValidationError → 400 { error, field }`.
- `routes/users.ts` - `putMe` translates `ValidationError → 400` too.
- `types/models.ts` - adds `NotificationDoc`, `NotificationType` (extended union), `NotificationMetadata`, `EditRequestStatus`, `AttendanceEditRequestDoc`; extends `UserSchedule` with optional `workingDays`.
- `lib/constants.ts` - adds `NOTIFICATIONS_COLLECTION = 'notifications'` and `EDIT_REQUESTS_COLLECTION = 'attendanceEditRequests'`.
- `lib/serialize.ts` - adds `serializeNotification` and `serializeEditRequest` (Timestamp → ISO string).
- `app.ts` - registers `notificationsRouter` under `/api/notifications` and `editRequestsRouter` under `/api/edit-requests`.

---

## 8. Key Implementation Notes

### Atomic-ish employee creation
`createEmployeeProfile` first creates the Firebase Auth user, then writes the Firestore profile. If the Firestore write fails after the Auth user is created, the Auth user is left orphaned. For 1–50-employee scale this is acceptable - the admin retries with the same email and gets a 409 to clean up later. A future hardening would wrap the two writes with a try/catch that calls `auth.deleteUser` on rollback.

### Why an explicit `EmailAlreadyExistsError`
The Firebase Admin SDK returns `error.code === 'auth/email-already-exists'`. The route layer needs to translate that into HTTP 409 specifically (not the generic 500 error handler), so the service throws a typed error that the handler can branch on.

### Validation pattern
Service code throws `ValidationError(message, field?)` for *any* invalid input. The route handler does `if (err instanceof ValidationError) return res.status(400).json({ error: err.message, field: err.field })`. This is used by:
- `POST /api/admin/employees` (createEmployeeProfile)
- `PUT /api/admin/employees/:uid` (adminUpdateProfile)
- `PUT /api/me` (updateOwnProfile)
- `PUT /api/admin/attendance/:id` (adminUpdateAttendance)
- `POST /api/edit-requests` (createEditRequest)
- `POST /api/admin/edit-requests/:id/approve` and `.../reject` (approve/rejectEditRequest)

The previous behavior in `adminUpdateProfile` was to silently skip malformed fields - admins thought their schedule edit saved when nothing actually changed. Throwing instead makes the bug loud.

### Edit-request flow: approve reuses the existing pipeline
When an admin approves a request, the service doesn't write the new times directly. Instead it calls `adminUpdateAttendance(attendanceId, { timeIn, timeOut, reason }, adminUid)` - exactly what the Edit Punch modal does. That means the same code path runs: `computeHours` recomputes regular/OT/ND/late, `writeDailySummary` re-aggregates the day, and an `AttendanceEdit` entry is appended to the attendance doc's `edits` array. The only difference vs. a direct admin edit: `notify: false` is passed (the edit-request service sends its own `edit_request_approved` notification with the admin note instead of the generic `punch_edited` one).

### One pending request per attendance
`createEditRequest` queries `attendanceEditRequests where attendanceId == X and status == 'pending'` and rejects (400) if any match. This prevents an employee from stacking conflicting amendments. Resolved requests (approved/rejected) don't block - the employee can file a follow-up if needed.

### Notification types for edit requests
Approving writes a `'edit_request_approved'` notification with the title `"Your time-entry change was approved"`; rejecting writes `'edit_request_rejected'` with `"Your time-entry change was rejected"`. The body uses the admin note if provided, otherwise a sensible default. Both ride the same Firestore + `onSnapshot` delivery path as `punch_edited` notifications, so they appear in the bell with no extra UI changes.

### Mark-as-read race condition
The client optimistically marks a notification as read locally before the REST call resolves. If the call fails, the local state will heal on the next `onSnapshot` tick (Firestore is the source of truth). The error is also surfaced on the hook's `error` field.

### Why no composite index
The original design had the listener query `where(...).orderBy('createdAt','desc').limit(20)`, which requires a composite index on `(recipientUid, createdAt)`. Without that index Firestore returns `FAILED_PRECONDITION` and the listener silently dies. Dropping `orderBy`/`limit` and sorting/slicing client-side avoids the operational dependency entirely - Firestore auto-indexes single fields. For dozens of notifications per user, the cost is invisible.

### Working-days default semantics
`schedule.workingDays` is optional in Firestore. Every consumer routes through `effectiveWorkingDays(schedule)` (in `client/src/utils/workingDays.ts` and `server/src/lib/workingDays.ts`) which returns `[1,2,3,4,5]` when the field is missing or empty. Validation rejects an empty array on writes - "omit the field" is the only encoding for "default Mon–Fri".

### Why no toast library
Inline `<p className="bg-destructive/10 text-destructive">` blocks inside dialogs are the project's existing pattern (see `EditPunchModal`). Adding `sonner` was considered and intentionally skipped to keep the dependency surface tight. The bell's listener-error banner uses the same destructive-style inline block.
