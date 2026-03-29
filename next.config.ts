import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://web.squarecdn.com https://sandbox.web.squarecdn.com;
  style-src 'self' 'unsafe-inline' https://web.squarecdn.com https://sandbox.web.squarecdn.com https://fonts.googleapis.com;
  style-src-elem 'self' 'unsafe-inline' https://web.squarecdn.com https://sandbox.web.squarecdn.com https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://web.squarecdn.com https://sandbox.web.squarecdn.com https://square-fonts-production-f.squarecdn.com https://d1g145x70srn7h.cloudfront.net https://cash-f.squarecdn.com;
  img-src 'self' blob: data: https://*.squarecdn.com https://*.squareupsandbox.com https://*.squareup.com;
  connect-src 'self' https://*.squareup.com https://*.squareupsandbox.com https://connect.squareup.com https://*.squarecdn.com https://o160250.ingest.sentry.io;
  frame-src 'self' https://*.squarecdn.com https://*.squareupsandbox.com https://*.squareup.com;
  worker-src blob:;
`;

const csp = cspHeader.replace(/\n/g, " ");

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
