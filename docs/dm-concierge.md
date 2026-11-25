# Instagram DM concierge: draft mode

The concierge reads each Instagram DM, writes a reply in Vynl's voice, and waits
in **Admin → DM inbox** for you to approve it. Nothing is sent to a client
until you tap **Approve and send**.

## What it does now

- Saves every DM sent to @au.vynl (each one once, even when Meta resends it).
- Waits a few seconds so a burst like "hi" / "how much" / photo gets one reply.
- Drafts a reply from the Vynl brain (`src/lib/concierge/vynl-brain.ts`) and
  the live menu, deposit, hours and cancellation rules from your admin pages.
- Looks up real open times in the booking calendar when someone asks about
  availability, and sends your Book page link. It can't book or hold a time yet.
- Flags anything risky (lifting, pain, complaints, discounts, groups, collabs)
  as **Needs you**, drafts a short holding reply, and emails `ADMIN_EMAIL`.
- Blocks a send that contains the studio's street address (from your business
  profile) or what looks like a card number. The AI is never given the address.
- Goes quiet in a chat for 12 hours when you reply yourself in the Instagram
  app, or when you send your own message from the inbox. **Take over** and
  **Hand back** do the same by hand.

Not built yet (next step): quotes priced by code from an inspo photo, 15-minute
holds, a deposit link for a specific slot, and the Instagram confirmation
message with the address.

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

1. At developers.facebook.com, create an app with the use case **Manage
   messaging & content on Instagram**.
2. Under **API setup with Instagram login**, add @au.vynl and generate an
   access token. Copy the **Instagram app secret** from the same page.
3. Under **Configure webhooks**, set:
   - Callback URL: `https://YOUR-SITE/api/webhooks/instagram`
   - Verify token: any long random text (the same value goes in
     `INSTAGRAM_VERIFY_TOKEN` below)
   - Subscribe to the **messages** field.

An app used only for your own account should work on Standard Access without
App Review. If Meta asks for review anyway, it's the "apps for your own
business" path.

### 3. Claude API key

Create a key at console.anthropic.com and set a monthly spend limit there.

### 4. Vercel environment variables

| Name | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | your Claude API key |
| `INSTAGRAM_APP_SECRET` | the Instagram app secret |
| `INSTAGRAM_VERIFY_TOKEN` | the verify token you chose |
| `INSTAGRAM_ACCESS_TOKEN` | the access token you generated |
| `ADMIN_EMAIL` | already set; hand-off alerts go here |

Optional:

| Name | Default | What it changes |
| --- | --- | --- |
| `CONCIERGE_MODEL` | `claude-haiku-5-5` | model for text DMs |
| `CONCIERGE_PHOTO_MODEL` | `claude-sonnet-5-5` | model when a DM has a photo |
| `CONCIERGE_PAUSE_HOURS` | `12` | how long it stays quiet after you reply |
| `CONCIERGE_DEBOUNCE_MS` | `6000` | wait before drafting |
| `CONCIERGE_OWNER_NAME` | `Cece` | name used in the opening line |
| `CONCIERGE_BOOKING_URL` | your site's `/book` | link sent to book |

Redeploy after adding them, then press **Verify and save** on the webhook in
the Meta dashboard.

The Instagram access token lasts 60 days. Generate a new one in the Meta
dashboard and update `INSTAGRAM_ACCESS_TOKEN` before it expires.

## Trying it locally

Without `INSTAGRAM_ACCESS_TOKEN`, local sends are saved in the inbox but not
delivered (the inbox says it's in test mode).

```bash
INSTAGRAM_APP_SECRET=local-test-secret npm run dev
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
