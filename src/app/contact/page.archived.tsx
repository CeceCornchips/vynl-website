import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Heading, LabelText, BodyText, Rule } from "@/components/ui/Typography";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book an Appointment — Vynl",
  description:
      "Book your Gel-X nail appointment at Vynl online. Select your service, choose your time, and pay your deposit instantly via Square.",
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
              Select your service and preferred time below — all powered by
              Square so your booking is confirmed instantly.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Content ── */}
      <section className="py-20 md:py-28 bg-vynl-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-16 lg:gap-24">
            {/* Inline booking flow with Square payment */}
            <div>
              <BookingFlow />
            </div>

            {/* Sidebar info */}
            <div className="flex flex-col gap-10 lg:pt-2">
              {/* Booking info */}
              <div className="flex flex-col gap-5">
                <LabelText>Before You Book</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <ul className="flex flex-col gap-4">
                  {[
                    "All appointments are online bookings only — no walk-ins.",
                    "A deposit is required at the time of booking via Square.",
                    "Please arrive with bare nails or have removal booked.",
                    "After booking, DM your inspo photos to @au.vynl on Instagram.",
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
                    href="https://instagram.com/au.vynl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                  >
                    <span className="text-vynl-champagne text-xs">→</span>
                    @au.vynl
                  </a>
                  <a
                    href="https://instagram.com/vynlacademy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                  >
                    <span className="text-vynl-champagne text-xs">→</span>
                    @vynlacademy
                  </a>
                  <a
                    href="https://tiktok.com/@vynlacademy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                  >
                    <span className="text-vynl-champagne text-xs">→</span>
                    TikTok · @vynlacademy
                  </a>
                  <a
                    href="mailto:vynlau@gmail.com"
                    className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                  >
                    <span className="text-vynl-champagne text-xs">→</span>
                    vynlau@gmail.com
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-3 pt-6 border-t border-vynl-gray-100">
                <LabelText>Location</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <p className="text-sm font-sans font-light text-vynl-gray-600 leading-relaxed">
                  Cranebrook, NSW
                </p>
                <p className="text-2xs font-sans text-vynl-gray-400 tracking-widest uppercase">
                  By appointment only
                </p>
              </div>

              {/* Post-booking instructions */}
              <div className="bg-vynl-smoke p-6 flex flex-col gap-3">
                <Heading as="h3" size="xs">After you book</Heading>
                <BodyText size="sm" muted>
                  Once your booking is confirmed, send your inspo photos via
                  Instagram DM to{" "}
                  <a
                    href="https://instagram.com/au.vynl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vynl-champagne hover:underline"
                  >
                    @au.vynl
                  </a>
                  . The more reference the better — we&apos;ll confirm what&apos;s
                  achievable before your appointment.
                </BodyText>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
