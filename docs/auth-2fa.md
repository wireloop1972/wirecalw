# Auth & SMS 2FA Status

## Current State (2026-04-05)

- **Email + password auth**: enabled and working.
- **Invite-only registration**: enabled. Only users with a valid invite
  token can create an account.
- **SMS 2FA (Twilio)**: **disabled**. The Phone provider is OFF in Supabase
  and no Twilio credentials are configured.

The `/auth/2fa` page and all OTP verification code exist in the codebase but
are **dormant** — controlled by the `ENABLE_SMS_2FA` flag in:

- `app/auth/login/LoginForm.tsx`
- `app/auth/invite/[token]/InviteRegistrationForm.tsx`

Both are set to `false`. No SMS OTP requests are made during login or
registration.

---

## Auth Flow (current)

```
User → /auth/login → email + password → /app
User → /auth/invite/[token] → register → /app
```

No 2FA step is required. The middleware and `/app` layout only check for a
valid Supabase session (email+password).

---

## Enabling SMS 2FA

When Twilio is ready, follow these steps:

1. **Supabase dashboard**: enable the Phone provider under
   Authentication → Providers. Enter Twilio Account SID, Auth Token, and
   the messaging service SID (or a Twilio phone number).

2. **App code**: set `ENABLE_SMS_2FA = true` in both files listed above.

3. **Optional**: require `phone_number` for all existing users. Currently
   the `phone_number` column in `public.users` is nullable. If you want to
   enforce 2FA for everyone, add a migration:

   ```sql
   alter table public.users
     alter column phone_number set not null;
   ```

   and add a UI step prompting users to add their phone before they can
   access `/app`.

4. **Test**: log in with a user that has a phone number stored. After
   entering email + password, the app should redirect to `/auth/2fa` and
   send an SMS OTP via Supabase/Twilio.

---

## Files Involved

| File | Role |
|------|------|
| `app/auth/login/LoginForm.tsx` | Login form; `ENABLE_SMS_2FA` flag gates the OTP branch |
| `app/auth/invite/[token]/InviteRegistrationForm.tsx` | Invite registration; same flag |
| `app/auth/2fa/page.tsx` | 6-digit OTP verification page (dormant) |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client (cookie sessions) |
| `middleware.ts` | Auth guard (checks session, not 2FA completion) |

---

## Admin Seed

Neal (`neal.stabell@gmail.com`) is promoted to `role = 'admin'` via
`supabase/migrations/002_promote_neal_admin.sql`. This migration should be
run in the Supabase SQL editor after Neal has signed up through the invite
flow (so the `public.users` row exists).
