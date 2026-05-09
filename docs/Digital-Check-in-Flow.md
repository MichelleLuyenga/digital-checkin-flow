Building a polished mobile check-in flow is deceptively quick—until you have to plug it into a hotel’s Property Management System. This walkthrough builds a fully functional, mobile-first PWA (Next.js, TypeScript, Supabase) that mirrors the HTNG Guest Self-Service standard, while deliberately exposing the messy, asynchronous, legacy-infested reality hiding behind every “simple” UI step.

---

## 1. What we’re building (and why HTNG matters)

**HTNG (Hotel Technology Next Generation)** publishes open specifications so hotels don’t have to build a custom bridge for every PMS. The most relevant spec here is *Guest Self-Service (GSS)*, which standardises:

- Pre-arrival check-in link delivery
- Identity verification (with an Identity Provider)
- Room preference / upsell selection
- Mobile key / QR code issuance

We’ll simulate the entire loop: a real-time reservation, an identity check, room preferences, and a QR code that acts as a digital key **without** actually needing a working PMS. The code will be ready to swap the mock PMS adapter for a real one (Opera, Mews, Maestro, etc.).

---

## 2. System architecture

```
┌─────────────────────────┐
│   Guest’s Mobile PWA    │
│  (Next.js + TypeScript) │
└────────────┬────────────┘
             │ HTTPS
┌────────────▼────────────────────────────┐
│        Next.js API Routes               │
│  - /api/checkin/validate                │
│  - /api/checkin/verify-identity         │
│  - /api/checkin/preferences             │
│  - /api/checkin/issue-qr                │
│  - /api/qr/validate (for door/kiosk)   │
└──┬──┬──────────────┬────────────────────┘
   │  │              │
   │  │ Supabase     │ External Services
   │  │ (DB, Auth,   │ (Identity Verification,
   │  │  Storage,    │  PMS Adapter)
   │  │  Realtime)   │
   │  │              │
   ▼  ▼              ▼
┌─────────┐   ┌────────────────┐
│Supabase │   │  PMS Adapter   │
│ Tables  │   │  (REST wrapper │
│         │   │   for legacy   │
│         │   │   OWS/SOAP)    │
└─────────┘   └────────────────┘
```

- **Next.js** serves the PWA and the API layer.  
- **Supabase** stores reservations, guest data, verification status, preferences, and QR tokens. It also provides real-time status updates to the frontend.  
- **PMS Adapter** – a standalone service (or set of serverless functions) that translates our clean REST calls into whatever the PMS expects. In our demo, it’s a mock that simulates Opera’s OWS interface.  
- **Identity Verification** – third-party KYC (e.g., Onfido, Jumio). We mock it in dev, but the integration complexity is real.

---

## 3. Pre-arrival link & PWA basics

When a reservation is created in the PMS (or Supabase mock), we generate a unique, expirable check-in URL:

```
https://checkin.hotel.com/c/3fa2b7c1-9c3e-4f8b-a1b2-c5d6e7f809ab
```

That UUID is stored in a `checkin_sessions` table together with the reservation ID and an expiration timestamp. The PWA is set up using `next-pwa` so it can be installed on the home screen.

```ts
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});
module.exports = withPWA({ /* … */ });
```

The page for `/c/[token]` fetches the reservation, checks expiry, and starts the flow.

---

## 4. Step-by-step flow (with code snippets)

### 4.1 Landing – token validation

```tsx
// pages/c/[token].tsx
export async function getServerSideProps(context) {
  const { token } = context.params;
  const { data: session, error } = await supabase
    .from('checkin_sessions')
    .select('*, reservation:reservations(*)')
    .eq('token', token)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    return { notFound: true };
  }

  return { props: { reservation: session.reservation } };
}
```

### 4.2 Identity verification

The UI is a simple camera/file upload. Behind it:

- File uploaded to Supabase Storage.
- On success, an API route `POST /api/checkin/verify-identity` is called with the document URL.
- The route:
  1. Calls the **identity provider** (mock/Onfido) to check the document.
  2. On success, updates `identity_verifications` table with status `verified`.
  3. Calls the **PMS adapter** to attach the identity document to the guest profile and, optionally, mark the reservation as “checked-in” (PMS may require a separate step).

**PMS complexity here**:  
Some PMSs (like Opera) have limited APIs for guest documents. Often you can only store a free-text “ID Number” field, or you must use a separate Document Management System. The adapter must translate our straightforward `guest.identity_document_url` into whatever proprietary fields exist. If the PMS call fails, we need to queue a retry and possibly revert the local status—**compensating transactions**.

