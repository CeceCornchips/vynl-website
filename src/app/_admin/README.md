# Admin dashboard — disabled

The admin dashboard is switched off for now. Folders starting with `_` are
private in the Next.js App Router, so nothing in here is routed: `/admin`,
`/api/admin/*` and `/sign-in` all return 404. The code is untouched.

Disabled pieces:

| Was                         | Now                                  |
| --------------------------- | ------------------------------------ |
| `src/app/admin/`            | `src/app/_admin/`                    |
| `src/app/api/admin/`        | `src/app/api/_admin/`                |
| `src/app/sign-in/`          | `src/app/_sign-in/`                  |
| `src/middleware.ts`         | `src/app/_admin/middleware.disabled.ts` |
| `src/app/api/test-db/`      | `src/app/api/_admin/test-db/` (debug route — leave it off) |
| `<ClerkProvider>` in `src/app/layout.tsx` | removed                |

The waitlist "send launch email" endpoint now lives at
`api/_admin/waitlist/notify` (it used to be public at `/api/waitlist/notify`,
which let anyone email the whole list). It comes back as
`/api/admin/waitlist/notify`, behind the admin login.

## Turning it back on

1. Rename the folders back (`_admin` → `admin`, `api/_admin` → `api/admin`,
   `_sign-in` → `sign-in`). Leave `test-db` out.
2. Move `src/app/_admin/middleware.disabled.ts` back to `src/middleware.ts`.
   Its matcher must keep excluding `/monitoring` traffic from the sign-in
   redirect (it only guards `/admin` and `/api/admin`, so it does).
3. Wrap `<html>` in `src/app/layout.tsx` with `<ClerkProvider>` from
   `@clerk/nextjs` again.
4. Check the Clerk env vars (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `CLERK_SECRET_KEY`) are still set in Vercel, and update `ADMIN_EMAIL` in the
   middleware and `_admin/layout.tsx` if she now signs in with
   hello@vynlacademy.com.
