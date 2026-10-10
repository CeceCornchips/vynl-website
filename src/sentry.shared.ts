/**
 * Options shared by the browser, Node and Edge Sentry SDKs.
 *
 * Sentry stays off until NEXT_PUBLIC_SENTRY_DSN is set (in Vercel →
 * Settings → Environment Variables), and never reports from local dev.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  // "production" / "preview" on Vercel, so preview-deploy noise can be filtered out.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  // Sample 10% of requests for performance tracing; errors are always captured.
  tracesSampleRate: 0.1,
  // Don't attach IPs, cookies or request bodies: customers submit names and
  // emails through the booking and waitlist forms.
  sendDefaultPii: false,
};
