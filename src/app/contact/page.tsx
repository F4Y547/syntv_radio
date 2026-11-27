import Link from "next/link";
import { InfoCallout, InfoPage, InfoSection } from "@/components/content/info-page";
import { infoPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";
import { ContactForm } from "./contact-form";

export const instant = false;

export const metadata = infoPageMetadata({
  title: "Contact SYNTV RADIO",
  description:
    "Contact SYNTV RADIO about technical support, station listings, copyright or content removal, privacy requests, or advertising. Use the validated contact form.",
  path: "/contact",
});

const sections = [
  { id: "form", title: "Send a message" },
  { id: "what-to-include", title: "What to include" },
  { id: "copyright", title: "Copyright and content removal" },
  { id: "station-owners", title: "Station owners" },
  { id: "technical", title: "Technical support" },
  { id: "privacy", title: "Privacy requests" },
  { id: "advertising", title: "Advertising and partnerships" },
  { id: "other-channels", title: "Other contact channels" },
];

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact SYNTV RADIO",
  url: absoluteUrl("/contact"),
  description:
    "Contact form for technical support, station-owner requests, copyright reports, privacy requests, and general questions.",
  isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
  mainEntity: {
    "@type": "Organization",
    name: siteName,
    email: "hello@syntv.online",
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "hello@syntv.online",
        contactType: "customer support",
        availableLanguage: ["English"],
        url: absoluteUrl("/contact"),
      },
    ],
  },
};

interface Props {
  searchParams: Promise<{ topic?: string | string[]; station?: string | string[] }>;
}

