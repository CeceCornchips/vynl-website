import { Container } from "@/components/layout/Container";
import { LabelText, BodyText, Rule } from "@/components/ui/Typography";
import { SUPPORT_EMAIL } from "@/lib/email-config";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/data-deletion",
  title: "Data Deletion",
  description:
    "How to ask Vynl Nail Studio to delete the Instagram messages and other personal information we hold about you.",
});

const LAST_UPDATED = "26 November 2026";

/**
 * Data deletion instructions. Meta requires this page for apps that use the
 * Instagram API, which the DM booking assistant does.
 */
export default function DataDeletionPage() {
  return (
    <>
      <section className="pt-40 pb-16 bg-vynl-black">
        <Container>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Rule />
              <LabelText light>Legal</LabelText>
            </div>
            <h1 className="font-display font-medium text-vynl-white text-4xl md:text-6xl leading-tight tracking-tight max-w-2xl">
              Data{" "}
              <span className="italic text-vynl-champagne-light">Deletion.</span>
            </h1>
            <p className="text-sm font-sans font-light text-vynl-gray-400">Last updated: {LAST_UPDATED}</p>
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-28 bg-vynl-white">
        <Container>
          <div className="flex max-w-2xl flex-col gap-10">
            <div className="flex flex-col gap-5">
              <LabelText>What we keep</LabelText>
              <div className="w-8 h-px bg-vynl-gray-200" />
              <BodyText className="text-vynl-gray-600 leading-relaxed">
                When you message @au.vynl on Instagram, we keep a copy of the conversation (your
                messages, any photos you send, and our replies) so we can answer your questions and
                help you book. Our booking assistant drafts replies from these messages, and every
                reply is checked by Vynl before it&apos;s sent.
              </BodyText>
            </div>

            <div className="flex flex-col gap-5">
              <LabelText>How to ask us to delete it</LabelText>
              <div className="w-8 h-px bg-vynl-gray-200" />
              <BodyText className="text-vynl-gray-600 leading-relaxed">
                Email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Data%20deletion%20request`} className="underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                with the subject &ldquo;Data deletion request&rdquo; and your Instagram username, or
                send us a DM on Instagram asking us to delete your data.
              </BodyText>
              <BodyText className="text-vynl-gray-600 leading-relaxed">
                We&apos;ll delete the messages and photos we hold from your Instagram conversations
                within 30 days and confirm by email or DM once it&apos;s done. Messages also stay in
                your own Instagram inbox, which you control in the Instagram app.
              </BodyText>
            </div>

            <div className="flex flex-col gap-5">
              <LabelText>More information</LabelText>
              <div className="w-8 h-px bg-vynl-gray-200" />
              <BodyText className="text-vynl-gray-600 leading-relaxed">
                Our{" "}
                <a href="/privacy-policy" className="underline">
                  Privacy Policy
                </a>{" "}
                explains how we handle personal information more generally.
              </BodyText>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
