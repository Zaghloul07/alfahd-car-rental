# ElfahdCars

Rent or buy a car in Egypt — Next.js + Supabase.

- `/rent` — browse rental listings (short/long term)
- `/buy` — browse used cars for sale
- `/signup`, `/login` — customer accounts (phone + password)
- `/account` — customer dashboard: verification documents, reservation history
- `/admin` — protected dashboard for managing car listings and reservation requests

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and grab these from **Project Settings → API Keys**:

- Project URL
- Publishable key (`sb_publishable_...`)
- `service_role` secret key — needed for the admin-only "create team accounts" feature (`/admin/users`). Keep this secret; it must never reach the browser.

### 2. Configure environment variables

Copy the template and fill in the three values above:

```bash
cp .env.local.example .env.local
```

For production, add the same three variables to your Vercel project's environment variables (Vercel dashboard → Project → Settings → Environment Variables).

### 3. Set up the database

In the Supabase dashboard, open **SQL Editor** and run, in order:

1. `supabase/schema.sql` — creates `profiles`, `cars`, RLS policies, and the `car-images` storage bucket
2. `supabase/schema_customers.sql` — creates `customers`, `reservations`, RLS policies, and the private `customer-documents` storage bucket
3. `supabase/schema_handover.sql` — adds delivery/return handover inspections (`handover_reports`, `handover_photos`, the `handover-photos` storage bucket) and the `delivered`/`completed` reservation statuses
4. `supabase/schema_reservation_flow.sql` — reorders the flow so reservations no longer require documents up front (documents + payment happen after admin approval), adds the `confirmed` status and payment columns, and adds the public `get_car_availability()` lookup used to grey out booked dates
5. `supabase/schema_roles.sql` — adds a `staff` role (delivery/return only, scoped to the handover queue) alongside the existing `is_admin` flag
6. `supabase/schema_notifications.sql` — creates the `notifications` table used by the admin bell for reservation lifecycle events
7. `supabase/schema_charges.sql` — creates `reservation_charges` for post-return fines/damage fees
8. `supabase/schema_inspector_role.sql` — renames the `staff` role to `inspector` (column value, RLS policies) — run this even on a fresh install, after `schema_charges.sql`
9. `supabase/seed.sql` — adds 3 sample rent listings and 3 sample sale listings (optional, for local dev)

Also in **Authentication → Sign In / Providers**, turn **off** "Confirm email" — customer signup has no email/SMS step yet, so a stuck "unconfirmed" account would be unable to ever sign in.

### 4. Create your admin account

1. In Supabase, go to **Authentication → Users → Add user** and create yourself an account (email + password).
2. Back in the SQL Editor, promote it to admin:
   ```sql
   update public.profiles set is_admin = true where email = 'you@example.com';
   ```
3. Sign in at `/admin/login`.
4. From then on, create additional Admin or Inspector accounts from `/admin/users` instead of via SQL.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Placeholder car photos in `public/cars/*.svg` are original illustrations, not scraped images — swap them out via the admin upload form once you have real photos.
- Car images uploaded through `/admin` go to the public `car-images` bucket; customer ID/license uploads go to the private `customer-documents` bucket (owner + admin read only, via signed URLs).
- Customers sign up with **name + phone + password** — no SMS/OTP verification yet (deferred by request). Under the hood this uses Supabase email/password auth with a synthetic, non-deliverable email derived from the phone number — see `src/lib/phone.ts`.
- Renting flow: a customer picks dates on a car page (checked live against `get_car_availability()`, so already-booked ranges are shown and blocked) and submits a reservation request — no documents required yet. It sits as `pending` until an admin approves/rejects it at `/admin/reservations`. Once approved, the customer uploads their national ID (front/back) and driving license and the admin records the payment; only then can the admin **confirm** the reservation, which re-checks the dates are still free and moves it into the staff handover queue at `/admin/handovers` for delivery. After the car is returned, admins can log fines/damage as `reservation_charges`. Contract generation on approval is intentionally not built yet — planned as a later phase.
- A lightweight `inspector` role (`profiles.role = 'inspector'`, separate from `is_admin`) can sign in at `/admin/login` but only sees the handover queue, customer contact info, and cars — not listings management, reservation approval, reports, or the users page. Full admins create Admin or Inspector accounts from `/admin/users` (uses the Supabase service-role key server-side — the new account's session is separate from the admin's own).
- Admins get in-app notifications (bell icon in the dashboard header) for reservation lifecycle events — new requests, approvals, documents submitted, payment recorded, confirmations, handovers, fines — and clicking one jumps straight to that reservation. Inspectors only see the handover-relevant slice.
- `/admin/reports` has charts (via `recharts`) for reservations-by-status and revenue-by-month, plus per-car and per-customer breakdowns — click a car or customer row to see its full reservation/charge history.
- `/rent` requires picking a date range before showing cars; once picked, every car for that period is shown, with already-reserved ones greyed out and non-clickable.
- "Buy" listings still use a WhatsApp "Send Price Offer" link rather than the reservation flow — that flow is rent-only for now.
