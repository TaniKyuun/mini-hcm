# System Design - Mini HCM Time Tracking

## Overview

A lightweight HCM Time-In/Time-Out system built with **Vite + React** (frontend), **Node.js/Express** (backend), and **Firebase** (Firestore + Auth, free tier). Authentication is already implemented. This document covers the remaining features: user details storage, time-in/time-out logging, hours computation, daily summaries, and admin tools.

---

## 1. Requirements

### Functional
- Store user profile with name, email, role, timezone, and shift schedule in Firestore
- Punch In / Punch Out buttons; only one active session per user at a time
- Compute: regular hours, overtime (OT), night differential (ND), lateness, undertime
- Store daily totals in a `dailySummary` collection
- Dashboard with KPI cards + history table per employee
- Admin can view/edit punches and view daily/weekly reports for all employees

### Non-Functional
- Small scale: 1–50 employees → Firestore free tier is sufficient
- No real-time sync needed (polling or on-demand fetch is fine)
- Backend handles all computation (not the browser) for consistency
- Timezone-aware: all times stored as UTC, displayed in user's local timezone

---

## 2. Firestore Data Model

### `users/{uid}`
```json
{
  "uid": "firebase_uid",
  "name": "Juan dela Cruz",
  "email": "juan@company.com",
  "role": "employee",
  "timezone": "Asia/Manila",
  "schedule": {
    "start": "09:00",
    "end": "18:00"
  },
  "createdAt": "Timestamp"
}
```

### `attendance/{docId}`
Each document represents one work session (a punch-in + punch-out pair).
```json
{
  "userId": "firebase_uid",
  "date": "2026-05-14",
  "timeIn": "Timestamp (UTC)",
  "timeOut": "Timestamp (UTC) | null",
  "status": "active | completed",
  "computed": {
    "regularHours": 8.0,
    "overtimeHours": 1.5,
    "nightDifferentialHours": 0.0,
    "lateMinutes": 10,
    "undertimeMinutes": 0
  },
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```
> Document ID format: `{uid}_{YYYY-MM-DD}_{timestamp}`
> The `computed` field is `null` until punch-out triggers calculation.

### `dailySummary/{uid_YYYY-MM-DD}`
Aggregated totals per employee per day. Written only by the Express backend via Admin SDK.
```json
{
  "userId": "firebase_uid",
  "date": "2026-05-14",
  "regularHours": 8.0,
  "overtimeHours": 1.5,
  "nightDifferentialHours": 0.0,
  "lateMinutes": 10,
  "undertimeMinutes": 0,
  "totalHours": 9.5,
  "sessionsCount": 1,
  "updatedAt": "Timestamp"
}
```
> Document ID format: `{uid}_2026-05-14` - enables direct lookup without a query.

---

## 3. Hours Computation Logic

All computation runs in the Express backend (`server/services/computeService.js`).

```
Input: timeIn (UTC), timeOut (UTC), schedule { start, end }, timezone

Step 1 - Resolve scheduled boundaries in user's local timezone
  scheduledStart = date at schedule.start (e.g., 09:00) → convert to UTC
  scheduledEnd   = date at schedule.end   (e.g., 18:00) → convert to UTC

Step 2 - Lateness
  lateMinutes = max(0, timeIn − scheduledStart) in minutes

Step 3 - Undertime
  undertimeMinutes = max(0, scheduledEnd − timeOut) in minutes

Step 4 - Regular Hours (overlap of actual work with scheduled shift)
  effectiveStart = max(timeIn, scheduledStart)
  effectiveEnd   = min(timeOut, scheduledEnd)
  regularHours   = max(0, effectiveEnd − effectiveStart) in hours

Step 5 - Overtime (work beyond shift end)
  overtimeHours = max(0, timeOut − scheduledEnd) in hours

Step 6 - Night Differential (work between 22:00–06:00 local)
  Build ND windows: [22:00→23:59] and [00:00→06:00]
  ndHours = sum of intersections of [timeIn, timeOut] with each ND window
```

**Trigger:** Computation runs automatically on `POST /api/attendance/punch-out`. Admin edits re-trigger via `PUT /api/admin/attendance/:id`.

---

## 4. API Endpoints (Express)

All routes require `Authorization: Bearer <firebase_id_token>`. The auth middleware verifies it using the Firebase Admin SDK.

### Employee Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/attendance/punch-in` | Start session; 409 if already active |
| `POST` | `/api/attendance/punch-out` | End session; triggers computation |
| `GET`  | `/api/attendance/active` | Returns active session or `null` |
| `GET`  | `/api/attendance/history` | Params: `startDate`, `endDate` |
| `GET`  | `/api/summary/daily` | Param: `date` (default: today) |
| `GET`  | `/api/summary/weekly` | Param: `startDate` (returns 7 days) |

