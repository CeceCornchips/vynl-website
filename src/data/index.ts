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
  GalleryGridItem,
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
      { label: "Coming Soon", href: "/supply", disabled: true },
      { label: "Get Early Access", href: "/supply#waitlist" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export const navCTA: CTALink = {
  label: "Book Now",
  href: "https://vynl.square.site/s/appointments",
  variant: "primary",
  external: true,
};

// ── Hero (Home) ─────────────────────────────────────────────────────────

export const heroData: HeroSectionData = {
  eyebrow: "Gel-X Specialist · Nail Art",
  title: "Gel-X artistry,",
  titleItalic: "refined.",
  subtitle:
    "Advanced Gel-X extensions and intricate nail art for those who demand detail. Not a salon. A specialist.",
  primaryCTA: { label: "Book an Appointment", href: "https://vynl.square.site/s/appointments", variant: "primary", external: true },
  secondaryCTA: { label: "View Services", href: "/nails", variant: "ghost" },
  colorScheme: "dark",
  media: {
    src: "https://pub-151c05ae818f49db8ab6faa898e4aa67.r2.dev/SALON-VIDEO.mp4",
    alt: "Inside the Vynl nail studio in Cranebrook: a calm neutral room with an arched full-length mirror, olive tree and soft curtained light",
    type: "video",
  },
};

// ── Brand Pillars (Home) ─────────────────────────────────────────────────

export const brandPillars: FeatureCardData[] = [
  {
    id: "p1",
    icon: "◆",
    tag: "Studio",
    title: "Vynl Nails",
    description:
      "Gel-X extensions and advanced nail art, exclusively. Precision in every set, detail in every stroke.",
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

// ── Nail Services Catalogue ──────────────────────────────────────────────

export const nailServices: ServiceCardData[] = [
  {
    id: "ns1",
    title: "Soak Off Only (No New Set)",
    description: "Safe removal of Gel X or other nail enhancements.",
    price: "A$60.00",
    duration: "50 mins",
  },
  {
    id: "ns2",
    title: "Gel X Extension",
    description:
      "Gel X Extension is a soft gel nail enhancement applied to your natural nail.",
    price: "Starting from $100",
    duration: "1 hr",
  },
];

export const nailAddOns: ServiceCardData[] = [
  {
    id: "ao1",
    title: "Foreign Soak Off",
    description:
      "Add-on removal service for clients who currently have product applied by another salon or technician.",
    price: "A$30.00",
    duration: "20 mins",
    level: "Add-On Only",
  },
  {
    id: "ao2",
    title: "French Tips",
    description: "A classic french tip on all nails.",
    price: "A$20.00",
    duration: "30 mins",
    level: "Add-On Only",
  },
  {
    id: "ao3",
    title: "Full Colour",
    description: "Full colour finish on all nails.",
    price: "Price varies",
    duration: "10 mins",
    level: "Add-On Only",
  },
  {
    id: "ao4",
    title: "LVL 1 Nail Art",
    description: "LVL 1 Nail Art – Simple",
    price: "+$10–$40",
    duration: "30 mins",
    level: "Add-On Only",
  },
  {
    id: "ao5",
    title: "LVL 2 Nail Art",
    description: "LVL 2 Nail Art – Detailed",
    price: "+$50–$100+",
    duration: "1 hr",
    level: "Add-On Only",
  },
  {
    id: "ao6",
    title: "LVL 3 Nail Art",
    description: "LVL 3 Nail Art – Advanced",
    price: "+$100–$250+",
    duration: "1 hr 30 mins",
    level: "Add-On Only",
  },
  {
    id: "ao7",
    title: "Soak Off",
    description: "Add-on soak off service for clients receiving a new set.",
    price: "A$20.00",
    duration: "20 mins",
    level: "Add-On Only",
  },
];

// ── Services ────────────────────────────────────────────────────────────

export const services: ServiceCardData[] = [
  {
    id: "s1",
    title: "Gel-X Builder Set",
    description:
      "A full set of Gel-X extensions in your chosen shape and length. Finished with a plain colour or classic French. No nail art.",
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
    title: "Gel-X Application Mastery",
    description:
      "The complete technical foundation. Prep protocols, sizing, extend gel application, flash and full cure, finishing, and anti-lifting techniques used by top professionals.",
  },
  {
    id: "m2",
    icon: "02",
    title: "Nail Art Foundations",
    description:
      "Build real brush control. Colour theory, liner work, negative space, blending, and the fundamental techniques that make advanced art possible.",
  },
  {
    id: "m3",
    icon: "03",
    title: "Advanced Nail Art & Design",
    description:
      "Sculpted 3D elements, intricate hand-painted work, multi-step layered finishes, and the complex techniques that set your work apart.",
  },
  {
    id: "m4",
    icon: "04",
    title: "Content & Portfolio Creation",
    description:
      "Shoot and film your sets like a professional. Lighting, angles, editing, and a content strategy that turns your work into your best marketing tool.",
  },
  {
    id: "m5",
    icon: "05",
    title: "Pricing, Clients & Boundaries",
    description:
      "Charge what your work is worth. Pricing strategy, client communication frameworks, handling difficult situations, and protecting your time professionally.",
  },
  {
    id: "m6",
    icon: "06",
    title: "Building Your Nail Brand",
    description:
      "The business module. Brand identity, positioning, social media strategy, booking systems, and the roadmap to a scalable nail business.",
  },
];

export const academyWaitlistConfig: WaitlistFormConfig = {
  title: "Vynl Academy Waitlist",
  subtitle:
    "Sign up now and receive a free course when enrollment opens. Be first in line with exclusive early access and founding member pricing.",
  buttonText: "Join the Waitlist",
  successMessage: "You're on the list! We'll be in touch when we launch.",
  placeholder: "Email address",
  namePlaceholder: "First name",
  context: "academy",
  showName: true,
  type: "academy",
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
    title: "Gel-X Tips: Almond",
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
    title: "Builder Gel: Nude Collection",
    description: "A set of 6 nude builder gel shades from sheer blush to deep mocha.",
    badge: "Coming Soon",
    category: "Gels",
    inStock: false,
  },
  {
    id: "sp6",
    title: "Artist Accessory Kit",
    description: "Curated accessories for the working nail tech: clips, forms, plates, and more.",
    badge: "Coming Soon",
    category: "Accessories",
    inStock: false,
  },
];

export const shopWaitlistConfig: WaitlistFormConfig = {
  title: "Vynl Supply Store Waitlist",
  subtitle:
    "Be first to shop the Vynl Supply launch: exclusive preview pricing, early drops, and pro bundles.",
  buttonText: "Join the Waitlist",
  successMessage: "You're on the list! We'll be in touch when we launch.",
  placeholder: "Email address",
  namePlaceholder: "First name",
  context: "shop",
  showName: true,
  type: "supply",
};

// ── Testimonials ─────────────────────────────────────────────────────────

export const testimonials: TestimonialCardData[] = [
  {
    id: "t1",
    quote:
      "My nails have never looked this good. The detail in the nail art is genuinely unreal. I get comments on them everywhere I go.",
    author: "Amara J.",
    role: "Regular Client",
    rating: 5,
  },
  {
    id: "t2",
    quote:
      "I left Vynl Academy completely transformed. My technique, my pricing, my confidence. All of it elevated.",
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
      "All bookings are made online. Select your service, choose a time that suits you, and pay your deposit securely through our booking system. You'll receive an instant confirmation. No DMs, no back-and-forth.",
  },
  {
    id: "n5",
    question: "Do you accept walk-ins?",
    answer:
      "No, all appointments are by booking only. This ensures every client receives the full, unhurried experience that our work deserves.",
  },
  {
    id: "n6",
    question: "Can I bring inspo photos?",
    answer:
      "Yes, and we love them. Once your booking is confirmed, send your inspo photos to us via Instagram DM at @au.vynl. The more reference the better. We'll always let you know what's achievable in your appointment time before we start.",
  },
];

export const academyFAQs: FAQItem[] = [
  {
    id: "a1",
    question: "When does enrollment open?",
    answer:
      "We're not announcing a date yet. Join the waitlist and you'll be the first to know.",
  },
  {
    id: "a2",
    question: "What's the free course?",
    answer:
      "Everyone on the waitlist gets access to a free course when we launch. Details will be revealed to waitlist members first.",
  },
  {
    id: "a3",
    question: "Is this for complete beginners?",
    answer:
      "Yes. We have courses for all levels — from your very first set to advanced artistry.",
  },
  {
    id: "a4",
    question: "Is the course online or in-person?",
    answer:
      "Fully online and self-paced so you can learn on your own schedule.",
  },
  {
    id: "a5",
    question: "How much does it cost?",
    answer:
      "Pricing will be announced to the waitlist first. Waitlist members get founding member rates.",
  },
];

// ── Gallery ──────────────────────────────────────────────────────────────

// Images reordered so squares are evenly spread across columns:
// — 3-col (nails page): col 0 = 4 sq, col 1 = 4 sq, col 2 = 3 sq
// — 4-col (home page, first 12): exactly 1 sq per column
//
// Alt text describes the actual set in each photo — colour, shape and
// technique. Don't reset these to a generic string, and don't work the suburb
// into every line: repeating "Cranebrook" across 33 images is keyword
// stuffing, and it makes the gallery worse for anyone using a screen reader.
const _rawGallery: Array<{ file: string; alt: string; aspect: GalleryGridItem["aspect"] }> = [
  { file: "IMG_0621.JPG", alt: "Nude almond Gel-X nails outlined in gold wire with tiny pearl accents", aspect: "square" },   // 0  → col0
  { file: "IMG_0512.JPG", alt: "Tortoiseshell brown French tips on nude almond Gel-X nails", aspect: "portrait" }, // 1
  { file: "IMG_0617.JPG", alt: "Black almond Gel-X set mixing cat-eye, leopard print and gold 3D cross charms", aspect: "portrait" }, // 2
  { file: "IMG_0626.JPG", alt: "Pearl white French tips with gold wire outlines and 3D gold bow charms", aspect: "portrait" }, // 3
  { file: "IMG_0705.JPG", alt: "Milky white stiletto Gel-X nails with painted petal detail and gold bead accents", aspect: "portrait" }, // 4
  { file: "IMG_0730.JPG", alt: "Long stiletto Gel-X nails with tiger stripe tips, 3D pink flowers and gold charms", aspect: "square" },   // 5  → col2
  { file: "IMG_1019.JPG", alt: "Black polka dot French tips on long stiletto Gel-X nails with 3D pink flowers", aspect: "portrait" }, // 6
  { file: "IMG_2135.JPG", alt: "Pink and cream swirl Gel-X nails with a 3D hibiscus and textured ombre accent", aspect: "square" },   // 7  → col1
  { file: "IMG_1030.JPG", alt: "Sheer nude almond Gel-X nails with 3D pink bows, pearls and fine white linework", aspect: "portrait" }, // 8
  { file: "IMG_2249.JPG", alt: "Burgundy abstract swirls on sheer stiletto Gel-X nails", aspect: "portrait" }, // 9
  { file: "IMG_2585.JPG", alt: "Green marble and nude almond Gel-X nails finished with gold wire and chrome", aspect: "square" },   // 10 → col1
  { file: "IMG_2306.jpg", alt: "Maximalist stiletto Gel-X set mixing gold chrome, lace filigree and 3D flowers", aspect: "portrait" }, // 11
  { file: "IMG_2742.JPG", alt: "Navy and bronze Gel-X nails with hand-painted gold swirls and bead detail", aspect: "square" },   // 12 → col0
  { file: "IMG_2607.JPG", alt: "Stiletto Gel-X set with tortoiseshell, hot pink ombre, zebra stripes and a 3D plumeria", aspect: "portrait" }, // 13
  { file: "IMG_2735.JPG", alt: "Long coffin Gel-X nails with 3D pink and yellow sculpted flowers and pearls", aspect: "portrait" }, // 14
  { file: "IMG_2763.JPG", alt: "Ornate stiletto Gel-X set with gold frames, gemstones and hand-painted wave art", aspect: "portrait" }, // 15
  { file: "IMG_3115.JPG", alt: "Classic white French tips on long almond Gel-X extensions", aspect: "square" },   // 16 → col1
  { file: "IMG_3102.JPG", alt: "Tropical stiletto Gel-X set with 3D plumeria, painted blue lilies and plaid tips", aspect: "portrait" }, // 17
  { file: "IMG_3445.JPG", alt: "Short almond Gel-X nails in lime, orange and purple with glossy 3D jelly swirls", aspect: "portrait" }, // 18
  { file: "IMG_3446.JPG", alt: "Multicoloured almond Gel-X set with raised jelly petal shapes on every nail", aspect: "portrait" }, // 19
  { file: "IMG_3464.JPG", alt: "Long stiletto Gel-X nails with sculpted 3D frangipani and painted plaid tips", aspect: "square" },   // 20 → col2
  { file: "IMG_3468.JPG", alt: "Red French tips, hot pink cow print and gold star charms on almond Gel-X nails", aspect: "square" },   // 21 → col0
  { file: "IMG_3465.JPG", alt: "Short almond Gel-X nails in slate blue, sage and mustard with gold wire frames", aspect: "portrait" }, // 22
  { file: "IMG_3467.JPG", alt: "Butter yellow French tips on long almond Gel-X nails with tiny crystal accents", aspect: "portrait" }, // 23
  { file: "IMG_3651.JPG", alt: "Bright rainbow almond Gel-X nails with chrome droplet accents and painted starbursts", aspect: "portrait" }, // 24
  { file: "IMG_5043.JPG", alt: "Sheer nude almond Gel-X nails with gold outlines, a 3D red hibiscus and gem accents", aspect: "square" },   // 25 → col1
  { file: "IMG_3777.JPG", alt: "Autumn-toned stiletto Gel-X nails in green, mustard and rust with 3D swirls", aspect: "portrait" }, // 26
  { file: "IMG_5068.JPG", alt: "Burnt orange and gold almond Gel-X nails with a 3D orchid charm and gem clusters", aspect: "portrait" }, // 27
  { file: "IMG_5238.JPG", alt: "Stiletto Gel-X set with 3D chrome chain links, iridescent swirls and painted lilies", aspect: "portrait" }, // 28
  { file: "IMG_7382.JPG", alt: "Pastel rainbow aura Gel-X nails with iridescent chrome and painted sparkle stars", aspect: "square" },   // 29 → col2
  { file: "IMG_9549.JPG", alt: "Peach and orange almond Gel-X nails with 3D sculpted flowers and sunburst detail", aspect: "square" },   // 30 → col0
  { file: "IMG_7764.JPG", alt: "Almond Gel-X nails with a 3D blue flower, gold chrome, leopard print and gold beads", aspect: "portrait" }, // 31
  { file: "IMG_8979.JPG", alt: "Glossy black angular French tips on sheer pink square Gel-X nails", aspect: "portrait" }, // 32
];

export const galleryItems: GalleryGridItem[] = _rawGallery.map((item, i) => ({
  id: `gallery-${i}`,
  alt: item.alt,
  aspect: item.aspect,
  media: { src: `/images/${item.file}`, alt: item.alt },
}));

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
        { label: "Book Appointment", href: "https://vynl.square.site/s/appointments" },
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
        { label: "Instagram", href: "https://instagram.com/au.vynl" },
        { label: "Academy Instagram", href: "https://instagram.com/vynlacademy" },
        { label: "TikTok", href: "https://tiktok.com/@vynlacademy" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms & Conditions", href: "/terms" },
      ],
    },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms", href: "/terms" },
  ],
  copyright: `© ${new Date().getFullYear()} Vynl. All rights reserved.`,
};
