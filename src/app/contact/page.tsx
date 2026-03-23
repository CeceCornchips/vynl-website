import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Heading, Subheading, LabelText, BodyText, Rule } from "@/components/ui/Typography";
import { ContactForm } from "@/components/forms/Forms";

export const metadata: Metadata = {
  title: "Book an Appointment — Vynl",
  description:
    "Request a Gel-X nail appointment with Vynl. All appointments are by booking only. Submit your request and we'll confirm via email.",
};

export default function ContactPage() {
  return (
    <>
      {/* ── Page hero ── */}
      <section className="pt-40 pb-16 bg-vynl-black">
        <Container>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Rule />
              <LabelText light>Book · Contact</LabelText>
            </div>
            <h1 className="font-display font-medium text-vynl-white text-4xl md:text-6xl leading-tight tracking-tight max-w-2xl">
              Book an{" "}
              <span className="italic text-vynl-champagne-light">appointment.</span>
            </h1>
            <p className="text-base font-sans font-light text-vynl-gray-400 max-w-lg leading-relaxed">
              All appointments are by booking request only. Fill in the form
              below and we'll confirm your slot via email — usually within 24 hours.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Content ── */}
      <section className="py-20 md:py-28 bg-vynl-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-16 lg:gap-24">
            {/* Form */}
            <div>
              <ContactForm />
            </div>

            {/* Sidebar info */}
            <div className="flex flex-col gap-10 lg:pt-2">
              {/* Booking info */}
              <div className="flex flex-col gap-5">
                <LabelText>Before You Book</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <ul className="flex flex-col gap-4">
                  {[
                    "All appointments are by booking only — no walk-ins.",
                    "New clients may be asked for a deposit to confirm.",
                    "Please arrive with bare nails or removal booked.",
                    "Bring inspo photos — the more detail, the better.",
                    "We'll always advise on what works best for your nails before we start.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social */}
              <div className="flex flex-col gap-5 pt-6 border-t border-vynl-gray-100">
                <LabelText>Find Us</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <div className="flex flex-col gap-3">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                  >
                    <span className="text-vynl-champagne text-xs">→</span>
                    Instagram
                  </a>
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                  >
                    <span className="text-vynl-champagne text-xs">→</span>
                    TikTok
                  </a>
                </div>
              </div>

              {/* Response time */}
              <div className="bg-vynl-smoke p-6 flex flex-col gap-3">
                <Heading as="h3" size="xs">Response time</Heading>
                <BodyText size="sm" muted>
                  Booking requests are typically confirmed within 24 hours.
                  If you need a quicker response, DM us on Instagram.
                </BodyText>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
