/**
 * Where the studio's email lives. Every inbound notification (waitlist
 * signups, inspo photos, booking alerts) is delivered to SUPPORT_EMAIL, and
 * every customer-facing email sets it as the reply-to, so replies land in the
 * same inbox.
 */
export const SUPPORT_EMAIL = "hello@vynlacademy.com";

/**
 * Sender for everything sent through Resend.
 *
 * Resend only sends from a domain verified in the account, so this must stay
 * on the shared test address until vynlacademy.com is verified there. Once it
 * is, set EMAIL_FROM in Vercel to `Vynl <hello@vynlacademy.com>`. The test
 * address can only deliver to the Resend account owner's own inbox, so
 * customer emails will not arrive until that's done.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Vynl <onboarding@resend.dev>";
