import type {
  NavItem,
  CTALink,
  FeatureCardData,
  ServiceCardData,
  ProductCardData,
  TestimonialCardData,
  FAQItem,
  FooterData,
  HeroSectionData,
  WaitlistFormConfig,
} from "@/types";

// ── Navigation ──────────────────────────────────────────────────────────

export const navItems: NavItem[] = [
  { label: "Nails", href: "/nails" },
  { label: "Gallery", href: "/nails#gallery" },
  {
    label: "Academy",
    href: "/academy",
    children: [
      { label: "About the Academy", href: "/academy" },
      { label: "What You'll Learn", href: "/academy#curriculum" },
      { label: "Join the Waitlist", href: "/academy#waitlist" },
    ],
  },
  {
    label: "Supply",
    href: "/supply",
    children: [
      { label: "Coming Soon", href: "/supply" },
      { label: "Get Early Access", href: "/supply#waitlist" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export const navCTA: CTALink = {
  label: "Book Now",
  href: "/contact",
  variant: "primary",
};

// ── Hero (Home) ─────────────────────────────────────────────────────────

export const heroData: HeroSectionData = {
  eyebrow: "Gel-X Specialist · Nail Art",
  title: "Gel-X artistry,",
  titleItalic: "refined.",
  subtitle:
    "Advanced Gel-X extensions and intricate nail art for those who demand detail. Not a salon — a specialist.",
  primaryCTA: { label: "Book an Appointment", href: "/contact", variant: "primary" },
  secondaryCTA: { label: "View Services", href: "/nails", variant: "ghost" },
  colorScheme: "dark",
};

// ── Brand Pillars (Home) ─────────────────────────────────────────────────

export const brandPillars: FeatureCardData[] = [
  {
    id: "p1",
    icon: "◆",
    tag: "Studio",
    title: "Vynl Nails",
    description:
      "Gel-X extensions and advanced nail art — exclusively. Precision in every set, detail in every stroke.",
    cta: { label: "View Services", href: "/nails" },
  },
  {
    id: "p2",
    icon: "◈",
    tag: "Education",
    title: "Vynl Academy",
    description:
      "Professional nail education from technique to brand-building. Built for artists ready to go further.",
    cta: { label: "Learn More", href: "/academy" },
  },
  {
    id: "p3",
    icon: "◇",
    tag: "Coming Soon",
    title: "Vynl Supply",
    description:
      "Premium tools and products curated by a working nail artist. Built for serious nail techs only.",
    cta: { label: "Get Early Access", href: "/supply" },
  },
];

// ── Services ────────────────────────────────────────────────────────────

export const services: ServiceCardData[] = [
  {
    id: "s1",
    title: "Gel-X Builder Set",
    description:
      "A full set of Gel-X extensions in your chosen shape and length. Finished with a plain colour or classic French — no nail art.",
    price: "From $65",
    duration: "90 min",
    level: "Foundation",
    includes: ["Shape & length of choice", "Plain colour or French", "Top coat finish"],
  },
  {
    id: "s2",
    title: "Gel-X + Art · Level 1",
    description:
      "Gel-X set with minimal nail art. One-tone designs, chrome, foils, simple patterns, or barely-there accents.",
    price: "From $75",
    duration: "100 min",
    level: "Minimal Art",
    includes: ["Full Gel-X set", "Chrome / foils / simple accents", "Up to 2 design elements"],
  },
  {
    id: "s3",
    title: "Gel-X + Art · Level 2",
    description:
      "Gel-X set with detailed nail art. Multi-tone designs, florals, negative space, abstract art, and custom colour blends.",
    price: "From $90",
    duration: "2 hrs",
    level: "Detailed Art",
    includes: ["Full Gel-X set", "Multi-tone or floral designs", "Custom colour blending"],
  },
  {
    id: "s4",
    title: "Gel-X + Art · Level 3",
    description:
      "Gel-X set with intricate, advanced nail art. 3D elements, hand-painted detail, complex multi-layer designs.",
    price: "From $110",
    duration: "2.5–3 hrs",
    level: "Intricate Art",
    includes: ["Full Gel-X set", "3D elements / hand-painted art", "Complex multi-layer designs"],
  },
  {
    id: "s5",
    title: "Gel-X Infill",
    description:
      "Maintain and repair your existing Gel-X set. Includes shape tidy, regrowth fill, and optional nail art upgrade.",
    price: "From $55",
    duration: "60–90 min",
    level: "Maintenance",
    includes: ["Regrowth fill", "Shape tidy", "Optional art upgrade"],
  },
  {
    id: "s6",
    title: "Removal",
    description:
      "Safe, damage-free Gel-X removal. Available standalone or added before a new set.",
    price: "From $15",
    duration: "30 min",
    level: "Add-on",
    includes: ["Gentle soak-off removal", "Nail care check", "Prep for new set (optional)"],
  },
];

// ── Academy ─────────────────────────────────────────────────────────────

export const academyModules: FeatureCardData[] = [
  {
    id: "m1",
    icon: "01",
    title: "Gel-X Mastery",
    description:
      "Master the Gel-X system from scratch — prep, sizing, application, cure, and finishing for a flawless result every time.",
  },
  {
    id: "m2",
    icon: "02",
    title: "Nail Art Fundamentals",
    description:
      "Core techniques including brush control, liner art, negative space, colour theory, and blending.",
  },
  {
    id: "m3",
    icon: "03",
    title: "Advanced Nail Art",
    description:
      "3D sculpted elements, intricate hand-painted work, layering techniques, and complex multi-step finishes.",
  },
  {
    id: "m4",
    icon: "04",
    title: "Content Creation",
    description:
      "Photograph and film your nail work to build a portfolio that attracts premium clients on social media.",
  },
  {
    id: "m5",
    icon: "05",
    title: "Pricing & Clients",
    description:
      "Charge your worth. Learn how to price confidently, handle client communication, and set professional boundaries.",
  },
  {
    id: "m6",
    icon: "06",
    title: "Building Your Nail Brand",
    description:
      "From nail tech to brand. Naming, positioning, social strategy, booking systems, and scaling your business.",
  },
];

export const academyWaitlistConfig: WaitlistFormConfig = {
  title: "Join the Academy Waitlist",
  subtitle:
    "Be first in line when enrollment opens — with exclusive early access and founding member pricing.",
  buttonText: "Reserve My Spot",
  successMessage: "You're on the list. We'll be in touch before enrollment opens.",
  placeholder: "Email address",
  namePlaceholder: "Your name",
  context: "academy",
  showName: true,
};

// ── Supply Shop ──────────────────────────────────────────────────────────

export const supplyProducts: ProductCardData[] = [
  {
    id: "sp1",
    title: "Gel-X Pro Starter Kit",
    description: "Everything you need to start applying Gel-X extensions from day one.",
    badge: "Coming Soon",
    category: "Gel-X Kits",
    inStock: false,
  },
  {
    id: "sp2",
    title: "Nail Art Brush Set",
    description: "Precision brushes for liner work, florals, gradients, and fine detail art.",
    badge: "Coming Soon",
    category: "Brushes",
    inStock: false,
  },
  {
    id: "sp3",
    title: "Gel-X Tips — Almond",
    description: "Soft gel tips in the almond shape. Natural-looking, flexible, and lightweight.",
    badge: "Coming Soon",
    category: "Nail Tips",
    inStock: false,
  },
  {
    id: "sp4",
    title: "Dual-Ended Dotting Tool",
    description: "Two tip sizes for 3D dot work, marbling, and intricate nail art techniques.",
    badge: "Coming Soon",
    category: "Nail Art Tools",
    inStock: false,
  },
  {
    id: "sp5",
    title: "Builder Gel — Nude Collection",
    description: "A set of 6 nude builder gel shades from sheer blush to deep mocha.",
    badge: "Coming Soon",
    category: "Gels",
    inStock: false,
  },
  {
    id: "sp6",
    title: "Artist Accessory Kit",
    description: "Curated accessories for the working nail tech — clips, forms, plates, and more.",
    badge: "Coming Soon",
    category: "Accessories",
    inStock: false,
  },
];

export const shopWaitlistConfig: WaitlistFormConfig = {
  title: "Get Early Access",
  subtitle:
    "Be first to shop the Vynl Supply launch — exclusive preview pricing, early drops, and pro bundles.",
  buttonText: "Join the Launch List",
  successMessage: "You're on the list. Expect an exclusive preview before launch day.",
  placeholder: "Email address",
  namePlaceholder: "Your name",
  context: "shop",
  showName: true,
};

// ── Testimonials ─────────────────────────────────────────────────────────

export const testimonials: TestimonialCardData[] = [
  {
    id: "t1",
    quote:
      "My nails have never looked this good. The detail in the nail art is genuinely unreal — I get comments on them everywhere I go.",
    author: "Amara J.",
    role: "Regular Client",
    rating: 5,
  },
  {
    id: "t2",
    quote:
      "I left Vynl Academy completely transformed. My technique, my pricing, my confidence — all of it elevated.",
    author: "Priya M.",
    role: "Academy Graduate",
    rating: 5,
  },
  {
    id: "t3",
    quote:
      "Finally a nail artist who specialises. You can feel the difference between a generalist and someone who truly masters their craft.",
    author: "Sofía R.",
    role: "Client",
    rating: 5,
  },
  {
    id: "t4",
    quote:
      "I've been doing nails 3 years and I still learned things at Vynl Academy that instantly changed my work.",
    author: "Chloe B.",
    role: "Professional Nail Tech",
    rating: 5,
  },
];

// ── FAQs ─────────────────────────────────────────────────────────────────

export const nailsFAQs: FAQItem[] = [
  {
    id: "n1",
    question: "Do you offer any services other than Gel-X?",
    answer:
      "No. We specialise exclusively in Gel-X extensions and nail art. This singular focus is what allows us to deliver a quality of work that generalist salons can't match.",
  },
  {
    id: "n2",
    question: "What is Gel-X and why is it different?",
    answer:
      "Gel-X is a soft gel extension system that adheres to your natural nail with no drilling and no harsh chemical primers. It's gentler on the nail plate, more flexible to wear, and results in a beautiful, natural-looking extension.",
  },
  {
    id: "n3",
    question: "How long do Gel-X nails last?",
    answer:
      "With proper care, Gel-X typically lasts 3–4 weeks. We recommend booking your infill at around the 3-week mark to maintain the look and integrity of your set.",
  },
  {
    id: "n4",
    question: "How do I book an appointment?",
    answer:
      "Submit a booking request via the contact page or DM us on Instagram. New clients may be asked for a deposit to confirm their appointment.",
  },
  {
    id: "n5",
    question: "Do you accept walk-ins?",
    answer:
      "No — all appointments are by booking only. This ensures every client receives the full, unhurried experience that our work deserves.",
  },
  {
    id: "n6",
    question: "Can I bring inspo photos?",
    answer:
      "Yes, please do. The more reference you bring, the better we can understand your vision. We'll always advise on what translates best to Gel-X before we start.",
  },
];

export const academyFAQs: FAQItem[] = [
  {
    id: "a1",
    question: "When does enrollment open?",
    answer:
      "We're currently building the first cohort. Join the waitlist and you'll be the first to know — before any public announcement.",
  },
  {
    id: "a2",
    question: "Is this for complete beginners?",
    answer:
      "Yes. We designed the academy to take you from zero — no experience required. We also have advanced modules for practising nail techs who want to level up their technique, art, and business.",
  },
  {
    id: "a3",
    question: "Is the course online or in-person?",
    answer:
      "Format details will be released to waitlist members first. We're designing an experience that works for both — high-quality video content and hands-on workshops.",
  },
  {
    id: "a4",
    question: "How much does it cost?",
    answer:
      "Pricing will be released to waitlist members first, with exclusive founding member access. Join the waitlist to secure early-bird pricing.",
  },
  {
    id: "a5",
    question: "Will I need tools and products?",
    answer:
      "Yes. A detailed kit list is included with enrollment. We'll guide you on exactly what to get — and when Vynl Supply launches, you'll be able to get everything in one place.",
  },
];

// ── Gallery ──────────────────────────────────────────────────────────────

export const galleryItems = [
  { id: "g1", alt: "Gel-X almond set with hand-painted florals", aspect: "portrait" as const },
  { id: "g2", alt: "Abstract gel art, negative space design", aspect: "portrait" as const },
  { id: "g3", alt: "French Gel-X with chrome accent", aspect: "portrait" as const },
  { id: "g4", alt: "3D sculpted rose detail set", aspect: "portrait" as const },
  { id: "g5", alt: "Nude and black marble design", aspect: "portrait" as const },
  { id: "g6", alt: "Intricate lace nail art set", aspect: "portrait" as const },
  { id: "g7", alt: "Soft glitter ombre Gel-X", aspect: "portrait" as const },
  { id: "g8", alt: "Custom hand-painted portrait nails", aspect: "portrait" as const },
];

// ── Footer ───────────────────────────────────────────────────────────────

export const footerData: FooterData = {
  logoText: "VYNL",
  tagline: "Where detail becomes identity.",
  linkGroups: [
    {
      heading: "Studio",
      links: [
        { label: "Services", href: "/nails" },
        { label: "Gallery", href: "/nails#gallery" },
        { label: "Book Appointment", href: "/contact" },
        { label: "FAQ", href: "/nails#faq" },
      ],
    },
    {
      heading: "Academy",
      links: [
        { label: "About the Academy", href: "/academy" },
        { label: "Curriculum", href: "/academy#curriculum" },
        { label: "Join Waitlist", href: "/academy#waitlist" },
        { label: "Academy FAQ", href: "/academy#faq" },
      ],
    },
    {
      heading: "Supply",
      links: [
        { label: "Coming Soon", href: "/supply" },
        { label: "Early Access", href: "/supply#waitlist" },
      ],
    },
    {
      heading: "Connect",
      links: [
        { label: "Instagram", href: "https://instagram.com" },
        { label: "TikTok", href: "https://tiktok.com" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  copyright: `© ${new Date().getFullYear()} Vynl. All rights reserved.`,
};
