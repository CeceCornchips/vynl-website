#!/usr/bin/env node
/**
 * Sends a fake, correctly signed Instagram DM to your site, so you can try the
 * DM inbox before the Meta app exists.
 *
 * 1. Start the site with a test secret:
 *      INSTAGRAM_APP_SECRET=local-test-secret npm run dev
 * 2. In another terminal, send a DM:
 *      INSTAGRAM_APP_SECRET=local-test-secret node scripts/simulate-dm.mjs "any openings Saturday?"
 *
 * Options:
 *   --from <id>     which pretend client is messaging (default: sim_client_1)
 *   --image <url>   attach a photo (any https image works locally)
 *   --echo          pretend YOU replied from the Instagram app (pauses the assistant)
 *   --url <base>    the site to send to (default: http://localhost:3000)
 *
 * Then open http://localhost:3000/admin/dm-inbox. The draft appears a few
 * seconds later.
 */
import { createHmac, randomBytes } from 'node:crypto';

const args = process.argv.slice(2);
const opts = { from: 'sim_client_1', image: null, echo: false, url: 'http://localhost:3000' };
const words = [];
for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  if (a === '--from') opts.from = args[++i];
  else if (a === '--image') opts.image = args[++i];
  else if (a === '--url') opts.url = args[++i];
  else if (a === '--echo') opts.echo = true;
  else words.push(a);
}
const text = words.join(' ').trim();

const secret = process.env.INSTAGRAM_APP_SECRET;
if (!secret) {
  console.error('Set INSTAGRAM_APP_SECRET to the same test value the site was started with.');
  process.exit(1);
}
if (!text && !opts.image) {
  console.error('Give a message, a photo (--image), or both.');
  process.exit(1);
}

const account = 'sim_vynl_account';
const now = Date.now();
const payload = {
  object: 'instagram',
  entry: [
    {
      id: account,
      time: now,
      messaging: [
        {
          sender: { id: opts.echo ? account : opts.from },
          recipient: { id: opts.echo ? opts.from : account },
          timestamp: now,
          message: {
            mid: `sim_${randomBytes(8).toString('hex')}`,
            ...(text ? { text } : {}),
            ...(opts.image ? { attachments: [{ type: 'image', payload: { url: opts.image } }] } : {}),
            ...(opts.echo ? { is_echo: true } : {}),
          },
        },
      ],
    },
  ],
};

const body = JSON.stringify(payload);
const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
const res = await fetch(`${opts.url.replace(/\/$/, '')}/api/webhooks/instagram`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature },
  body,
});
console.log(`${res.status} ${await res.text()}`);
