# Instagram DM concierge: draft mode

The concierge reads each Instagram DM, writes a reply in Vynl's voice, and waits
in the **DM inbox** (`/dm-inbox` on the website, password protected) for you to
approve it. Nothing is sent to a client until you tap **Approve and send**.

The rest of the admin area is switched off (see `src/app/_admin/README.md`), so
the inbox has its own sign-in and doesn't use Clerk.

## What it does now

- Saves every DM sent to @au.vynl (each one once, even when Meta resends it).
- Waits a few seconds so a burst like "hi" / "how much" / photo gets one reply.
- Drafts a reply from the Vynl brain (`src/lib/concierge/vynl-brain.ts`) plus
  live data from **Square**: the bookable services and add-ons with prices and
  times, and your booking policy (booking fee, 48-hour rule, guests, arrival).
- Looks up real open times in your Square calendar when someone asks about
  availability (including add-ons like a soak-off), and sends your Square
  booking link. It can't book or hold a time itself.
- Flags anything risky (lifting, pain, complaints, discounts, groups, collabs)
  as **Needs you**, drafts a short holding reply, and emails the studio inbox
  (`SUPPORT_EMAIL` in `src/lib/email-config.ts`).
- Blocks a send that contains the studio's street address (read from your
  Square location) or what looks like a card number. The AI is never given the
  address.
- Goes quiet in a chat for 12 hours when you reply yourself in the Instagram
  app, or when you send your own message from the inbox. **Take over** and
  **Hand back** do the same by hand.
- Every couple of minutes while the inbox is open, checks the 10 most recent
  Instagram chats for messages the webhook missed (Meta's Conversations API)
  and saves them. Chats with a new client message from the last 24 hours get a
  draft. This also brings in chats Meta won't send to the webhook yet.
- Emails the studio inbox when replies are ready to approve: at most one
  email every 10 minutes, listing everything waiting. Chats that need you
  personally get their own email instead.
- **Copy** puts a reply on the clipboard so you can send it from the Instagram
  app, for example while Meta only lets the app message testers.
- **Check connection** (once Instagram is connected) shows whether the Meta
  app's webhook points at the site, the account is subscribed, chats can be
  read, when the last DM arrived and when the last chat sync ran.

Not built yet: quotes priced by code from an inspo photo, and replies that send
on their own (everything waits for your approval for now).

It needs only its own `dm_*` tables in the database; it doesn't use the old
booking tables.

## Setup

### 1. Instagram

1. Make sure @au.vynl is a professional account (Business or Creator).
2. In the Instagram app: **Settings and activity → Account type and tools →
   Messaging tools → Message controls**, and under **Connected tools** turn on
   **Allow access to messages**. (Older instructions say Messages and story
   replies, but it's no longer there.)
3. If you're trying Meta Business Agent or ManyChat, switch them off first:
   only one automated tool should answer the inbox.

### 2. Meta developer app

New Meta apps use **Instagram API with Unified Login** (the older "Instagram
login" setup isn't offered to new apps).

1. At developers.facebook.com, create an app with the use case **Manage
   messaging & content on Instagram** (done: "Vynl DM Concierge", app ID
   1490303119908217). Meta asks for a business portfolio (done: "Vynl").
2. Under **API setup with Unified login**: create a configuration (done:
   ID 1854833062506686, system-user token that never expires) and register the
   redirect URL `https://YOUR-SITE/api/dm/instagram/callback`.
3. Under **Configure webhooks**: callback URL
   `https://YOUR-SITE/api/webhooks/instagram`, verify token `vynl-dm-concierge`
   (or your `INSTAGRAM_VERIFY_TOKEN`), and subscribe to **messages**.
4. Open the DM inbox and tap **Continue with Instagram** (or **Connect
   Instagram** once signed in), log in, and share the studio's Instagram
   account. The site stores the token (encrypted), subscribes the account to
   DM webhooks and signs you in. No token copying needed. Only the studio
   account (`INSTAGRAM_USERNAME`, default `au.vynl`) is accepted.

Meta notes that message webhooks can be unreliable for Instagram accounts that
aren't linked to a Facebook Page; if DMs don't arrive, link @au.vynl to a Vynl
Facebook Page.

### 3. Claude API key

Create a key at console.anthropic.com and set a monthly spend limit there.

### 4. Vercel environment variables

| Name | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | your Claude API key |
| `META_APP_ID` | the Meta app ID (not secret) |
| `INSTAGRAM_LOGIN_CONFIG_ID` | the Unified login configuration ID (not secret) |
| `INSTAGRAM_APP_SECRET` | the Meta **App secret** (App settings → Basic) |
| `CONCIERGE_SITE_URL` | the site's public address, e.g. `https://vynl-website.vercel.app` |
| `DM_INBOX_EMAIL` | optional: where inbox sign-in links go (default `SUPPORT_EMAIL`) |
| `DM_INBOX_PASSWORD` | optional: a password sign-in as well (falls back to `ADMIN_PASSWORD`) |
| `INSTAGRAM_USERNAME` | optional: the studio account to connect (default `au.vynl`) |
| `INSTAGRAM_VERIFY_TOKEN` | optional: webhook handshake value (default `vynl-dm-concierge`) |
| `INSTAGRAM_ACCESS_TOKEN` | optional: only if not using Connect Instagram |
| Square settings | already used by the site: `SQUARE_ACCESS_TOKEN`, `NEXT_PUBLIC_SQUARE_ENV`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`, `SQUARE_TEAM_MEMBER_ID` |

Optional:

| Name | Default | What it changes |
| --- | --- | --- |
| `CONCIERGE_MODEL` | `claude-haiku-5-5` | model for text DMs |
| `CONCIERGE_PHOTO_MODEL` | `claude-sonnet-5-5` | model when a DM has a photo |
| `CONCIERGE_PAUSE_HOURS` | `12` | how long it stays quiet after you reply |
| `CONCIERGE_DEBOUNCE_MS` | `6000` | wait before drafting |
| `CONCIERGE_OWNER_NAME` | `Cece` | name used in the opening line |
| `CONCIERGE_BOOKING_URL` | your Square booking site | link sent to book |
| `CONCIERGE_DRAFT_EMAILS` | on | `off` stops the "replies ready to approve" emails |

Redeploy after adding them, then press **Verify and save** on the webhook in
the Meta dashboard.

Signing in: **Continue with Instagram** (the Meta login above, which only
accepts the studio account), or a one-tap link emailed to the studio inbox
(valid 15 minutes). A signed-in browser stays signed in for 14 days.

## Trying it locally

Without `INSTAGRAM_ACCESS_TOKEN`, local sends are saved in the inbox but not
delivered (the inbox says it's in test mode).

```bash
INSTAGRAM_APP_SECRET=local-test-secret DM_INBOX_PASSWORD=pick-a-test-password npm run dev
```

In a second terminal:

```bash
INSTAGRAM_APP_SECRET=local-test-secret node scripts/simulate-dm.mjs "any openings Saturday?"
```

Add `--image https://…` to send a photo, `--from someone_else` for another
chat, or `--echo` to act as you replying from the Instagram app. Drafting also
needs `ANTHROPIC_API_KEY` and a working `DATABASE_URL` in `.env.local`.

## Cost

Each draft is logged in the `dm_agent_runs` table with tokens and an estimated
cost. At about 20 chats a day, Haiku for text plus Sonnet for photos should
come to roughly US$20–30 a month.

## Going live

Real clients' DMs need the app published, Business Verification and App Review. Steps and ready-to-paste answers: [dm-concierge-app-review.md](dm-concierge-app-review.md).
