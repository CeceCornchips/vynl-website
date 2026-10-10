import { Container } from "@/components/layout/Container";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { pageMetadata } from "@/lib/seo";

// Unlinked in-house booking flow — bookings go through Square (/contact), so
// keep this out of the index rather than compete with /contact.
export const metadata = pageMetadata({
  path: "/book",
  title: "Book an Appointment",
  description:
    "Book your nail appointment at Vynl online. Select your service, choose your time, and secure your booking with a deposit.",
  noindex: true,
});

export default function BookPage() {
  return (
    <section className="pt-40 pb-24 bg-vynl-white min-h-screen">
      <Container>
        <div className="max-w-xl mx-auto">
          <div className="mb-10">
            <p className="text-2xs font-sans font-medium tracking-widest uppercase text-vynl-champagne mb-3">
              Book Online
            </p>
            <h1 className="font-display font-medium text-vynl-black text-3xl md:text-4xl leading-tight tracking-tight">
              Book an{" "}
              <span className="italic text-vynl-champagne">appointment.</span>
            </h1>
            <p className="mt-3 text-sm font-sans font-light text-vynl-gray-500 leading-relaxed">
              Select your service, choose a time, and pay your deposit to confirm your booking.
            </p>
          </div>
          <BookingFlow />
        </div>
      </Container>
    </section>
  );
}
