# API Contracts — Bhima → Arjun Handoff
**Status:** Day 1 — Bhima-authored shapes. Arjun implements `src/types/api.ts` from these.

All endpoints are prefixed `/api/`. In development, Vite proxies `/api` → `http://localhost:5000`.
All responses are JSON. All error responses follow the envelope below.

---

## Error envelope (all 4xx / 5xx)

```json
{
  "error": {
    "code": "SNAKE_CASE_CODE",
    "message": "Human-readable description"
  }
}
```

---

## `GET /api/services`

Returns all services available for booking.

**Response 200**
```json
[
  {
    "id": 1,
    "name": "Haircut & Styling",
    "duration_minutes": 45,
    "price": 800,
    "image_filename": "Haircut.png"
  }
]
```

**TypeScript interface**
```ts
export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
  image_filename: string | null;
}
```

---

## `GET /api/slots?service_id=&date=`

Returns unbooked slots for a given service on a given date.

**Query params**
| Param | Type | Example |
|---|---|---|
| `service_id` | integer | `1` |
| `date` | string ISO 8601 | `2026-09-15` |

**Response 200**
```json
[
  {
    "id": 12,
    "start_time": "09:00",
    "end_time": "09:45"
  }
]
```

**TypeScript interface**
```ts
export interface TimeSlot {
  id: number;
  start_time: string;  // "HH:MM"
  end_time: string;    // "HH:MM"
}
```

---

## `POST /api/book`  *(Day 3)*

**Request body (JSON)**
```json
{
  "service_id": 1,
  "slot_id": 12,
  "client_name": "Priya Sharma",
  "client_email": "priya@example.com",
  "client_phone": "9876543210"
}
```

**Response 201**
```json
{
  "appointment_id": 7
}
```

**TypeScript interfaces**
```ts
export interface BookingRequest {
  service_id: number;
  slot_id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
}

export interface BookingResponse {
  appointment_id: number;
}
```

---

## `GET /api/confirm/:id`  *(Day 3)*

**Response 200**
```json
{
  "id": 7,
  "client_name": "Priya Sharma",
  "client_email": "priya@example.com",
  "client_phone": "9876543210",
  "service_name": "Haircut & Styling",
  "date": "2026-09-15",
  "start_time": "09:00",
  "end_time": "09:45",
  "status": "Pending"
}
```

**TypeScript interface**
```ts
export interface AppointmentConfirmation {
  id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_name: string;
  date: string;         // "YYYY-MM-DD"
  start_time: string;   // "HH:MM"
  end_time: string;     // "HH:MM"
  status: "Pending" | "Completed";
}
```

---

## Admin endpoints *(Day 5)*

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/admin/login` | — | Set session cookie |
| `GET` | `/api/admin/bookings` | Session required | All appointments, optional `?date=` filter |
| `POST` | `/api/admin/complete/:id` | Session required | Mark appointment Completed |
| `POST` | `/api/admin/logout` | Session required | Clear session |

All admin routes use session cookies. Frontend must use `credentials: 'include'` on every fetch to `/api/admin/*`.

---

## Image paths

Service images live in `public/images/salon/services/` in the project root.
Arjun should copy (or move) this `public/` directory into `frontend/public/` during Vite project setup so Vite serves them correctly.

Hero image: `public/images/salon/hero/Hero.png`
Interior/About image: `public/images/salon/about/interior.png`
