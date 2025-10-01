# Babysteps Product Specification

## 1. Overview

Parents and caregivers need a simple, reliable way to track essential baby care activities—feeding, diapers, sleep, pumping, meds—especially in the fog of newborn care. This app provides a fast, offline-capable, multi-caregiver web application (progressive web app) that captures events, syncs across devices, and surfaces meaningful insights like "last feed" and "total sleep."

## 2. Goals & Objectives

- **Capture quickly:** One-tap logging at 3 AM, with undo and timers.
- **Always available:** Offline-first with background sync.
- **Shared context:** Multiple caregivers logging to the same baby profile.
- **Peace of mind:** Notifications for overdue feeds, daily digests, exports for pediatrician visits.
- **Scalable foundation:** Web app first, with future mobile and hardware integrations.

## 3. Non-Goals

- Medical diagnostics or growth charts in v1.
- Hardware button/device integration (future phase).
- AI-driven insights (future phase).

## 4. Target Users

- **Primary:** Parents of newborns (0–12 months).
- **Secondary:** Caregivers, nannies, night nurses, family members.
- **Environment:** Mobile web (installable PWA) first with a desktop fallback experience.

## 5. User Stories & Acceptance Criteria

### 5.1 Event Logging

As a caregiver, I can log a feed, diaper, sleep, pump, med, or note with one tap.

**Acceptance Criteria**

- Large buttons on the home screen for each event type.
- Event timestamp defaults to "now" but can be adjusted.
- Data stored offline if no network connectivity is available and syncs later.
- Undo snackbar visible after logging to revert mistakes quickly.

### 5.2 Timers

As a caregiver, I can start/stop a timer for sleep or feeding.

**Acceptance Criteria**

- Active timers remain visible on the home screen.
- Stopping a timer automatically calculates duration and logs the event.
- Interrupted timers can be resumed or canceled without losing context.

### 5.3 History

As a caregiver, I can view a chronological list of past events.

**Acceptance Criteria**

- Events grouped by day for quick scanning.
- Filters by event type and date range.
- Infinite scroll or pagination supports large histories.
- CSV export of history for sharing with healthcare providers.

### 5.4 Stats

As a caregiver, I can view summaries of activity.

**Acceptance Criteria**

- "Last feed" pill shows elapsed time, method, and side/amount details.
- 24-hour and 7-day counts for feeds, diapers, and total sleep.
- Simple bar or line charts powered by Recharts.

### 5.5 Multi-Caregiver

As a parent, I can invite my partner or caregiver to log events for the same baby.

**Acceptance Criteria**

- Invite flow via email with role selection.
- Roles: admin, member, viewer.
- Caregivers see shared baby profiles and event streams.

### 5.6 Offline Support

As a caregiver, I can log events without internet connectivity.

**Acceptance Criteria**

- Events stored in an IndexedDB outbox using Dexie.js.
- Service worker retries sync automatically via background sync.
- User sees confirmation such as "Queued offline" when applicable.

### 5.7 Notifications

As a caregiver, I can get reminders and summaries.

**Acceptance Criteria**

- Web Push enabled after explicit user consent.
- Feed interval reminder triggers when time since last feed exceeds a configurable threshold.
- Daily digest delivered at the user’s local 7 AM.
- Quiet hours configurable to avoid nighttime alerts.

## 6. Functional Requirements

- **Authentication:** OTP login via NextAuth.
- **Data model:** Unified `BabyEvent` entity with flexible JSON payload for event-specific details.
- **API Endpoints:**
  - `POST /api/events` (idempotent create)
  - `GET /api/events` (history retrieval)
  - `POST /api/sync` (batch upsert for offline sync)
  - `GET /api/stats/daily`
  - `POST /api/push/subscribe`
- **Offline:** Dexie.js outbox with background sync orchestrated by the service worker.
- **Charts:** Recharts library for data visualization.
- **Installability:** PWA manifest and service worker caching strategies.

## 7. Technical Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** Next.js API routes (Node/Express equivalent runtime).
- **Database:** PostgreSQL managed via Prisma ORM.
- **Offline:** IndexedDB managed through Dexie.js, with service worker integration.
- **Push Notifications:** Web Push using VAPID keys.

## 8. Security & Privacy

- Row-level access control ensures a user must be a caregiver for a baby to read or write events.
- Idempotency keys applied to all event write operations.
- UTC timestamps stored alongside IANA timezone metadata.
- TLS enforced for data in transit and encryption at rest in storage.
- Minimal personally identifiable information stored (baby name and optional birthday).
- Prominent disclaimer: "Not a medical device."

## 9. Metrics & Success Criteria

- **Engagement:** Average events logged per day per baby.
- **Retention:** Percentage of users logging events beyond 14 days.
- **Reliability:** Less than 1% sync failures.
- **Growth:** Number of invited caregivers per baby.


---

## Getting Started

The Babysteps application now ships with a working Next.js implementation of the specification above. To run it locally:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Launch the development server:

   ```bash
   npm run dev
   ```

3. Visit http://localhost:3000 to explore the offline-ready caregiver workflow.

### Key Implementation Details

- **Offline-first data:** Client-side state is persisted to IndexedDB via Dexie. Events are queued in an outbox and surfaced through an optimistic UI with undo support.
- **Timers:** Feed and sleep timers stay visible on the home dashboard and convert into logged events when stopped.
- **History & exports:** Filter and export events to CSV directly from the History view.
- **Insights:** The Stats view computes rolling 24-hour/7-day metrics and renders a 7-day activity chart with Recharts.
- **Caregiver collaboration:** The Settings view manages baby profile data and queues caregiver invitations for later sync.
- **PWA shell:** A manifest and service worker enable installation and basic offline caching.

These foundations make it straightforward to connect to a real backend (Prisma/Postgres + NextAuth) and to extend the service worker with background sync and push notifications.
