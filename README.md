# Vynl Website

A production-ready, component-driven website for the Vynl beauty brand — built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**.

---

## Getting Started

### Prerequisites

Install [Node.js](https://nodejs.org/) (v18 or higher) if you haven't already.

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (Navbar + Footer)
│   ├── page.tsx            # Homepage (composed from sections)
│   └── globals.css         # Global styles + Tailwind base
│
├── components/
│   ├── ui/                 # Atomic UI components
│   │   ├── Typography.tsx  # Heading, Subheading, BodyText, LabelText
│   │   ├── Buttons.tsx     # PrimaryButton, SecondaryButton, GhostButton
│   │   ├── Media.tsx       # MediaPlaceholder, HeroMedia, GalleryGrid, VideoBlock
│   │   ├── Navbar.tsx      # Navbar + MobileMenu
│   │   └── Footer.tsx      # Footer
│   │
│   ├── layout/             # Layout primitives
│   │   ├── Container.tsx   # Centered max-width wrapper
│   │   ├── Section.tsx     # Themed section with spacing
│   │   ├── Grid.tsx        # Responsive grid
│   │   └── Stack.tsx       # Vertical spacing wrapper
│   │
│   ├── cards/              # Card components
│   │   └── Cards.tsx       # FeatureCard, ServiceCard, ProductCard, TestimonialCard
│   │
│   ├── forms/              # Form components
│   │   └── Forms.tsx       # InputField, EmailInput, FormWrapper, WaitlistForm
│   │
│   └── sections/           # Page sections (composed from primitives)
│       ├── HeroSection.tsx
│       ├── FeatureSection.tsx
│       ├── ServicesSection.tsx
│       ├── GallerySection.tsx
│       ├── AcademySection.tsx
│       ├── SupplyShopSection.tsx
│       ├── TestimonialsSection.tsx
│       ├── FAQSection.tsx
│       └── CTASection.tsx
│
├── data/
│   └── index.ts            # All site content (services, products, FAQs, etc.)
│
├── types/
│   └── index.ts            # TypeScript interfaces for all components
│
└── lib/
    └── utils.ts            # cn() helper + shared utilities
```

---

## Design System

### Colors (`tailwind.config.ts`)

| Token | Value | Usage |
|---|---|---|
| `vynl-black` | `#0A0A0A` | Primary text, hero backgrounds |
| `vynl-white` | `#FAFAF8` | Page background |
| `vynl-cream` | `#F5F0EA` | Alternating section backgrounds |
| `vynl-gold` | `#C9A96E` | Accent color, CTAs, highlights |
| `vynl-charcoal` | `#1C1C1E` | Dark section backgrounds |
| `vynl-gray-*` | `100–900` | Text, borders, subtle fills |

### Typography

- `Heading` — display/h1 through h6 with size variants
- `Subheading` — secondary copy, muted
- `BodyText` — paragraph text with size control
- `LabelText` — small uppercase labels (gold accent)

### Buttons

- `PrimaryButton` — gold fill
- `SecondaryButton` — gold border/outline
- `GhostButton` — transparent, hover fill

All buttons accept `href` (renders as `<Link>`) or `onClick` (renders as `<button>`).

---

## Extending the Site

### Adding a New Service

Open `src/data/index.ts` and add an entry to the `services` array:

```ts
{
  id: "s7",
  title: "New Service Name",
  description: "Service description.",
  price: "From $XX",
  duration: "X min",
  category: "Category",
}
```

The `ServicesSection` renders via `.map()` — no template changes needed.

### Adding a New Page

1. Create `src/app/your-page/page.tsx`
2. Import and compose sections from `@/components/sections`
3. Pull data from `@/data` or create a new data file

### Connecting a Waitlist API

In `src/components/forms/Forms.tsx`, find `WaitlistForm` and replace the `setTimeout` mock:

```ts
// Replace this:
await new Promise((res) => setTimeout(res, 1000));

// With your API call:
await fetch("/api/waitlist", {
  method: "POST",
  body: JSON.stringify({ email, context }),
  headers: { "Content-Type": "application/json" },
});
```

### Adding Real Images

Images use `next/image`. Update `MediaItem` values in `src/data/index.ts`:

```ts
media: {
  src: "https://your-cdn.com/image.jpg",
  alt: "Description",
}
```

Remote domains must be added to `next.config.ts` under `images.remotePatterns`.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 15 | Framework (App Router) |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| `clsx` + `tailwind-merge` | Class composition |
| `next/font` | Optimized font loading |
| `next/image` | Optimized image rendering |