```ts
// pages/api/checkin/verify-identity.ts
export default async function handler(req, res) {
  const { reservationId, documentUrl } = req.body;

  // 1. Call KYC provider (mocked)
  const kycResult = await mockKycCheck(documentUrl);
  if (!kycResult.passed) return res.status(400).json({ error: 'Verification failed' });

  // 2. Save to Supabase
  await supabase.from('identity_verifications').insert({
    reservation_id: reservationId,
    document_url: documentUrl,
    status: 'verified'
  });

  // 3. Update PMS guest profile (with error handling)
  try {
    await pmsAdapter.updateGuestCheckinStatus(reservationId, 'Verified');
  } catch (e) {
    // Queue for retry, log error, set local status as 'pending_sync'
    await queue.add('pms-retry', { reservationId, action: 'identity-verified' });
    // Local status reflects eventual consistency
  }

  res.status(200).json({ status: 'verified' });
}
```

### 4.3 Room preference selection

A form (floor, bed type, pillow choice, newspaper). On submit:

- Preferences stored in `preferences` table.
- API `POST /api/checkin/preferences` calls the PMS adapter to update the reservation’s special requests or assign a specific room if available.

**PMS complexity**: PMS room assignment is a **transactional process** that often blocks room inventory. If the PMS returns “room not available”, we must offer an alternative. HTNG’s GSS spec defines a `RoomPreference` message that supports multiple options. Our adapter can request a list of available rooms matching preferences, present them to the guest, and then confirm the assignment.

```ts
// Inside API route
const availableRooms = await pmsAdapter.getAvailableRooms(reservationId, {
  floor: preferences.floor,
  bedType: preferences.bed_type,
});
if (availableRooms.length === 0) {
  return res.status(409).json({ error: 'No rooms match your preferences' });
}
// Auto-assign first or let guest choose
const assigned = await pmsAdapter.assignRoom(reservationId, availableRooms[0].id);
```

### 4.4 QR code delivery

Once identity is verified and preferences saved, the guest can generate a digital key. We create a short-lived JWT (or random token) and generate a QR code containing the URL:

```
https://checkin.hotel.com/api/qr/validate?token=jwt-or-uuid
```

```tsx
import { QRCodeCanvas } from 'qrcode.react';

<QRCodeCanvas value={`${window.location.origin}/api/qr/validate?token=${qrToken}`} size={256} />
```

The token is stored in `qr_tokens` with expiration (e.g., 24h). When the QR is scanned at the door lock or a lobby kiosk, it calls the validation endpoint which returns guest name, room number, and validity status. **Importantly**, the PMS may need to be informed that a key was issued (so the lock system can be programmed). In many hotels this goes through a **key encoder interface** (e.g., Assa Abloy Vostio, Salto) integrated with the PMS. Our adapter mimics that by sending a `KeyIssued` event to the PMS.

**PMS complexity**: The PMS typically does not issue the key; it sends a request to the lock system. The lock system may need a different protocol (often UDP or a vendor-specific cloud API). The PMS adapter must either:
- Act as a translation layer to the lock vendor, or
- Rely on the PMS’s built-in mobile key support (HTNG’s Mobile Key specification). In reality, this can be weeks of integration.

---

## 5. The gap: PMS integration unleashed

A beautiful UI can be built in a day. The PMS side often takes months because:

### 5.1 Diverse, legacy interfaces
- **Opera PMS** uses OWS (Oracle Web Services) – SOAP/XML, with rigid request/response structures.
- **Mews** has a modern REST API, but still requires understanding their reservation lifecycle (confirmed, started, processed).
- **Maestro** often uses file drops or SQL-linked tables.
- Many independent hotels run on-premise systems with no API; integration means writing a Windows service that scrapes the database.

A single “PMS adapter” interface is unrealistic. The HTNG GSS spec attempts to standardise this, but adoption is slow. Our `pmsAdapter` must be a pluggable module:

```ts
// pmsAdapter.ts (interface)
interface IPMSAdapter {
  updateGuestCheckinStatus(reservationId: string, status: string): Promise<void>;
  getAvailableRooms(reservationId: string, criteria: RoomCriteria): Promise<Room[]>;
  assignRoom(reservationId: string, roomId: string): Promise<void>;
  issueMobileKey(reservationId: string): Promise<KeyResponse>;
}

// operaAdapter.ts implements IPMSAdapter using SOAP
// mewsAdapter.ts implements IPMSAdapter using REST
```

