# ElfahdCars

Rent or buy a car in Egypt — Next.js + Supabase.

- `/rent` — browse rental listings (short/long term)
- `/buy` — browse used cars for sale
- `/signup`, `/login` — customer accounts (phone + password)
- `/account` — customer dashboard: verification documents, reservation history
- `/admin-portal` — protected dashboard for managing car listings and reservation requests

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and grab these from **Project Settings → API Keys**:

- Project URL
- Publishable key (`sb_publishable_...`)
- `service_role` secret key — needed for the admin-only "create team accounts" feature (`/admin-portal/users`). Keep this secret; it must never reach the browser.

Also grab a **free** Gemini API key from [aistudio.google.com](https://aistudio.google.com) (Get API Key) — powers the optional AI damage-detection feature on car returns. No credit card required; the free tier's daily quota comfortably covers normal usage for a small fleet. If you skip this, everything else works fine — damage detection is silently skipped when the key is missing.

### 2. Configure environment variables

Copy the template and fill in the values above:

```bash
cp .env.local.example .env.local
```

For production, add the same variables to your Vercel project's environment variables (Vercel dashboard → Project → Settings → Environment Variables).

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
9. `supabase/schema_handover_return_date.sql` — adds `return_date` to `handover_reports`, letting an inspector record the actual day a car came back (used to compute agreed-vs-actual rental cost)
10. `supabase/schema_handover_body_angles.sql` — splits the generic "body" handover photo into four labeled angles (front/back/left/right) and adds `handover_damage_findings` for AI-flagged damage
11. `supabase/schema_customer_notifications.sql` — lets `notifications` target a specific customer (not just an admin/inspector role broadcast) and updates `create_notification()` to accept it
12. `supabase/schema_reservation_transactions.sql` — adds a `type` (`charge` | `refund`) to `reservation_charges` so early-return refunds can be logged alongside damage/late fees, and adds the `refund_issued` notification type
13. `supabase/seed.sql` — adds 3 sample rent listings and 3 sample sale listings (optional, for local dev)

Also in **Authentication → Sign In / Providers**, turn **off** "Confirm email" — customer signup has no email/SMS step yet, so a stuck "unconfirmed" account would be unable to ever sign in.

### 4. Create your admin account

1. In Supabase, go to **Authentication → Users → Add user** and create yourself an account (email + password).
2. Back in the SQL Editor, promote it to admin:
   ```sql
   update public.profiles set is_admin = true where email = 'you@example.com';
   ```
3. Sign in at `/admin-portal/login`.
4. From then on, create additional Admin or Inspector accounts from `/admin-portal/users` instead of via SQL.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Placeholder car photos in `public/cars/*.svg` are original illustrations, not scraped images — swap them out via the admin upload form once you have real photos.
- Car images uploaded through `/admin-portal` go to the public `car-images` bucket; customer ID/license uploads go to the private `customer-documents` bucket (owner + admin read only, via signed URLs).
- Customers sign up with **name + phone + password** — no SMS/OTP verification yet (deferred by request). Under the hood this uses Supabase email/password auth with a synthetic, non-deliverable email derived from the phone number — see `src/lib/phone.ts`.
- Renting flow: a customer picks dates on a car page (checked live against `get_car_availability()`, so already-booked ranges are shown and blocked) and submits a reservation request — no documents required yet. It sits as `pending` until an admin approves/rejects it at `/admin-portal/reservations`. Once approved, the customer uploads their national ID (front/back) and driving license and the admin records the payment; only then can the admin **confirm** the reservation, which re-checks the dates are still free and moves it into the staff handover queue at `/admin-portal/handovers` for delivery. A reservation can be **cancelled** by an admin any time it's `pending`, `approved`, or `confirmed` (not after delivery). Contract generation on approval is intentionally not built yet — planned as a later phase.
- Returns can happen early — submitting the return inspection immediately frees the car for any future dates regardless of the agreed end date, since a `completed` reservation no longer blocks availability. The return form also asks for the actual **return date** (defaults to today, can be backdated), which is used to show the admin the agreed rental cost (per the original dates) next to the actual cost (per the real return date) so they can see at a glance whether a refund or an extra charge is owed. Logging that as an actual transaction is still a manual step — the "Add a charge or refund" form on a completed reservation records either a `charge` (damage, late return) or a `refund` (early return, goodwill) as a `reservation_charges` row; refunds are netted out of the revenue figures in `/admin-portal/reports` (by the month the refund itself was issued, not the original booking month).
- Delivery and return inspections capture one photo per side of the car (front/back/left/right) instead of an unlabeled batch, so the two sets can be matched up angle-by-angle. When a return is submitted, each angle pair is sent to Gemini (if `GEMINI_API_KEY` is set) asking it to describe any *new* damage visible in the return photo that wasn't in the delivery photo. Findings are stored in `handover_damage_findings` and shown as a flagged "AI damage check" note — visible to both staff (`/admin-portal/reservations`) and the customer themselves (`/account/reservations`) — for review before charging anything; it never auto-charges.
- A lightweight `inspector` role (`profiles.role = 'inspector'`, separate from `is_admin`) can sign in at `/admin-portal/login` but only sees the handover queue, customer contact info, and cars — not listings management, reservation approval, reports, or the users page. Full admins create Admin or Inspector accounts from `/admin-portal/users` (uses the Supabase service-role key server-side — the new account's session is separate from the admin's own).
- Notifications are split by who needs to know what: the **admin** bell only shows customer-initiated events (new reservation requests, documents submitted) — not the admin's own actions, since they already know what they just did. The **inspector** bell shows confirmed reservations ready for delivery. The **customer** (a bell in the site header, next to "My Account") gets notified for everything staff does on their reservation — approved/rejected, payment recorded, confirmed, delivered, returned, a charge added, cancelled. Clicking any notification jumps to the relevant page/reservation.
- `/admin-portal/reports` has charts (via `recharts`) for reservations-by-status and revenue-by-month, plus per-car and per-customer breakdowns — click a car or customer row to see its full reservation/charge history.
- `/rent` requires picking a date range before showing cars; once picked, every car for that period is shown, with already-reserved ones greyed out and non-clickable.
- "Buy" listings still use a WhatsApp "Send Price Offer" link rather than the reservation flow — that flow is rent-only for now.
- The admin area lives at `/admin-portal` (not `/admin`) and isn't linked from anywhere on the public site — there's no footer link or nav pointing to it. This is a minor deterrent against automated scanners, not real security; access is still enforced entirely by login (`requireAdmin`/`requireInspectorOrAdmin` + middleware), so bookmark the login URL directly.
