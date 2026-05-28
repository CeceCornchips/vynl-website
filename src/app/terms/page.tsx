import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Heading, LabelText, BodyText, Rule } from "@/components/ui/Typography";

export const metadata: Metadata = {
  title: "Terms & Conditions — Vynl Nail Studio",
  description:
    "Terms and Conditions for Vynl Nail Studio. Please read our booking, cancellation, payment, and health & safety policies before your appointment.",
};

const LAST_UPDATED = "28 May 2026";
const CONTACT_EMAIL = "vynlau@gmail.com";

export default function TermsPage() {
  return (
    <>
      {/* ── Page hero ── */}
      <section className="pt-40 pb-16 bg-vynl-black">
        <Container>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Rule />
              <LabelText light>Legal</LabelText>
            </div>
            <h1 className="font-display font-medium text-vynl-white text-4xl md:text-6xl leading-tight tracking-tight max-w-2xl">
              Terms &amp;{" "}
              <span className="italic text-vynl-champagne-light">Conditions.</span>
            </h1>
            <p className="text-sm font-sans font-light text-vynl-gray-400">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </Container>
      </section>

      {/* ── Content ── */}
      <section className="py-20 md:py-28 bg-vynl-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-16 lg:gap-24">

            {/* Main content */}
            <div className="flex flex-col gap-14">

              {/* Introduction */}
              <div className="flex flex-col gap-5">
                <LabelText>Overview</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of the Vynl Nail Studio
                  website and services. By booking an appointment or using our services, you agree to be
                  bound by these Terms. Please read them carefully before proceeding.
                </BodyText>
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  Vynl Nail Studio (&ldquo;Vynl&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a nail art studio located
                  in Cranebrook, New South Wales, Australia.
                </BodyText>
              </div>

              {/* Booking & Appointments */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">1. Booking &amp; Appointments</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <ul className="flex flex-col gap-4">
                  {[
                    "All appointments must be booked online through our official booking page. Walk-in appointments are not available.",
                    "A deposit is required at the time of booking to secure your appointment. Your booking is not confirmed until the deposit has been received.",
                    "By completing a booking, you confirm that you have read and agree to these Terms and Conditions.",
                    "We reserve the right to decline a booking or terminate a service at our discretion, including where the client's conduct is inappropriate or where proceeding with the service would pose a health or safety risk.",
                    "After booking, please send your inspiration photos via Instagram DM to @au.vynl. Failure to do so may limit our ability to deliver your desired result.",
                    "Please arrive with bare nails or have a nail removal service booked. We may not be able to accommodate removal at your appointment if not pre-arranged.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cancellation & Rescheduling */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">2. Cancellation &amp; Rescheduling Policy</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <ul className="flex flex-col gap-4">
                  {[
                    "You must provide at least 24 hours' notice to cancel or reschedule your appointment. Notice must be given via direct message on Instagram or by email.",
                    "Cancellations or reschedule requests made with at least 24 hours' notice will not forfeit the deposit, which may be applied to a future booking.",
                    "Cancellations made with less than 24 hours' notice will result in forfeiture of the deposit.",
                    "No-shows (failure to attend without prior notice) will result in full forfeiture of the deposit, and future booking may require full prepayment.",
                    "We reserve the right to cancel or reschedule your appointment due to unforeseen circumstances (illness, emergency, etc.). In such cases, you will be offered a full deposit refund or priority rebooking at your discretion.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
                <div className="bg-vynl-smoke p-6 flex flex-col gap-3 mt-2">
                  <BodyText size="sm" className="text-vynl-gray-600 leading-relaxed">
                    <strong className="font-medium text-vynl-black">Reminder:</strong>{" "}
                    The 24-hour cancellation window is measured from your scheduled appointment start time.
                    For example, if your appointment is at 10:00 AM on Saturday, you must cancel or
                    reschedule before 10:00 AM on Friday.
                  </BodyText>
                </div>
              </div>

              {/* Deposit Terms */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">3. Deposit Terms</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <ul className="flex flex-col gap-4">
                  {[
                    "A non-refundable deposit is required to confirm all bookings. The deposit amount will be displayed at the time of booking.",
                    "The deposit is applied toward the total cost of your service on the day of your appointment.",
                    "Deposits are non-refundable in the event of a no-show or a late cancellation (less than 24 hours' notice).",
                    "Deposits will be refunded in full if Vynl cancels the appointment, or if you cancel with more than 24 hours' notice.",
                    "Deposits are not transferable to another person.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Terms */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">4. Payment Terms</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <ul className="flex flex-col gap-4">
                  {[
                    "All prices are displayed and charged in Australian Dollars (AUD) and are inclusive of Goods and Services Tax (GST) where applicable.",
                    "The remaining balance (total service price minus deposit) is due at the time of your appointment.",
                    "We accept payment via the methods available through our booking and payment platform.",
                    "Vynl reserves the right to amend pricing at any time. Price changes will not affect bookings already confirmed.",
                    "If additional services are requested or required during your appointment, the extra cost will be discussed and agreed upon before proceeding.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Health & Safety */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">5. Health &amp; Safety</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <ul className="flex flex-col gap-4">
                  {[
                    "You must disclose any known allergies, skin conditions, nail conditions, or sensitivities that may affect the safe delivery of nail services prior to your appointment.",
                    "If you are unwell, experiencing symptoms of illness, or have a contagious condition, please reschedule your appointment. We will not proceed with a service where doing so poses a health risk to you or to us.",
                    "We reserve the right to decline or discontinue a service if we identify a contra-indication (e.g. skin infection, nail damage) that makes it unsafe to proceed.",
                    "Gel-X nail products contain chemicals that may cause sensitisation in some individuals. It is your responsibility to inform us of any known chemical sensitivities.",
                    "Children under 16 years of age must be accompanied by a parent or legal guardian. Services for minors are provided at our discretion.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Intellectual Property */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">6. Intellectual Property</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <ul className="flex flex-col gap-4">
                  {[
                    "All content on this website — including but not limited to text, images, photographs, nail art designs, logos, graphics, and videos — is the intellectual property of Vynl Nail Studio and is protected by Australian copyright law.",
                    "Photographs and videos taken by Vynl of your nails during or after your appointment remain the property of Vynl. By attending your appointment, you consent to Vynl using such images for promotional purposes (website, social media, marketing materials). Please advise us before your appointment if you do not consent.",
                    "You may not reproduce, copy, distribute, or use any content from this website for commercial purposes without our prior written consent.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitation of Liability */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">7. Limitation of Liability</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  To the fullest extent permitted by law in New South Wales, Australia:
                </BodyText>
                <ul className="flex flex-col gap-4 mt-1">
                  {[
                    "Vynl Nail Studio will not be liable for any indirect, incidental, special, or consequential loss or damage arising from the use of our services or website.",
                    "Our total liability to you in connection with any appointment or service will not exceed the amount you paid for that specific service.",
                    "We make no warranty that nail art services will meet your exact expectations. Nail art is a creative service, and results may vary based on your natural nail condition, lifestyle, and other factors outside our control.",
                    "Nothing in these Terms excludes, restricts, or modifies any consumer guarantee or right under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)) that cannot be lawfully excluded.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Governing Law */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">8. Governing Law</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  These Terms and Conditions are governed by and construed in accordance with the laws
                  of New South Wales, Australia. Any disputes arising under or in connection with these
                  Terms shall be subject to the exclusive jurisdiction of the courts of New South Wales.
                </BodyText>
              </div>

              {/* Changes to Terms */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">9. Changes to These Terms</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  We reserve the right to update or modify these Terms at any time. The revised Terms
                  will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Your continued use
                  of our services after any changes constitutes your acceptance of the revised Terms.
                </BodyText>
              </div>

            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-10 lg:pt-2">
              <div className="flex flex-col gap-5">
                <LabelText>Quick Reference</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <ul className="flex flex-col gap-4">
                  {[
                    { label: "Cancellation notice", value: "24 hours" },
                    { label: "Deposit", value: "Non-refundable (late cancel / no-show)" },
                    { label: "Currency", value: "AUD (GST inclusive)" },
                    { label: "Location", value: "Cranebrook, NSW 2749" },
                    { label: "Bookings", value: "Online only — no walk-ins" },
                  ].map((item) => (
                    <li key={item.label} className="flex flex-col gap-1">
                      <p className="text-2xs font-sans font-medium tracking-ultra-wide uppercase text-vynl-gray-600">
                        {item.label}
                      </p>
                      <p className="text-xs font-sans font-light text-vynl-gray-500 leading-relaxed">
                        {item.value}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-5 pt-6 border-t border-vynl-gray-100">
                <LabelText>Questions?</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText size="sm" className="text-vynl-gray-600 leading-relaxed">
                  If you have any questions about these Terms, please get in touch before booking.
                </BodyText>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                >
                  <span className="text-vynl-champagne text-xs">→</span>
                  {CONTACT_EMAIL}
                </a>
                <a
                  href="https://instagram.com/au.vynl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                >
                  <span className="text-vynl-champagne text-xs">→</span>
                  @au.vynl
                </a>
              </div>

              <div className="bg-vynl-smoke p-6 flex flex-col gap-3">
                <Heading as="h3" size="xs">Australian Consumer Law</Heading>
                <BodyText size="sm" muted>
                  Nothing in these Terms limits your rights under the Australian Consumer Law.
                  Statutory guarantees that cannot be excluded by contract continue to apply.
                </BodyText>
              </div>

              <div className="flex flex-col gap-5 pt-6 border-t border-vynl-gray-100">
                <LabelText>Also See</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <a
                  href="/privacy-policy"
                  className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                >
                  <span className="text-vynl-champagne text-xs">→</span>
                  Privacy Policy
                </a>
              </div>
            </div>

          </div>
        </Container>
      </section>
    </>
  );
}
