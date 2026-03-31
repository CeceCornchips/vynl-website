import type { NextConfig } from "next";

// CSP is only enforced in production — in development Clerk/Stripe scripts
// load from dynamic subdomains that are impossible to enumerate at build time.
const isProd = process.env.NODE_ENV === "production";

const cspHeader = isProd
  ? `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline'
    https://js.stripe.com
    https://*.clerk.com
    https://*.clerk.accounts.dev
    https://touched-finch-50.clerk.accounts.dev
    https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://*.public.blob.vercel-storage.com;
  connect-src 'self'
    https://api.stripe.com https://*.stripe.com
    https://*.clerk.com https://*.clerk.accounts.dev
    https://touched-finch-50.clerk.accounts.dev
    https://o160250.ingest.sentry.io;
  frame-src 'self'
    https://js.stripe.com https://hooks.stripe.com
    https://*.clerk.com https://*.clerk.accounts.dev
    https://touched-finch-50.clerk.accounts.dev
    https://challenges.cloudflare.com;
  worker-src blob:;
`
  : `default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;`;

const csp = cspHeader.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "behold.pictures",
      },
      {
        protocol: "https",
        hostname: "cdn2.behold.pictures",
      },
      {
        // Vercel Blob storage for inspo image uploads
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply to every route.
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
