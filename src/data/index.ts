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
  MediaItem,
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
  eyebrow: "Gel-X Nails · Penrith & Cranebrook",
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

// Newest work first. The first 12 (the home-page teaser) are hand-picked
// pink, floral and pastel sets; keep the strongest, most "Vynl" photos there.
// The rest of the new photos follow, interleaved so photos of the same set
// never sit side by side, then the original portfolio (which mixes in a few
// squares for masonry rhythm).
//
// Files in /images/gallery are pre-cropped to 3:4 with the phone-screenshot
// black bars removed — crop new photos the same way before adding them, since
// object-cover will happily show any letterboxing baked into the source.
//
// Alt text describes the actual set in each photo — colour, shape and
// technique. Don't reset these to a generic string, and don't work the suburb
// into every line: repeating "Cranebrook" across every image is keyword
// stuffing, and it makes the gallery worse for anyone using a screen reader.
const _rawGallery: Array<{ file: string; alt: string; aspect: GalleryGridItem["aspect"] }> = [
  { file: "gallery/long-stiletto-gel-x-set-3d-pink-flowers.jpg", alt: "Long stiletto Gel-X set with 3D pink flowers, carved pastel petals and blue-purple ombre", aspect: "portrait" },
  { file: "gallery/stiletto-gel-x-set-hand-painted-papaya-red-hibiscus.jpg", alt: "Stiletto Gel-X set with hand-painted papaya, red hibiscus flowers and gold leaf", aspect: "portrait" },
  { file: "gallery/almond-gel-x-nails-pink-peach-swirls-3d.jpg", alt: "Almond Gel-X nails with pink and peach swirls, 3D pink flowers and gold pearls", aspect: "portrait" },
  { file: "gallery/monet-inspired-hand-painted-almond-gel-x-nails-blue-skies.jpg", alt: "Monet-inspired hand-painted almond Gel-X nails with blue skies, greenery and water lilies", aspect: "portrait" },
  { file: "gallery/soft-pink-almond-gel-x-nails-black-dot.jpg", alt: "Soft pink almond Gel-X nails with tiny black dot French tips", aspect: "portrait" },
  { file: "gallery/stiletto-gel-x-set-3d-pink-purple-flowers.jpg", alt: "Stiletto Gel-X set with 3D pink and purple flowers, coral swirls and gem accents", aspect: "portrait" },
  { file: "gallery/butter-yellow-almond-gel-x-nails-3d-flowers.jpg", alt: "Butter yellow almond Gel-X nails with 3D flowers, gold swirls and pearl charms", aspect: "portrait" },
  { file: "gallery/pale-pink-almond-gel-x-nails-hand-painted-yellow.jpg", alt: "Pale pink almond Gel-X nails with hand-painted yellow and pink flowers", aspect: "portrait" },
  { file: "gallery/fruity-almond-gel-x-set-painted-orange-slices.jpg", alt: "Fruity almond Gel-X set with painted orange slices, kiwi, a flower and polka dots", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-3d-pink-hibiscus-gold.jpg", alt: "Almond Gel-X set with 3D pink hibiscus, gold chrome swirls and dark green accents", aspect: "portrait" },
  { file: "gallery/milky-almond-gel-x-nails-hand-painted-blue-watercolour.jpg", alt: "Milky almond Gel-X nails with hand-painted blue watercolour florals", aspect: "portrait" },
  { file: "gallery/stiletto-gel-x-nails-pink-starburst-flowers-gold.jpg", alt: "Stiletto Gel-X nails with pink starburst flowers, gold swirl charms and orange ombre", aspect: "portrait" },
  { file: "gallery/stiletto-gel-x-set-gold-chrome-blue-swirl.jpg", alt: "Stiletto Gel-X set with gold chrome, blue swirl art, red accents and 3D gold detailing", aspect: "portrait" },
  { file: "gallery/natural-sheer-pink-almond-gel-x-extensions-glossy.jpg", alt: "Natural sheer pink almond Gel-X extensions with a glossy finish", aspect: "portrait" },
  { file: "gallery/almond-gel-x-nails-smoky-black-ombre-painted.jpg", alt: "Almond Gel-X nails with smoky black ombre, painted white butterflies and silver detail", aspect: "portrait" },
  { file: "gallery/silver-chrome-almond-gel-x-nails-3d-raised.jpg", alt: "Silver chrome almond Gel-X nails with 3D raised swirls and crystal studs", aspect: "portrait" },
  { file: "gallery/square-gel-x-nails-orange-black-tiger-stripe.jpg", alt: "Square Gel-X nails with orange and black tiger stripe French tips", aspect: "portrait" },
  { file: "gallery/milky-white-almond-gel-x-nails-white-star.jpg", alt: "Milky white almond Gel-X nails with white star decals and crystal studs", aspect: "portrait" },
  { file: "gallery/hand-painted-anime-inspired-almond-gel-x-set-black-spirit.jpg", alt: "Hand-painted anime-inspired almond Gel-X set with black spirit characters and pastel scenes", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-iridescent-green-grey-chrome-embossed.jpg", alt: "Almond Gel-X set with iridescent green-grey chrome, embossed florals and gold wire", aspect: "portrait" },
  { file: "gallery/glossy-deep-plum-almond-gel-x-nails.jpg", alt: "Glossy deep plum almond Gel-X nails", aspect: "portrait" },
  { file: "gallery/bright-almond-gel-x-set-red-yellow-blue.jpg", alt: "Bright almond Gel-X set with red, yellow and blue abstract swirls and outlined shapes", aspect: "portrait" },
  { file: "gallery/stiletto-gel-x-nails-blue-bronze-aura-chrome.jpg", alt: "Stiletto Gel-X nails with blue and bronze aura chrome tips and silver beads", aspect: "portrait" },
  { file: "gallery/nude-stiletto-gel-x-nails-bold-black-geometric.jpg", alt: "Nude stiletto Gel-X nails with bold black geometric line art", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-mixing-gold-chrome-sage.jpg", alt: "Almond Gel-X set mixing gold chrome, sage green, tiger stripes and burgundy polka dots", aspect: "portrait" },
  { file: "gallery/festive-almond-gel-x-set-red-tartan-blue.jpg", alt: "Festive almond Gel-X set with red tartan, blue plaid and painted snowflake detail", aspect: "portrait" },
  { file: "gallery/red-french-tips-pink-cow-print-gold.jpg", alt: "Red French tips, pink cow print and gold star charms on long almond Gel-X nails", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-thin-dark-brown.jpg", alt: "Nude almond Gel-X nails with thin dark brown French tips", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-silver-chrome-3d-silver.jpg", alt: "Almond Gel-X set with silver chrome, 3D silver bows, red plaid and dark berry tones", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-mixing-gold-chrome-swirls.jpg", alt: "Almond Gel-X set mixing gold chrome swirls, dalmatian spots, deep green and red French tips", aspect: "portrait" },
  { file: "gallery/long-glossy-milky-pink-almond-gel-x-extensions.jpg", alt: "Long glossy milky pink almond Gel-X extensions", aspect: "portrait" },
  { file: "gallery/hand-painted-miniature-landscape-floral-scenes-short-almond.jpg", alt: "Hand-painted miniature landscape and floral scenes on short almond Gel-X nails", aspect: "portrait" },
  { file: "gallery/long-almond-gel-x-nails-lime-green-chrome.jpg", alt: "Long almond Gel-X nails with lime green chrome, gold wire frames and white French tips", aspect: "portrait" },
  { file: "gallery/mix-and-match-almond-gel-x-set-black-white-stripes.jpg", alt: "Mix-and-match almond Gel-X set with black and white stripes, dots and French tips", aspect: "portrait" },
  { file: "gallery/almond-gel-x-nails-3d-gold-wire-frames.jpg", alt: "Almond Gel-X nails with 3D gold wire frames, blue gems and sculpted flower accents", aspect: "portrait" },
  { file: "gallery/square-gel-x-nails-lime-green-chrome-panels.jpg", alt: "Square Gel-X nails with lime green chrome panels, tortoiseshell and gold French tips", aspect: "portrait" },
  { file: "gallery/bold-maximalist-almond-gel-x-set-blue-swirls.jpg", alt: "Bold maximalist almond Gel-X set with blue swirls, a black cat, fruit and 3D charms", aspect: "portrait" },
  { file: "gallery/sheer-pink-almond-gel-x-nails-hand-painted-black.jpg", alt: "Sheer pink almond Gel-X nails with tiny hand-painted black sparkle stars", aspect: "portrait" },
  { file: "gallery/short-almond-gel-x-nails-bright-mixed-colours.jpg", alt: "Short almond Gel-X nails in bright mixed colours with polka dots and pop art", aspect: "portrait" },
  { file: "gallery/black-french-tips-smoky-chrome-gold-detail.jpg", alt: "Black French tips with smoky chrome and gold detail on almond Gel-X nails", aspect: "portrait" },
  { file: "gallery/sage-green-chrome-almond-gel-x-nails-3d.jpg", alt: "Sage green chrome almond Gel-X nails with 3D swirls and painted pink flowers", aspect: "portrait" },
  { file: "gallery/glossy-deep-red-almond-gel-x-nails-dark.jpg", alt: "Glossy deep red almond Gel-X nails against a dark background", aspect: "portrait" },
  { file: "gallery/almond-gel-x-nails-thin-burgundy-french-tips.jpg", alt: "Almond Gel-X nails with thin burgundy French tips and tiny painted stars", aspect: "portrait" },
  { file: "gallery/hand-painted-landscape-nail-art-almond-gel-x-nails.jpg", alt: "Hand-painted landscape nail art on almond Gel-X nails with a black cat accent", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-orange-yellow-ombre.jpg", alt: "Nude almond Gel-X nails with orange and yellow ombre tips, silver chrome and star charms", aspect: "portrait" },
  { file: "gallery/raspberry-pink-almond-gel-x-nails-ribbed-textured.jpg", alt: "Raspberry pink almond Gel-X nails with a ribbed, textured finish", aspect: "portrait" },
  { file: "gallery/almond-gel-x-nails-sage-green-lilac-marble.jpg", alt: "Almond Gel-X nails with sage green and lilac marble, gold wire outlines and pearl detail", aspect: "portrait" },
  { file: "gallery/square-gel-x-nails-orange-black-tiger-stripe-2.jpg", alt: "Square Gel-X nails with orange and black tiger stripe French tips and gold accents", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-minimalist-black-linework.jpg", alt: "Nude almond Gel-X nails with minimalist black linework and a smoky accent nail", aspect: "portrait" },
  { file: "gallery/almond-gel-x-nails-turquoise-cherry-red-abstract.jpg", alt: "Almond Gel-X nails with turquoise and cherry red abstract art and crystal details", aspect: "portrait" },
  { file: "gallery/butter-yellow-french-tips-3d-flowers-gold.jpg", alt: "Butter yellow French tips with 3D flowers and gold swirl charms on almond Gel-X nails", aspect: "portrait" },
  { file: "gallery/almond-gel-x-nails-blue-amber-aura-chrome.jpg", alt: "Almond Gel-X nails with blue and amber aura chrome, swirl lines and silver beads", aspect: "portrait" },
  { file: "gallery/sheer-almond-gel-x-nails-3d-gold-copper.jpg", alt: "Sheer almond Gel-X nails with 3D gold and copper butterfly art", aspect: "portrait" },
  { file: "gallery/long-square-gel-x-nails-mixed-brown-pale.jpg", alt: "Long square Gel-X nails with mixed brown, pale blue and silver chrome French tips", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-teal-3d-swirls-painted.jpg", alt: "Almond Gel-X set with teal 3D swirls, painted pink lilies and gold flower charms", aspect: "portrait" },
  { file: "gallery/mix-and-match-almond-gel-x-set-pale-blue-french.jpg", alt: "Mix-and-match almond Gel-X set with pale blue French tips, burgundy dots and painted stars", aspect: "portrait" },
  { file: "gallery/close-up-hand-painted-anime-inspired-gel-x-nails-black-spirit.jpg", alt: "Close-up of hand-painted anime-inspired Gel-X nails with black spirit characters", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-molten-silver-chrome-frames.jpg", alt: "Almond Gel-X set with molten silver chrome frames, slate grey and amber ombre accents", aspect: "portrait" },
  { file: "gallery/almond-gel-x-nails-abstract-red-black-white.jpg", alt: "Almond Gel-X nails with abstract red, black and white swirl French tips", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-gold-studs-pearls.jpg", alt: "Nude almond Gel-X nails with gold studs, pearls and brown polka dot tips", aspect: "portrait" },
  { file: "gallery/painted-scenic-gingham-detail-almond-gel-x-nails-gold.jpg", alt: "Painted scenic and gingham-detail almond Gel-X nails with gold trim", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-dark-green-marble-gold.jpg", alt: "Almond Gel-X set with dark green marble, gold leaf and pearl accents", aspect: "portrait" },
  { file: "gallery/silver-chrome-stiletto-gel-x-nails-3d-swirls.jpg", alt: "Silver chrome stiletto Gel-X nails with 3D swirls and crystal accents", aspect: "portrait" },
  { file: "gallery/pink-leafy-green-almond-gel-x-nails-hand-painted.jpg", alt: "Pink and leafy green almond Gel-X nails with hand-painted botanical detail", aspect: "portrait" },
  { file: "gallery/classic-white-french-tips-almond-gel-x-nails.jpg", alt: "Classic white French tips on almond Gel-X nails in natural light", aspect: "portrait" },
  { file: "gallery/cream-almond-gel-x-nails-red-gold-3d.jpg", alt: "Cream almond Gel-X nails with tiny red and gold 3D accents", aspect: "portrait" },
  { file: "gallery/tropical-stiletto-gel-x-set-painted-papaya-slices.jpg", alt: "Tropical stiletto Gel-X set with painted papaya slices and a red 3D hibiscus", aspect: "portrait" },
  { file: "gallery/sheer-nude-almond-gel-x-nails-outlined-gold.jpg", alt: "Sheer nude almond Gel-X nails outlined with fine gold wire swirls", aspect: "portrait" },
  { file: "gallery/square-gel-x-set-icy-blue-chrome-starburst.jpg", alt: "Square Gel-X set with icy blue chrome starburst, white French tips and gold charms", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-teal-3d-swirls-gold.jpg", alt: "Almond Gel-X set with teal 3D swirls, gold spiral detail and painted pink lilies", aspect: "portrait" },
  { file: "gallery/white-french-tip-almond-gel-x-nails-gold.jpg", alt: "White French tip almond Gel-X nails with gold chain and crystal detail", aspect: "portrait" },
  { file: "gallery/sheer-nude-almond-gel-x-nails-pink-peach.jpg", alt: "Sheer nude almond Gel-X nails with pink and peach swirl tips and tiny 3D charms", aspect: "portrait" },
  { file: "gallery/close-up-milky-almond-gel-x-nails-white-stars.jpg", alt: "Close-up of milky almond Gel-X nails with white stars and tiny crystals", aspect: "portrait" },
  { file: "gallery/close-up-glossy-cherry-red-almond-gel-x-nails.jpg", alt: "Close-up of glossy cherry red almond Gel-X nails on both hands", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-minimalist-painted-accents.jpg", alt: "Nude almond Gel-X nails with minimalist painted accents and a tortoiseshell phone case", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-gold-star-crystal.jpg", alt: "Nude almond Gel-X nails with tiny gold star and crystal accents", aspect: "portrait" },
  { file: "gallery/black-angular-french-tips-sheer-pink-almond.jpg", alt: "Black angular French tips on sheer pink almond Gel-X nails", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-pale-yellow-accents.jpg", alt: "Nude almond Gel-X nails with pale yellow accents, gold wire rings and 3D detail", aspect: "portrait" },
  { file: "gallery/sunset-ombre-silver-chrome-almond-gel-x-nails.jpg", alt: "Sunset ombre and silver chrome almond Gel-X nails with tiny star studs", aspect: "portrait" },
  { file: "gallery/almond-gel-x-set-teal-swirls-gold-spirals.jpg", alt: "Almond Gel-X set with teal swirls, gold spirals and a painted pink lily", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-gold-studs-brown.jpg", alt: "Nude almond Gel-X nails with gold studs and brown French details against a polka dot phone case", aspect: "portrait" },
  { file: "gallery/pastel-almond-gel-x-set-3d-pink-flowers.jpg", alt: "Pastel almond Gel-X set with 3D pink flowers, yellow tips and fine painted details", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-black-french-tips.jpg", alt: "Nude almond Gel-X nails with fine black French tips, gold charms and pink accents", aspect: "portrait" },
  { file: "gallery/nude-almond-gel-x-nails-outlined-gold-wire.jpg", alt: "Nude almond Gel-X nails outlined in gold wire with tiny pearl accents", aspect: "square" },
  { file: "gallery/tortoiseshell-brown-french-tips-nude-almond-gel-x.jpg", alt: "Tortoiseshell brown French tips on nude almond Gel-X nails", aspect: "portrait" },
  { file: "gallery/black-almond-gel-x-set-mixing-cat-eye-leopard.jpg", alt: "Black almond Gel-X set mixing cat-eye, leopard print and gold 3D cross charms", aspect: "portrait" },
  { file: "gallery/pearl-white-french-tips-gold-wire-outlines.jpg", alt: "Pearl white French tips with gold wire outlines and 3D gold bow charms", aspect: "portrait" },
  { file: "gallery/milky-white-stiletto-gel-x-nails-painted-petal.jpg", alt: "Milky white stiletto Gel-X nails with painted petal detail and gold bead accents", aspect: "portrait" },
  { file: "gallery/long-stiletto-gel-x-nails-tiger-stripe-tips.jpg", alt: "Long stiletto Gel-X nails with tiger stripe tips, 3D pink flowers and gold charms", aspect: "square" },
  { file: "gallery/black-polka-dot-french-tips-long-stiletto.jpg", alt: "Black polka dot French tips on long stiletto Gel-X nails with 3D pink flowers", aspect: "portrait" },
  { file: "gallery/pink-cream-swirl-gel-x-nails-3d-hibiscus.jpg", alt: "Pink and cream swirl Gel-X nails with a 3D hibiscus and textured ombre accent", aspect: "square" },
  { file: "gallery/sheer-nude-almond-gel-x-nails-3d-pink.jpg", alt: "Sheer nude almond Gel-X nails with 3D pink bows, pearls and fine white linework", aspect: "portrait" },
  { file: "gallery/burgundy-abstract-swirls-sheer-stiletto-gel-x-nails.jpg", alt: "Burgundy abstract swirls on sheer stiletto Gel-X nails", aspect: "portrait" },
  { file: "gallery/green-marble-nude-almond-gel-x-nails-finished.jpg", alt: "Green marble and nude almond Gel-X nails finished with gold wire and chrome", aspect: "square" },
  { file: "gallery/maximalist-stiletto-gel-x-set-mixing-gold-chrome.jpg", alt: "Maximalist stiletto Gel-X set mixing gold chrome, lace filigree and 3D flowers", aspect: "portrait" },
  { file: "gallery/navy-bronze-gel-x-nails-hand-painted-gold-swirls.jpg", alt: "Navy and bronze Gel-X nails with hand-painted gold swirls and bead detail", aspect: "square" },
  { file: "gallery/stiletto-gel-x-set-tortoiseshell-hot-pink-ombre.jpg", alt: "Stiletto Gel-X set with tortoiseshell, hot pink ombre, zebra stripes and a 3D plumeria", aspect: "portrait" },
  { file: "gallery/long-coffin-gel-x-nails-3d-pink-yellow.jpg", alt: "Long coffin Gel-X nails with 3D pink and yellow sculpted flowers and pearls", aspect: "portrait" },
  { file: "gallery/ornate-stiletto-gel-x-set-gold-frames-gemstones.jpg", alt: "Ornate stiletto Gel-X set with gold frames, gemstones and hand-painted wave art", aspect: "portrait" },
  { file: "gallery/classic-white-french-tips-long-almond-gel-x.jpg", alt: "Classic white French tips on long almond Gel-X extensions", aspect: "square" },
  { file: "gallery/tropical-stiletto-gel-x-set-3d-plumeria-painted.jpg", alt: "Tropical stiletto Gel-X set with 3D plumeria, painted blue lilies and plaid tips", aspect: "portrait" },
  { file: "gallery/short-almond-gel-x-nails-lime-orange-purple.jpg", alt: "Short almond Gel-X nails in lime, orange and purple with glossy 3D jelly swirls", aspect: "portrait" },
  { file: "gallery/multicoloured-almond-gel-x-set-raised-jelly-petal.jpg", alt: "Multicoloured almond Gel-X set with raised jelly petal shapes on every nail", aspect: "portrait" },
  { file: "gallery/long-stiletto-gel-x-nails-sculpted-3d-frangipani.jpg", alt: "Long stiletto Gel-X nails with sculpted 3D frangipani and painted plaid tips", aspect: "square" },
  { file: "gallery/red-french-tips-hot-pink-cow-print.jpg", alt: "Red French tips, hot pink cow print and gold star charms on almond Gel-X nails", aspect: "square" },
  { file: "gallery/short-almond-gel-x-nails-slate-blue-sage.jpg", alt: "Short almond Gel-X nails in slate blue, sage and mustard with gold wire frames", aspect: "portrait" },
  { file: "gallery/butter-yellow-french-tips-long-almond-gel-x.jpg", alt: "Butter yellow French tips on long almond Gel-X nails with tiny crystal accents", aspect: "portrait" },
  { file: "gallery/bright-rainbow-almond-gel-x-nails-chrome-droplet.jpg", alt: "Bright rainbow almond Gel-X nails with chrome droplet accents and painted starbursts", aspect: "portrait" },
  { file: "gallery/sheer-nude-almond-gel-x-nails-gold-outlines.jpg", alt: "Sheer nude almond Gel-X nails with gold outlines, a 3D red hibiscus and gem accents", aspect: "square" },
  { file: "gallery/autumn-toned-stiletto-gel-x-nails-green-mustard-rust.jpg", alt: "Autumn-toned stiletto Gel-X nails in green, mustard and rust with 3D swirls", aspect: "portrait" },
  { file: "gallery/burnt-orange-gold-almond-gel-x-nails-3d.jpg", alt: "Burnt orange and gold almond Gel-X nails with a 3D orchid charm and gem clusters", aspect: "portrait" },
  { file: "gallery/stiletto-gel-x-set-3d-chrome-chain-links.jpg", alt: "Stiletto Gel-X set with 3D chrome chain links, iridescent swirls and painted lilies", aspect: "portrait" },
  { file: "gallery/pastel-rainbow-aura-gel-x-nails-iridescent-chrome.jpg", alt: "Pastel rainbow aura Gel-X nails with iridescent chrome and painted sparkle stars", aspect: "square" },
  { file: "gallery/peach-orange-almond-gel-x-nails-3d-sculpted.jpg", alt: "Peach and orange almond Gel-X nails with 3D sculpted flowers and sunburst detail", aspect: "square" },
  { file: "gallery/almond-gel-x-nails-3d-blue-flower-gold.jpg", alt: "Almond Gel-X nails with a 3D blue flower, gold chrome, leopard print and gold beads", aspect: "portrait" },
  { file: "gallery/glossy-black-angular-french-tips-sheer-pink.jpg", alt: "Glossy black angular French tips on sheer pink square Gel-X nails", aspect: "portrait" },
];

export const galleryItems: GalleryGridItem[] = _rawGallery.map((item, i) => ({
  id: `gallery-${i}`,
  alt: item.alt,
  aspect: item.aspect,
  media: { src: `/images/${item.file}`, alt: item.alt },
}));

// ── Site photos ──────────────────────────────────────────────────────────
// Gallery photos reused around the site. Picked by filename so the alt text
// stays in one place (the gallery list above); an unknown name fails the build.

function galleryPhoto(name: string): MediaItem {
  const media = galleryItems.find((item) => item.media?.src === `/images/gallery/${name}.jpg`)?.media;
  if (!media) throw new Error(`Unknown gallery photo: ${name}`);
  return media;
}

export const sitePhotos = {
  /** Floating polaroid collage in the home hero. */
  heroCollage: [
    galleryPhoto("long-stiletto-gel-x-set-3d-pink-flowers"),
    galleryPhoto("almond-gel-x-nails-pink-peach-swirls-3d"),
    galleryPhoto("stiletto-gel-x-set-hand-painted-papaya-red-hibiscus"),
  ],
  pillars: {
    studio: galleryPhoto("almond-gel-x-set-3d-pink-hibiscus-gold"),
    academy: galleryPhoto("butter-yellow-almond-gel-x-nails-3d-flowers"),
    supply: galleryPhoto("silver-chrome-almond-gel-x-nails-3d-raised"),
  },
  /** Scrolling photo strip (home + academy). */
  marquee: [
    galleryPhoto("stiletto-gel-x-set-3d-pink-purple-flowers"),
    galleryPhoto("soft-pink-almond-gel-x-nails-black-dot"),
    galleryPhoto("monet-inspired-hand-painted-almond-gel-x-nails-blue-skies"),
    galleryPhoto("pale-pink-almond-gel-x-nails-hand-painted-yellow"),
    galleryPhoto("fruity-almond-gel-x-set-painted-orange-slices"),
    galleryPhoto("milky-white-almond-gel-x-nails-white-star"),
    galleryPhoto("stiletto-gel-x-nails-pink-starburst-flowers-gold"),
    galleryPhoto("milky-almond-gel-x-nails-hand-painted-blue-watercolour"),
    galleryPhoto("raspberry-pink-almond-gel-x-nails-ribbed-textured"),
    galleryPhoto("hand-painted-anime-inspired-almond-gel-x-set-black-spirit"),
    galleryPhoto("almond-gel-x-nails-sage-green-lilac-marble"),
    galleryPhoto("bold-maximalist-almond-gel-x-set-blue-swirls"),
    galleryPhoto("pastel-almond-gel-x-set-3d-pink-flowers"),
    galleryPhoto("red-french-tips-pink-cow-print-gold"),
  ],
  whyVynl: [
    galleryPhoto("hand-painted-miniature-landscape-floral-scenes-short-almond"),
    galleryPhoto("butter-yellow-french-tips-3d-flowers-gold"),
    galleryPhoto("almond-gel-x-set-teal-3d-swirls-painted"),
  ],
  /** Tilted photos either side of the closing call-to-action. */
  ctaSides: [
    galleryPhoto("almond-gel-x-set-3d-pink-hibiscus-gold"),
    galleryPhoto("long-stiletto-gel-x-set-3d-pink-flowers"),
  ],
  academyAudience: [
    galleryPhoto("natural-sheer-pink-almond-gel-x-extensions-glossy"),
    galleryPhoto("stiletto-gel-x-set-hand-painted-papaya-red-hibiscus"),
    galleryPhoto("monet-inspired-hand-painted-almond-gel-x-nails-blue-skies"),
  ],
  contact: [
    galleryPhoto("soft-pink-almond-gel-x-nails-black-dot"),
    galleryPhoto("almond-gel-x-nails-pink-peach-swirls-3d"),
    galleryPhoto("pastel-almond-gel-x-set-3d-pink-flowers"),
  ],
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
    media: sitePhotos.pillars.studio,
  },
  {
    id: "p2",
    icon: "◈",
    tag: "Education",
    title: "Vynl Academy",
    description:
      "Professional nail education from technique to brand-building. Built for artists ready to go further.",
    cta: { label: "Learn More", href: "/academy" },
    media: sitePhotos.pillars.academy,
  },
  {
    id: "p3",
    icon: "◇",
    tag: "Coming Soon",
    title: "Vynl Supply",
    description:
      "Premium tools and products curated by a working nail artist. Built for serious nail techs only.",
    cta: { label: "Get Early Access", href: "/supply" },
    media: sitePhotos.pillars.supply,
  },
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
