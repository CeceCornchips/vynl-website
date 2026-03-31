import Link from 'next/link'

export const metadata = {
  title: 'The Gel-X Retention Mastery Guide | Vynl Academy',
  description:
    'Download the complete professional guide to Gel-X nail application, covering prep, retention, and avoiding lifting for 3–4 week wear.',
}

export default function GelXGuidePage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#FAFAF8', fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 border-b border-[#E8D5B0]">
        <span
          className="text-sm font-bold uppercase tracking-[0.2em]"
          style={{ color: '#C9A96E' }}
        >
          Vynl Academy
        </span>
        <span
          className="text-xs uppercase tracking-[0.15em]"
          style={{ color: '#B0ADA8' }}
        >
          Professional Education
        </span>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl w-full mx-auto">
          {/* Label */}
          <p
            className="text-center text-xs uppercase tracking-[0.25em] font-bold mb-6"
            style={{ color: '#C9A96E' }}
          >
            Free Course Guide
          </p>

          {/* Main layout: PDF mock + content */}
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* PDF Preview Card */}
            <div className="flex-shrink-0">
              <div
                className="relative w-64 h-80 rounded-sm shadow-2xl overflow-hidden"
                style={{ backgroundColor: '#0A0A0B' }}
              >
                {/* Inner glow border */}
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(201,169,110,0.2)' }}
                />

                {/* Cover content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
                  <p
                    className="text-center text-[7px] uppercase tracking-[0.3em] mb-5"
                    style={{ color: '#C9A96E' }}
                  >
                    Vynl Academy Presents
                  </p>

                  <div
                    className="text-center text-xl font-bold leading-tight mb-3"
                    style={{ color: '#FFFFFF' }}
                  >
                    <p>THE GEL-X</p>
                    <p>RETENTION</p>
                    <p>MASTERY</p>
                    <p>GUIDE</p>
                  </div>

                  <div
                    className="w-24 mb-3"
                    style={{ height: '0.5px', backgroundColor: '#C9A96E' }}
                  />

                  <p
                    className="text-center text-[8px] leading-relaxed"
                    style={{ color: '#E8D5B0' }}
                  >
                    Professional Application Techniques for 3–4 Week Wear
                  </p>
                </div>

                {/* Bottom brand mark */}
                <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center">
                  <p
                    className="text-[6px] uppercase tracking-[0.2em]"
                    style={{ color: '#C9A96E' }}
                  >
                    By Vynl Academy
                  </p>
                  <p
                    className="text-[6px] mt-1"
                    style={{ color: '#6B6864' }}
                  >
                    2025 Edition
                  </p>
                </div>

                {/* Decorative corner accent */}
                <div
                  className="absolute top-3 right-3 w-6 h-6"
                  style={{
                    borderTop: '0.5px solid rgba(201,169,110,0.4)',
                    borderRight: '0.5px solid rgba(201,169,110,0.4)',
                  }}
                />
                <div
                  className="absolute bottom-3 left-3 w-6 h-6"
                  style={{
                    borderBottom: '0.5px solid rgba(201,169,110,0.4)',
                    borderLeft: '0.5px solid rgba(201,169,110,0.4)',
                  }}
                />

                {/* Page edge effect */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1"
                  style={{
                    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.04))',
                  }}
                />
              </div>

              {/* PDF page count */}
              <p
                className="text-center text-xs mt-3 tracking-wide"
                style={{ color: '#B0ADA8' }}
              >
                25 pages · PDF format
              </p>
            </div>

            {/* Right: Text content + CTA */}
            <div className="flex-1 max-w-lg">
              <h1
                className="text-4xl lg:text-5xl font-bold leading-tight mb-4"
                style={{ color: '#0A0A0B' }}
              >
                The Gel-X Retention Mastery Guide
              </h1>

              <div
                className="w-12 mb-6"
                style={{ height: '2px', backgroundColor: '#C9A96E' }}
              />

              <p
                className="text-lg mb-3 leading-relaxed"
                style={{ color: '#6B6864' }}
              >
                Professional Application Techniques for 3–4 Week Wear
              </p>

              <p
                className="text-base leading-relaxed mb-8"
                style={{ color: '#6B6864' }}
              >
                Everything you need to master Gel-X retention, from nail science
                and prep protocols to tip sizing, anti-lifting troubleshooting, and
                a complete appointment checklist. Used by professional nail
                technicians to achieve consistent 3–4 week results.
              </p>

              {/* What&apos;s included */}
              <div className="mb-8">
                <p
                  className="text-xs uppercase tracking-[0.2em] font-bold mb-4"
                  style={{ color: '#C9A96E' }}
                >
                  What&apos;s Inside
                </p>
                <ul className="space-y-2">
                  {[
                    'Complete nail science & adhesion principles',
                    'The 5-step professional prep system',
                    '12 causes of lifting and how to fix each one',
                    'Tip sizing, etching & application masterclass',
                    'Gold standard retention protocol',
                    'Myths vs facts & full appointment checklist',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="text-sm mt-0.5 flex-shrink-0"
                        style={{ color: '#C9A96E' }}
                      >
                        ✓
                      </span>
                      <span
                        className="text-sm leading-relaxed"
                        style={{ color: '#121110' }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Download button */}
              <Link
                href="/api/download-guide"
                download="vynl-academy-gelx-guide.pdf"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-sm font-bold text-sm uppercase tracking-[0.15em] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: '#C9A96E',
                  color: '#0A0A0B',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 1V11M8 11L5 8M8 11L11 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 13H14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Download Free Guide
              </Link>

              {/* Trust note */}
              <p
                className="mt-4 text-xs flex items-center gap-2"
                style={{ color: '#B0ADA8' }}
              >
                <span style={{ color: '#C9A96E' }}>✦</span>
                Trusted by nail professionals globally
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section
        className="border-t border-b"
        style={{ borderColor: '#E8D5B0', backgroundColor: '#F4F2EF' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: '25 Pages',
              desc: 'Comprehensive coverage from science to application',
            },
            {
              label: '12 Lifting Causes',
              desc: 'Every cause diagnosed with prevention techniques',
            },
            {
              label: 'Pro Checklists',
              desc: 'Print-ready prep and application checklists',
            },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <p
                className="text-lg font-bold mb-1"
                style={{ color: '#C9A96E' }}
              >
                {feature.label}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#6B6864' }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 flex items-center justify-between">
        <span
          className="text-xs uppercase tracking-[0.2em]"
          style={{ color: '#C9A96E' }}
        >
          Vynl Academy
        </span>
        <span
          className="text-xs"
          style={{ color: '#B0ADA8' }}
        >
          © 2025 Vynl Academy. All rights reserved.
        </span>
      </footer>
    </main>
  )
}
