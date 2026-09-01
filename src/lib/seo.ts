/**
 * Single source of truth for site-wide SEO constants and JSON-LD builders.
 *
 * Vynl is a private, by-appointment home studio: there is no public street
 * address and no published phone line. The business is therefore modelled as a
 * service-area business — `address` carries locality, region and postcode only
 * (never `streetAddress`), and `areaServed` lists the suburbs we take bookings
 * from. Adding a street address here would misrepresent the studio to Google
 * and publish a private residence, so leave it out.
 */

export const SITE_URL = "https://www.vynl.com.au";

/** A single JSON-LD node, ready to be serialised into a script tag. */
export type JsonLdObject = Record<string, unknown>;

/** Stable @id for the studio node, referenced from every other schema. */
const STUDIO_ID = `${SITE_URL}/#studio`;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const BUSINESS = {
  name: "Vynl",
  legalName: "Vynl Nail Studio",
  academyName: "Vynl Academy",
  description:
    "Vynl is a Gel-X nail studio in Cranebrook, NSW, serving Penrith and Western Sydney. " +
    "We specialise exclusively in Gel-X extensions and advanced nail art — no acrylics — " +
    "by appointment only.",

  /** Suburb the studio operates from. No street address is published. */
  suburb: "Cranebrook",
  region: "NSW",
  postalCode: "2749",
  country: "AU",
  /** Nearest well-known centre, used in copy and page titles. */
  nearestCentre: "Penrith",

  email: "vynlau@gmail.com",
  /**
   * Intentionally undefined — the studio has no public phone line and takes
   * bookings online only. A placeholder number would break the LocalBusiness
   * listing, so `nailSalonSchema` omits `telephone` while this is unset.
   */
  telephone: undefined as string | undefined,

  bookingUrl: "https://vynl.square.site/s/appointments",

  areaServed: [
    "Cranebrook",
    "Penrith",
    "Jordan Springs",
    "Glenmore Park",
    "Emu Plains",
    "St Marys",
    "Werrington",
    "Kingswood",
    "Llandilo",
    "Western Sydney",
  ] as string[],

  instagram: "https://instagram.com/au.vynl",
  academyInstagram: "https://instagram.com/vynlacademy",
  tiktok: "https://tiktok.com/@vynlacademy",
};

/** Profiles that represent the same entity, for `sameAs`. */
const SAME_AS = [BUSINESS.instagram, BUSINESS.academyInstagram, BUSINESS.tiktok];

const postalAddress = {
  "@type": "PostalAddress",
  addressLocality: BUSINESS.suburb,
  addressRegion: BUSINESS.region,
  postalCode: BUSINESS.postalCode,
  addressCountry: BUSINESS.country,
};

const areaServedPlaces = BUSINESS.areaServed.map((name) => ({ "@type": "Place", name }));

// ── Pricing helpers ───────────────────────────────────────────────────────
// Catalogue prices are display strings ("A$60.00", "Starting from $100",
// "Price varies"), so pull the first numeric run rather than trusting format.

export function parsePriceValue(price?: string): number | undefined {
  const match = price?.match(/\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * "Starting from $100" is a floor, not a fixed price — emit it as a minPrice
 * specification so we never advertise a flat rate the studio doesn't charge.
 */
function offerPriceFields(price?: string): JsonLdObject {
  const value = parsePriceValue(price);
  if (value === undefined) return {};
  return /\b(from|starting)\b/i.test(price ?? "")
    ? {
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: value,
          priceCurrency: "AUD",
        },
      }
    : { price: value, priceCurrency: "AUD" };
}

// ── Builders ──────────────────────────────────────────────────────────────

export function nailSalonSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "NailSalon",
    "@id": STUDIO_ID,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description: BUSINESS.description,
    url: SITE_URL,
    image: absoluteUrl("/hero-poster.jpg"),
    email: BUSINESS.email,
    ...(BUSINESS.telephone ? { telephone: BUSINESS.telephone } : {}),
    address: postalAddress,
    areaServed: areaServedPlaces,
    sameAs: SAME_AS,
    currenciesAccepted: "AUD",
    // Private home studio: no walk-ins, no public premises.
    publicAccess: false,
    potentialAction: {
      "@type": "ReserveAction",
      name: "Book a Gel-X appointment",
      target: {
        "@type": "EntryPoint",
        urlTemplate: BUSINESS.bookingUrl,
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      result: { "@type": "Reservation", name: "Gel-X nail appointment" },
    },
  };
}

export function websiteSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: BUSINESS.name,
    description: BUSINESS.description,
    url: SITE_URL,
    inLanguage: "en-AU",
    publisher: { "@id": STUDIO_ID },
  };
}

export interface ServiceOfferInput {
  /** Catalogue entries use `title`, not `name` — map before calling. */
  name: string;
  description?: string;
  /** Display price string, e.g. "A$60.00" or "Starting from $100". */
  price?: string;
}

export function serviceSchema(input: {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
  offers?: ServiceOfferInput[];
}): JsonLdObject {
  const { name, description, path, serviceType, offers = [] } = input;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(path)}#service`,
    name,
    description,
    serviceType: serviceType ?? name,
    url: absoluteUrl(path),
    provider: { "@id": STUDIO_ID },
    areaServed: areaServedPlaces,
    ...(offers.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: `${name} — service menu`,
            itemListElement: offers.map((offer) => ({
              "@type": "Offer",
              url: BUSINESS.bookingUrl,
              availability: "https://schema.org/InStock",
              itemOffered: {
                "@type": "Service",
                name: offer.name,
                ...(offer.description ? { description: offer.description } : {}),
              },
              ...offerPriceFields(offer.price),
            })),
          },
        }
      : {}),
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

export function courseSchema(input: {
  name: string;
  description: string;
  path: string;
  /** Module titles — what the course actually covers. */
  teaches?: string[];
}): JsonLdObject {
  const { name, description, path, teaches = [] } = input;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${absoluteUrl(path)}#course`,
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: "en-AU",
    ...(teaches.length ? { teaches } : {}),
    provider: {
      "@type": "Organization",
      name: BUSINESS.academyName,
      url: absoluteUrl(path),
      sameAs: [BUSINESS.academyInstagram, BUSINESS.tiktok],
    },
    // Enrollment hasn't opened, so no dates, price or workload are asserted.
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "Online",
        inLanguage: "en-AU",
      },
    ],
  };
}