### 5.2 Async workflows & idempotency
PMS operations are not transactional across systems. If updating guest preferences succeeds but room assignment fails, the UI must remain consistent. That’s why we design every API route with a **local-first** approach: write to Supabase, then sync to PMS. If sync fails, a background queue (e.g., BullMQ + Redis) retries. The frontend shows “syncing…” or “pending” via Supabase Realtime subscriptions.

### 5.3 Data model mismatch
- PMS stores “Guest Title” as `Mr/Mrs`, but our UI uses “Mx./Dr./etc.” – mapping required.
- Some PMS have no field for dietary preferences; we store that only in Supabase and note it as a “Special Request” free-text.
- Identity document details (passport number, nationality) must be mapped to PMS fields that often have character limits.

### 5.4 Real-time not real-time
PMS responses can take 2–10 seconds, and status changes (like room ready) are not pushed. We implement **polling** or webhooks where available. For Opera, you might have to poll the `FetchBooking` endpoint every 30 seconds to know if housekeeping marked the room as clean – a far cry from the instant “Your room is ready” push notification you’d expect.

---

## 6. HTNG GSS mapping

We align our data flow with the HTNG Guest Self-Service actors:

| HTNG Component        | Our Implementation                         |
|-----------------------|--------------------------------------------|
| Guest Device          | PWA in Next.js                             |
| GSS Application       | Next.js API routes + Supabase logic        |
| Identity Provider     | Mock KYC or Onfido (via webhook)           |
| PMS Bridge            | PMS Adapter (Opera/Mews mock)              |
| Mobile Key Provider   | QR code validation endpoint                |

By adhering to the message formats (e.g., `GuestCheckInRequest`, `RoomPreference`, `KeyIssued`) we can one day replace the mock with a certified HTNG PMS without rewriting the frontend.

---

## 7. Supabase schema (simplified)

```sql
create table reservations (
  id uuid primary key,
  guest_name text,
  arrival_date date,
  departure_date date,
  room_type text,
  status text -- 'created','checked_in','in_house'
);

create table checkin_sessions (
  token uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations,
  expires_at timestamptz
);

create table identity_verifications (
  id uuid primary key,
  reservation_id uuid,
  document_url text,
  status text,
  verified_at timestamptz
);

create table preferences (
  reservation_id uuid primary key,
  floor_preference text,
  bed_type text,
  amenities text[]
);

create table qr_tokens (
  token uuid primary key,
  reservation_id uuid,
  issued_at timestamptz,
  expires_at timestamptz,
  used boolean default false
);
```

Row Level Security ensures a guest can only see their own reservation by matching a `guest_id` cookie/JWT issued after token validation.

---

## 8. PWA & offline considerations

The PWA is configured with a service worker that caches the app shell. During check-in, the whole flow **requires internet** (for identity upload and PMS sync). However, we provide offline fallback:

- If the API call fails, we save the progress locally (IndexedDB) and queue a sync when back online (using Background Sync or a simple retry button).
- The QR code can be saved for offline use; the door lock/kiosk will verify it with the server independently, so it remains secure.

---

## 9. QR authentication detail

The QR token is a time-limited JWT signed with a secret known only to the validation endpoint. Payload:

```json
{
  "sub": "reservation_id",
  "room": "101",
  "guest_name": "Jane Doe",
  "iat": 1715000000,
  "exp": 1715086400
}
```

The door lock/kiosk (or staff app) calls `/api/qr/validate?token=...`, the server verifies the JWT, checks that the token hasn’t been used (if single-use) and the reservation is still valid, then returns a success response. In a real hotel, this response would trigger the lock controller to open.

---

## 10. Final thoughts: where the real complexity lives

When you watch a demo of a sleek contactless check-in, you’re seeing 5% of the work. The remaining 95% is:

- Negotiating PMS vendor API access (and paying for it).
- Handling 40-year-old SQL Server databases that don’t speak HTTP.
- Building an idempotent, retryable orchestration layer that can’t lose a room assignment.
- Mapping your modern identity ‘verified’ status to a PMS that only knows “ID Document: driver_license”.
- Ensuring the QR key actually opens the correct door, which involves a parallel chain of communication with the lock vendor.

The codebase shared here is designed to prototype that full journey quickly, but with an architecture (adapter pattern, local-first database, HTNG message shapes) that scales into production when you’re ready to plug in the real PMS. The **polish of the UI** is the easy part; **HTNG-compliant integration** is where the engineering muscle is really needed.
