import Link from "next/link";
import { FaqList } from "@/components/content/faq-list";
import { InfoPage, InfoSection } from "@/components/content/info-page";
import { faqItems } from "@/lib/content/faq";
import { infoPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";

export const metadata = infoPageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers about listening to SYNTV RADIO, mobile playback, favorites, unavailable streams, station ownership, privacy, and reporting an issue.",
  path: "/faq",
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  name: "SYNTV RADIO Frequently Asked Questions",
  url: absoluteUrl("/faq"),
  isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <InfoPage
        eyebrow="Help"
        title="Frequently asked questions"
        description="Quick answers about listening, stations, privacy, and reporting a problem. These answers describe what SYNTV RADIO actually does today."
        sections={[{ id: "questions", title: "Common questions" }]}
        related={
          <div className="space-y-2 text-sm">
            <p className="font-display font-semibold text-foreground">Need more help?</p>
            <p><Link href="/contact" className="text-primary hover:underline">Contact us</Link></p>
            <p><Link href="/about" className="text-primary hover:underline">About SYNTV RADIO</Link></p>
            <p><Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link></p>
            <p><Link href="/disclaimer" className="text-primary hover:underline">Disclaimer</Link></p>
          </div>
        }
      >
        <InfoSection id="questions" title="Common questions">
          <FaqList showContactLink />
        </InfoSection>
      </InfoPage>
    </>
  );
}