export default async function ContactPage({ searchParams }: Props) {
  const params = await searchParams;
  const topic = typeof params.topic === "string" ? params.topic.slice(0, 40) : undefined;
  const station = typeof params.station === "string" ? params.station.slice(0, 200) : "";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      <InfoPage
        eyebrow="Contact"
        title="Talk to SYNTV RADIO"
        description="Use this form for technical support, station-owner requests, copyright or content-removal reports, privacy questions, and general feedback. Messages are reviewed by the site operator."
        sections={sections}
        related={
          <div className="space-y-2 text-sm">
            <p className="font-display font-semibold text-foreground">Before you write</p>
            <p><Link href="/faq" className="text-primary hover:underline">Read the FAQ</Link></p>
            <p><Link href="/disclaimer" className="text-primary hover:underline">How listings work</Link></p>
            <p><Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link></p>
            <p><Link href="/terms" className="text-primary hover:underline">Terms and Conditions</Link></p>
          </div>
        }
      >
        <InfoSection id="form" title="Send a message">
          <InfoCallout title="Official contact channel" tone="info">
            <p>
              The form below is the primary contact channel. The official SYNTV RADIO email address is{" "}
              <a href="mailto:hello@syntv.online" className="text-primary hover:underline">hello@syntv.online</a>.
              Delivery depends on the configured email provider and domain verification; do not assume mailbox delivery
              until provider/DNS verification is confirmed. SYNTV RADIO does not publish a phone number, postal address,
              or company registration number. For non-sensitive technical reports, a public GitHub issue tracker is also
              available.
            </p>
          </InfoCallout>
          <div className="pt-2">
            <ContactForm initialTopic={topic} initialStation={station} />
          </div>
        </InfoSection>

        <InfoSection id="what-to-include" title="What to include">
          <ul>
            <li><strong>General questions:</strong> the page or feature you are asking about.</li>
            <li><strong>Technical support:</strong> the URL, station name, browser, device, and what you expected versus what happened.</li>
            <li><strong>Station reports:</strong> the station name and its SYNTV RADIO page URL or station ID.</li>
            <li><strong>Copyright or content removal:</strong> the material involved, the listing, your relationship to the rights, and the action requested.</li>
            <li><strong>Privacy requests:</strong> the right you want to exercise and the browser or device involved. Do not send identity documents in the first message.</li>
          </ul>
          <p>
            We cannot guarantee a specific response time. Incomplete or duplicate reports may take longer to review.
            Please do not send the same message repeatedly; the form is rate-limited.
          </p>
        </InfoSection>

        <InfoSection id="copyright" title="Copyright and content removal">
          <p>
            SYNTV RADIO indexes third-party radio listings. If you believe a listing infringes your copyright or other
            rights, use the form and choose the copyright or content-removal topic. Include:
          </p>
          <ul>
            <li>Your name, organization if applicable, and a reliable reply email.</li>
            <li>The station name and the SYNTV RADIO URL or station ID.</li>
            <li>A description of the copyrighted work or other material you believe is affected.</li>
            <li>The specific listing element you want reviewed, such as a name, logo, description, or link.</li>
            <li>A statement that you have a good-faith belief the use is not authorized, and that the information you provided is accurate.</li>
            <li>If you act for a rights holder, a description of your authority.</li>
          </ul>
          <p>
            We can review and update or remove a directory listing. We do not host or control the station&rsquo;s
            independent stream, so removing a listing from SYNTV RADIO will not remove the stream from the
            station&rsquo;s own website or other directories. We may ask for more information and may forward a report
            to the station or directory data source where appropriate.
          </p>
          <InfoCallout title="Do not send confidential material first" tone="warning">
            <p>
              Describe the material and the listing before sending identity documents or confidential agreements. We
              will ask for verification if it is needed.
            </p>
          </InfoCallout>
        </InfoSection>

        <InfoSection id="station-owners" title="Station owners">
          <p>
            Station owners and authorized representatives can ask for a listing to be corrected, updated, or removed.
            Include the station name, the SYNTV RADIO URL or station ID, and the change you want. If your station has
            moved to a new stream address or website, include the new public details and, where possible, a link from
            the station&rsquo;s official domain confirming the change.
          </p>
          <p>
            SYNTV RADIO is a directory, not the station&rsquo;s broadcaster or hosting provider. We cannot change a
            stream, restore a station&rsquo;s server, or provide audience ratings.
          </p>
        </InfoSection>

        <InfoSection id="technical" title="Technical support">
          <p>To help us reproduce a problem, include:</p>
          <ul>
            <li>The exact page URL and, if relevant, the station name or ID.</li>
            <li>Your browser and version, operating system, and whether you are on desktop or mobile.</li>
            <li>Whether the issue happens on every station or one station.</li>
            <li>Any visible error message and the approximate time of the problem.</li>
            <li>Whether you use a content blocker, VPN, private network, or restricted corporate network.</li>
          </ul>
          <p>
            Do not include passwords, authentication tokens, payment information, or private network details.
            Non-sensitive technical reports can also be filed in the{" "}
            <a href="https://github.com/F4Y547/syntv_radio/issues" target="_blank" rel="noopener noreferrer">
              public GitHub issue tracker
            </a>
            .
          </p>
        </InfoSection>

        <InfoSection id="privacy" title="Privacy requests">
          <p>
            To ask about access, correction, deletion, or another privacy right, choose the privacy topic and describe
            the request. Many preferences exist only in your browser; clearing site data for syntv.online is often the
            fastest way to remove local favorites, collections, theme, language, consent, and listening statistics.
          </p>
          <p>
            Server-side listener sessions use random identifiers and expire automatically. We may not be able to match
            an expired session to a person. We may ask for information needed to verify a request, but we will not ask
            you to send a government ID in the first message.
          </p>
        </InfoSection>

        <InfoSection id="advertising" title="Advertising and partnerships">
          <p>
            Advertising is not currently active. For advertising, sponsorship, or partnership questions, choose the
            advertising topic and explain the proposed product, audience, and placement. SYNTV RADIO does not sell
            station rankings or present paid placements as editorial recommendations.
          </p>
        </InfoSection>

        <InfoSection id="other-channels" title="Other contact channels">
          <p>
            The public GitHub repository at{" "}
            <a href="https://github.com/F4Y547/syntv_radio" target="_blank" rel="noopener noreferrer">
              github.com/F4Y547/syntv_radio
            </a>{" "}
            is available for non-sensitive technical issues and public documentation. GitHub&rsquo;s terms and privacy
            policy apply. Do not use a public issue for personal data, confidential copyright material, or security
            vulnerabilities. For a security concern, use the contact form and ask for a private follow-up without
            including exploit details in the first message.
          </p>
        </InfoSection>
      </InfoPage>
    </>
  );
}
