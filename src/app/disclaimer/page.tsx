import Link from "next/link";
import { InfoCallout, InfoPage, InfoSection } from "@/components/content/info-page";
import { infoPageMetadata } from "@/lib/seo/metadata";

export const metadata = infoPageMetadata({
  title: "Disclaimer",
  description:
    "SYNTV RADIO is a radio discovery directory. Read about third-party streams, station ownership, metadata accuracy, availability, and content reporting.",
  path: "/disclaimer",
});

const sections = [
  { id: "directory", title: "A directory, not a broadcaster" },
  { id: "ownership", title: "Station ownership and content" },
  { id: "availability", title: "Stream availability" },
  { id: "accuracy", title: "Metadata accuracy" },
  { id: "external-links", title: "External links" },
  { id: "no-advice", title: "No professional advice" },
  { id: "copyright", title: "Copyright and content reports" },
  { id: "advertising", title: "Advertising" },
  { id: "liability", title: "Liability" },
  { id: "contact", title: "Contact" },
];

export default function DisclaimerPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Disclaimer"
      description="SYNTV RADIO helps you discover live radio that is operated by independent third parties. This page explains what that means for availability, ownership, and accuracy."
      updated="Last updated: November 27, 2026"
      sections={sections}
      related={
        <div className="space-y-2 text-sm">
          <p className="font-display font-semibold text-foreground">Related pages</p>
          <p><Link href="/terms" className="text-primary hover:underline">Terms and Conditions</Link></p>
          <p><Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link></p>
          <p><Link href="/contact" className="text-primary hover:underline">Report a listing</Link></p>
        </div>
      }
    >
      <InfoSection id="directory" title="A directory, not a broadcaster">
        <p>
          SYNTV RADIO is a radio discovery and streaming directory. We index publicly available station metadata and
          provide a web player that connects your browser to a station&rsquo;s own stream. We do not operate the
          stations, produce their programmes, or transmit their audio from our own servers.
        </p>
        <p>
          A listing on SYNTV RADIO is not an endorsement of a station, its presenters, its advertisers, its music, or
          any view expressed on air.
        </p>
      </InfoSection>

      <InfoSection id="ownership" title="Station ownership and content">
        <p>
          Station names, logos, programmes, music, news, trademarks, and other content belong to their respective
          owners. SYNTV RADIO does not claim ownership of third-party station content unless a specific page clearly
          says otherwise. We do not represent that we hold broadcasting, music, performance, or other licences for
          third-party streams.
        </p>
        <p>
          Some station logos are loaded directly from URLs supplied by the Radio Browser directory. If a logo is
          missing, outdated, or used incorrectly, the station owner or rights holder can ask us to update or remove
          the listing.
        </p>
      </InfoSection>

      <InfoSection id="availability" title="Stream availability">
        <p>
          External streams can become unavailable at any time. A stream may be offline, overloaded, geo-restricted,
          moved to a new address, or encoded in a format your browser cannot play. Availability can also change
          without notice because of maintenance, licensing changes, or technical problems at the station.
        </p>
        <p>
          SYNTV RADIO does not guarantee that any station will play, that a stream will remain online, or that audio
          quality will meet a particular standard. If a station does not play, try another listing and consider
          reporting the problem so the directory can be reviewed.
        </p>
      </InfoSection>

      <InfoSection id="accuracy" title="Metadata accuracy">
        <p>
          Station information is supplied through the Radio Browser community directory and other public sources. It
          can be incomplete, outdated, duplicated, or incorrect. Tags are community-maintained and may be broad,
          missing, or applied inconsistently. Country, language, bitrate, codec, and online status are not guaranteed.
        </p>
        <p>
          Listener counts shown on SYNTV RADIO refer only to active playback sessions registered on this site. They are
          not the station&rsquo;s global audience, official ratings, or a count of listeners on other platforms.
          Directory click counts are not listener counts.
        </p>
      </InfoSection>

      <InfoSection id="external-links" title="External links">
        <p>
          The site links to station websites, Radio Browser, GitHub, and other third-party resources. We do not
          control those sites and are not responsible for their content, availability, security, or privacy
          practices. Their terms and policies apply when you visit them.
        </p>
      </InfoSection>

      <InfoSection id="no-advice" title="No professional advice">
        <p>
          Content on SYNTV RADIO is provided for general information and entertainment. It is not legal, financial,
          medical, safety, emergency, or professional advice. Do not rely on a radio stream for emergency information.
          Use official local sources for emergencies and critical updates.
        </p>
      </InfoSection>

      <InfoSection id="copyright" title="Copyright and content reports">
        <p>
          If you believe a directory listing infringes your copyright or other rights, use the{" "}
          <Link href="/contact">contact form</Link> and choose the copyright or content-removal topic. Include the
          station name, its SYNTV RADIO URL or station ID, a description of the material, and the action you request.
          If you are acting for a rights holder, explain your authority.
        </p>
        <p>
          We can review and update or remove a listing from SYNTV RADIO. We cannot remove content from a
          station&rsquo;s independent stream or from other directories. We may ask for additional information and may
          forward a report to the station or data source where appropriate.
        </p>
        <InfoCallout title="What to include" tone="warning">
          <p>
            Please include enough detail to identify the listing and the rights involved. Do not send identity
            documents or confidential material in a first message; we will ask if verification is needed.
          </p>
        </InfoCallout>
      </InfoSection>

      <InfoSection id="advertising" title="Advertising">
        <p>
          Advertising is not currently active. If advertising is enabled in the future, ads will be labelled and kept
          separate from playback and navigation controls. Advertisers are responsible for their own claims, products,
          and services. An advertisement does not constitute an endorsement by SYNTV RADIO.
        </p>
      </InfoSection>

      <InfoSection id="liability" title="Liability">
        <p>
          The site is provided on an &ldquo;as available&rdquo; basis. To the fullest extent permitted by law, SYNTV
          RADIO is not liable for losses arising from third-party streams, unavailable stations, inaccurate metadata,
          external links, or your use of the site. The <Link href="/terms">Terms and Conditions</Link> contain the
          full liability provisions.
        </p>
      </InfoSection>

      <InfoSection id="contact" title="Contact">
        <p>
          To report an unavailable station, incorrect metadata, a copyright concern, or another issue, use the{" "}
          <Link href="/contact">contact form</Link>. For non-sensitive technical reports, you can also use the public
          GitHub issue tracker linked from that page.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
