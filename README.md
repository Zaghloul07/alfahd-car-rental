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

### 2. Configure environment variables

Copy the template and fill in the two values above:

```bash
cp .env.local.example .env.local
```

### 3. Set up the database

In the Supabase dashboard, open **SQL Editor** and run, in order:

1. `supabase/schema.sql` — creates `profiles`, `cars`, RLS policies, and the `car-images` storage bucket
2. `supabase/schema_customers.sql` — creates `customers`, `reservations`, RLS policies, and the private `customer-documents` storage bucket
3. `supabase/seed.sql` — adds 3 sample rent listings and 3 sample sale listings (optional, for local dev)

Also in **Authentication → Sign In / Providers**, turn **off** "Confirm email" — customer signup has no email/SMS step yet, so a stuck "unconfirmed" account would be unable to ever sign in.

### 4. Create your admin account

1. In Supabase, go to **Authentication → Users → Add user** and create yourself an account (email + password).
2. Back in the SQL Editor, promote it to admin:
   ```sql
   update public.profiles set is_admin = true where email = 'you@example.com';
   ```
3. Sign in at `/admin/login`.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Placeholder car photos in `public/cars/*.svg` are original illustrations, not scraped images — swap them out via the admin upload form once you have real photos.
- Car images uploaded through `/admin` go to the public `car-images` bucket; customer ID/license uploads go to the private `customer-documents` bucket (owner + admin read only, via signed URLs).
- Customers sign up with **name + phone + password** — no SMS/OTP verification yet (deferred by request). Under the hood this uses Supabase email/password auth with a synthetic, non-deliverable email derived from the phone number — see `src/lib/phone.ts`.
- Renting requires signup, then uploading a national ID (front/back) and driving license, then submitting a reservation request — which sits as `pending` until an admin approves/rejects it at `/admin/reservations`. Contract generation on approval is intentionally not built yet — planned as a later phase.
- "Buy" listings still use a WhatsApp "Send Price Offer" link rather than the reservation flow — that flow is rent-only for now.
