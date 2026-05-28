import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Heading, LabelText, BodyText, Rule } from "@/components/ui/Typography";

export const metadata: Metadata = {
  title: "Privacy Policy — Vynl Nail Studio",
  description:
    "Privacy Policy for Vynl Nail Studio. Learn how we collect, use, and protect your personal information in accordance with the Australian Privacy Act 1988.",
};

const LAST_UPDATED = "28 May 2026";
const CONTACT_EMAIL = "vynlau@gmail.com";

export default function PrivacyPolicyPage() {
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
              Privacy{" "}
              <span className="italic text-vynl-champagne-light">Policy.</span>
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
                  Vynl Nail Studio (&ldquo;Vynl&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your
                  personal information and your right to privacy. This Privacy Policy explains how we collect,
                  use, disclose, and safeguard your information when you interact with our website,
                  book an appointment, or otherwise engage with us.
                </BodyText>
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  We operate in compliance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy
                  Principles (APPs). By using our services or website, you agree to the practices described
                  in this policy.
                </BodyText>
              </div>

              {/* What we collect */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">1. What Personal Information We Collect</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  We may collect the following types of personal information:
                </BodyText>
                <ul className="flex flex-col gap-4 mt-1">
                  {[
                    { label: "Identity information", detail: "Your full name and preferred pronouns." },
                    { label: "Contact details", detail: "Email address and phone number." },
                    { label: "Booking information", detail: "Appointment date, time, service selected, and any notes or preferences you provide." },
                    { label: "Payment information", detail: "Payment card details processed securely via our third-party payment provider (Square or Stripe). We do not store full card numbers on our systems." },
                    { label: "Health & safety disclosures", detail: "Any allergy or skin condition information you voluntarily disclose for the safe delivery of nail services." },
                    { label: "Communications", detail: "Messages, enquiries, or feedback you send to us via email, contact forms, or social media." },
                    { label: "Technical data", detail: "IP address, browser type, device identifiers, and pages visited, collected via cookies and analytics tools." },
                  ].map((item) => (
                    <li key={item.label} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">
                        <strong className="font-medium text-vynl-black">{item.label}:</strong>{" "}
                        {item.detail}
                      </BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How we collect */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">2. How We Collect Your Information</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  We collect personal information through the following channels:
                </BodyText>
                <ul className="flex flex-col gap-4 mt-1">
                  {[
                    "Online booking forms on this website or via our Square booking page.",
                    "Enquiry or contact forms submitted through this website.",
                    "Direct communications via email, phone, or Instagram DM.",
                    "Automatic collection of technical data via cookies, analytics, and log files when you browse our website.",
                    "Social media interactions on our Instagram and TikTok accounts.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How we use it */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">3. How We Use Your Information</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  We use your personal information only for legitimate business purposes, including:
                </BodyText>
                <ul className="flex flex-col gap-4 mt-1">
                  {[
                    "Confirming, managing, and fulfilling your appointment bookings.",
                    "Processing payments and issuing receipts or refunds where applicable.",
                    "Communicating with you about your booking, any changes, or follow-up care.",
                    "Providing health and safety accommodations based on disclosures you make.",
                    "Sending marketing communications, promotional offers, or service updates — only where you have opted in to receive them.",
                    "Improving our website, services, and customer experience through analytics.",
                    "Complying with our legal obligations.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
                <div className="bg-vynl-smoke p-6 flex flex-col gap-3 mt-2">
                  <BodyText size="sm" className="text-vynl-gray-600 leading-relaxed">
                    <strong className="font-medium text-vynl-black">Marketing opt-in:</strong>{" "}
                    We will only send you marketing communications if you have expressly consented to receive them.
                    You may withdraw your consent at any time by contacting us at{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-vynl-champagne hover:underline">
                      {CONTACT_EMAIL}
                    </a>
                    {" "}or by using the unsubscribe link in any marketing email.
                  </BodyText>
                </div>
              </div>

              {/* Third-party sharing */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">4. Third-Party Sharing & Disclosure</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  We do not sell, trade, or rent your personal information to third parties. We may share
                  your information with the following service providers solely to deliver our services:
                </BodyText>
                <ul className="flex flex-col gap-4 mt-1">
                  {[
                    { label: "Booking platform (Square)", detail: "To process appointment bookings and deposit payments. Square's privacy policy governs their handling of your data." },
                    { label: "Payment processor (Stripe / Square)", detail: "To securely process payment card transactions. Your card details are transmitted directly to the payment processor and are not stored on our servers." },
                    { label: "Email / communication services", detail: "To send booking confirmations, reminders, and notifications." },
                    { label: "Website analytics", detail: "To understand how visitors use our website. Analytics data is aggregated and anonymised where possible." },
                  ].map((item) => (
                    <li key={item.label} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">
                        <strong className="font-medium text-vynl-black">{item.label}:</strong>{" "}
                        {item.detail}
                      </BodyText>
                    </li>
                  ))}
                </ul>
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  We may also disclose your information if required to do so by law, court order, or government
                  authority, or where we believe disclosure is necessary to protect our rights or the safety of others.
                </BodyText>
              </div>

              {/* Data security */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">5. Data Security & Storage</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  We take reasonable steps to protect your personal information from misuse, interference,
                  loss, and unauthorised access, modification, or disclosure. Our security measures include:
                </BodyText>
                <ul className="flex flex-col gap-4 mt-1">
                  {[
                    "HTTPS encryption for all data transmitted through our website.",
                    "Access controls limiting who can view personal information within our systems.",
                    "Use of reputable, security-certified third-party platforms (Square, Stripe) for payment processing.",
                    "Regular review of our data handling practices.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">{item}</BodyText>
                    </li>
                  ))}
                </ul>
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  Your data is stored on servers located in Australia or in countries with comparable privacy
                  protections. We retain your personal information only for as long as necessary to fulfil
                  the purposes for which it was collected, or as required by law.
                </BodyText>
              </div>

              {/* Your rights */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">6. Your Rights Under the Australian Privacy Principles</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  Under the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles, you have the right to:
                </BodyText>
                <ul className="flex flex-col gap-4 mt-1">
                  {[
                    { label: "Access", detail: "Request access to the personal information we hold about you." },
                    { label: "Correction", detail: "Request that we correct any personal information that is inaccurate, out of date, incomplete, or misleading." },
                    { label: "Anonymity", detail: "Where lawful and practicable, interact with us anonymously or using a pseudonym." },
                    { label: "Opt out of marketing", detail: "Withdraw consent for marketing communications at any time." },
                    { label: "Complaint", detail: "Lodge a complaint with us if you believe we have handled your personal information in breach of the Privacy Act. If unsatisfied with our response, you may escalate your complaint to the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au." },
                  ].map((item) => (
                    <li key={item.label} className="flex items-start gap-3">
                      <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                      <BodyText size="sm" className="text-vynl-gray-600">
                        <strong className="font-medium text-vynl-black">{item.label}:</strong>{" "}
                        {item.detail}
                      </BodyText>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cookies */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">7. Cookies & Tracking Technologies</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  Our website uses cookies and similar technologies to enhance your browsing experience,
                  analyse site traffic, and understand visitor behaviour. Cookies are small text files
                  stored on your device.
                </BodyText>
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  You can configure your browser to refuse cookies or to alert you when cookies are being
                  sent. However, some parts of our website may not function properly if you disable cookies.
                </BodyText>
              </div>

              {/* Changes */}
              <div className="flex flex-col gap-5">
                <Heading as="h2" size="sm">8. Changes to This Policy</Heading>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText className="text-vynl-gray-600 leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect changes in our practices
                  or legal obligations. The revised policy will be posted on this page with an updated
                  &ldquo;Last updated&rdquo; date. We encourage you to review this policy periodically.
                </BodyText>
              </div>

            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-10 lg:pt-2">
              <div className="flex flex-col gap-5">
                <LabelText>Privacy Enquiries</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText size="sm" className="text-vynl-gray-600 leading-relaxed">
                  For any privacy-related questions, requests, or complaints, please contact us:
                </BodyText>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-vynl-champagne text-xs mt-1 shrink-0">—</span>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-sans font-medium text-vynl-black tracking-wide">Vynl Nail Studio</p>
                      <p className="text-xs font-sans font-light text-vynl-gray-500">Cranebrook, NSW 2749</p>
                      <p className="text-xs font-sans font-light text-vynl-gray-500">Sydney, Australia</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-vynl-champagne text-xs shrink-0">—</span>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-xs font-sans font-light text-vynl-gray-500 hover:text-vynl-champagne transition-colors"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 pt-6 border-t border-vynl-gray-100">
                <LabelText>Governing Law</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <BodyText size="sm" className="text-vynl-gray-600 leading-relaxed">
                  This Privacy Policy is governed by and construed in accordance with the laws of
                  New South Wales, Australia, and the <em>Privacy Act 1988</em> (Cth).
                </BodyText>
              </div>

              <div className="bg-vynl-smoke p-6 flex flex-col gap-3">
                <Heading as="h3" size="xs">OAIC</Heading>
                <BodyText size="sm" muted>
                  If you are not satisfied with our response to a privacy complaint, you may contact
                  the Office of the Australian Information Commissioner at{" "}
                  <a
                    href="https://www.oaic.gov.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vynl-champagne hover:underline"
                  >
                    oaic.gov.au
                  </a>
                  .
                </BodyText>
              </div>

              <div className="flex flex-col gap-5 pt-6 border-t border-vynl-gray-100">
                <LabelText>Also See</LabelText>
                <div className="w-8 h-px bg-vynl-gray-200" />
                <a
                  href="/terms"
                  className="flex items-center gap-3 text-sm font-sans font-light text-vynl-gray-700 hover:text-vynl-black transition-colors"
                >
                  <span className="text-vynl-champagne text-xs">→</span>
                  Terms &amp; Conditions
                </a>
              </div>
            </div>

          </div>
        </Container>
      </section>
    </>
  );
}