### Admin Routes (role: "admin" required)

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/admin/employees` | List all user profiles |
| `GET`  | `/api/admin/attendance` | Params: `userId`, `startDate`, `endDate` |
| `PUT`  | `/api/admin/attendance/:id` | Edit punch; re-runs computation |
| `GET`  | `/api/admin/reports/daily` | Param: `date`; all employees' metrics |
| `GET`  | `/api/admin/reports/weekly` | Param: `startDate`; 7-day rollup |

### Example Responses

**Punch-In (200)**
```json
{
  "sessionId": "abc123_2026-05-14_1715647200000",
  "timeIn": "2026-05-14T01:10:00.000Z",
  "status": "active"
}
```

**Punch-Out (200)**
```json
{
  "sessionId": "abc123_2026-05-14_1715647200000",
  "timeOut": "2026-05-14T10:30:00.000Z",
  "computed": {
    "regularHours": 8.83,
    "overtimeHours": 0.5,
    "nightDifferentialHours": 0,
    "lateMinutes": 10,
    "undertimeMinutes": 0
  }
}
```

---

## 5. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read:   if isOwner(userId) || isAdmin();
      allow create: if request.auth != null;      // on registration
      allow update: if isAdmin();
    }

    match /attendance/{docId} {
      allow read:   if isOwner(resource.data.userId) || isAdmin();
      allow create: if isOwner(request.resource.data.userId);
      allow update: if false;   // backend (Admin SDK) only
    }

    match /dailySummary/{docId} {
      allow read:  if docId.matches(request.auth.uid + '_.*') || isAdmin();
      allow write: if false;   // backend (Admin SDK) only
    }
  }
}
```

---

## 6. React Component & File Structure

```
src/
├── pages/
│   ├── Dashboard.jsx       ← KPI cards + PunchCard + today's summary
│   ├── History.jsx         ← Paginated attendance history table
│   └── Admin.jsx           ← Employee list, punch editing, reports
├── components/
│   ├── PunchCard.jsx       ← Punch In/Out buttons + live elapsed timer
│   ├── KpiCard.jsx         ← Reusable metric card
│   ├── AttendanceTable.jsx ← History table (shared by employee + admin)
│   └── ReportTable.jsx     ← Admin report grid (employees × metrics)
├── hooks/
│   ├── useActiveSession.js ← Fetches GET /api/attendance/active on mount
│   ├── useDailySummary.js
│   └── useWeeklySummary.js
├── services/
│   ├── attendanceService.js
│   └── adminService.js
└── utils/
    └── formatTime.js       ← Duration and time formatting helpers
```

### Express Backend Structure

```
server/
├── index.js
├── middleware/
│   └── auth.js              ← Verify Firebase ID token
├── routes/
│   ├── attendance.js
│   ├── summary.js
│   └── admin.js
└── services/
    ├── computeService.js    ← Pure functions: computeHours(timeIn, timeOut, schedule, tz)
    └── summaryService.js    ← Aggregate sessions → write dailySummary
```

---

## 7. Key Implementation Notes

### Preventing Double Punch-In
On `POST /api/attendance/punch-in`, query Firestore for any doc where `userId == uid AND status == "active"`. If found, return 409. Never rely on client-side state alone for this guard.

### Timezone Handling
Store all Firestore timestamps as UTC. Use the `timezone` field from the user profile to resolve local schedule boundaries and for display. Recommended: `luxon` or `date-fns-tz`.

### dailySummary Write Strategy
On each punch-out, re-read all sessions for that user on that date, sum the `computed` fields, and overwrite the `dailySummary` document. This avoids stale aggregation bugs and is safe for small scale.

### Admin Punch Edit Flow
1. Admin sends `PUT /api/admin/attendance/:id` with new `timeIn`/`timeOut`
2. Backend fetches user schedule from `users/{uid}`
3. Runs `computeService` with the corrected times
4. Writes updated `computed` back to the attendance document
5. Re-aggregates and overwrites `dailySummary` for that user+date

---

## 8. Suggested Build Order

1. **User details on registration** - write `users/{uid}` doc with name, role, timezone, schedule when a new user signs up
2. **Punch In/Out endpoints** - `POST /punch-in` and `POST /punch-out` with Firestore writes
3. **PunchCard component** - React UI that checks active session on load, shows In/Out button accordingly
4. **computeService** - pure functions (easy to unit test)
5. **dailySummary aggregation** - called at end of punch-out handler
6. **Dashboard page** - KPI cards from `/api/summary/daily`
7. **History page** - table from `/api/attendance/history`
8. **Admin routes + Admin page** - reports and punch editing last
