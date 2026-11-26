# DM concierge: going live with Meta

Until these steps are done, Meta only delivers DMs from people who have a role
on the "Vynl DM Concierge" app (admins, developers, testers). Real clients'
DMs need all three.

## 1. Publish the app (needed even for testing)

Meta only sends webhooks to a **published** app, whatever its review status.

- App Dashboard → **Publish**. The basic settings are already filled in:
  - privacy policy: https://vynl-website.vercel.app/privacy-policy
  - terms: https://vynl-website.vercel.app/terms
  - data deletion: https://vynl-website.vercel.app/data-deletion
  - category, icon and contact email
- Publishing doesn't let strangers use the app: without App Review, only role
  holders' DMs still arrive.

## 2. Business Verification (the Vynl business portfolio)

Business Suite → Settings → **Business info** → Start verification. You need:

- the legal business name and ABN, exactly as registered
- an address and phone number that match the ABN record
- a way to confirm: a business email on your own domain, a phone call or SMS,
  or a domain check

`vynl.com.au` has expired, so email or domain confirmation on it won't work
until it's renewed. Phone/SMS or a document upload (ABN registration, a utility
bill) still works.

## 3. App Review

App Dashboard → **App Review** → Permissions and features. Request:

| Permission / feature | Why we need it |
| --- | --- |
| `instagram_manage_messages` (Advanced Access) | Read and reply to DMs sent to @au.vynl |
| `instagram_basic` | Confirm the connected account and show clients' names and handles |
| `business_management` | Meta requires it alongside `instagram_manage_messages` for Facebook Login for Business |
| Human Agent (optional) | Lets a person reply between 24 hours and 7 days after the client's last message |

### Answers to paste

**App type:** Automated with a live agent: every reply is approved by a person before it's sent.

**Platform:** Website, https://vynl-website.vercel.app/dm-inbox. Leave test credentials blank: the app is
only used by our own business ("apps for your own business").

**Instagram account:** @au.vynl

**`instagram_manage_messages`:**

> Vynl Nails is a nail studio. This app is used only by our own business to manage the Instagram
> DMs sent to our account @au.vynl. When a client messages us, the message appears in a private inbox
> on our website. The app suggests a reply using our real prices, opening times and booking link from
> our Square booking system. A staff member reads the suggestion, edits it if needed and taps Send; no
> reply is ever sent without a person approving it. If the client asks for something the assistant
> can't answer, the chat is flagged for the owner. We keep messages only to show the conversation
> history, and delete them on request through our data deletion page.

**`instagram_basic`:**

> We read the connected account's id and username to make sure the studio's own account (@au.vynl)
> is the one connected, and to show each client's name and @handle next to their chat in our inbox.

**`business_management`:**

> Required by Meta for instagram_manage_messages with Facebook Login for Business. We only use it to
> read the Instagram account our business portfolio assigns to the app when the owner logs in.

**Human Agent:**

> We're a small studio and are often with clients for hours at a time, and closed some days. Some DMs
> can't be answered within 24 hours. Replies sent after 24 hours are always written or approved by a
> person in our inbox, never sent automatically.

### Screencast (2–3 minutes, recorded on a computer)

Meta wants to see the same app being used for the same purpose. Record in this order:

1. Open https://vynl-website.vercel.app/dm-inbox signed out. Tap **Continue with Instagram**, log in
   and choose the Vynl portfolio and @au.vynl. Show the "Instagram is connected" message.
2. On a phone, from a tester Instagram account, DM @au.vynl, for example: "Hi! How much are Gel-X
   extensions and do you have anything Saturday?"
3. Back in the inbox, show the new chat appearing and the assistant's suggested reply.
4. Edit a word in the draft, then tap **Send edited reply**.
5. On the phone, show the reply arriving in Instagram.
6. Back in the inbox, tap **Take over** to show a person can pause the assistant, then **Hand back to assistant**.

Use English captions or a voice-over that says what each step shows.

## After approval

- Real clients' DMs start arriving. Nothing is sent without approval (draft mode).
- In the inbox, **Check connection** confirms the Meta webhook, the account subscription, chat
  access and when the last DM arrived.
