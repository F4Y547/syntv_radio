import Link from "next/link";
import { InfoCallout, InfoPage, InfoSection } from "@/components/content/info-page";
import { getPolicyContactEmail } from "@/lib/contact/public-email";
import { infoPageMetadata } from "@/lib/seo/metadata";

export const metadata = infoPageMetadata({
  title: "Submit or Correct a Radio Station",
  description:
    "How to submit a station, correct a listing, or ask for a stream to be removed from the SYNTV RADIO directory. Station records come from the community-run Radio Browser directory.",
  path: "/submit",
});

const sections = [
  { id: "how-directory-works", title: "How station listings work" },
  { id: "new-station", title: "Suggesting a new station" },
  { id: "corrections", title: "Correcting or removing a listing" },
  { id: "what-to-send", title: "What to include" },
  { id: "what-we-cannot-do", title: "What we cannot change" },
];

export default function SubmitStationPage() {
  const policyEmail = getPolicyContactEmail();
  return (
    <InfoPage
      eyebrow="Directory"
      title="Submit or correct a radio station"
      description="SYNTV RADIO does not maintain its own station registry. Learn how to suggest a station, correct metadata, or request removal of a listing or stream URL."
      updated="Last updated: November 27, 2026"
      sections={sections}
      related={
        <div className="space-y-2 text-sm">
          <p className="font-display font-semibold text-foreground">Related pages</p>
          <p><Link href="/contact?topic=station-owner" className="text-primary hover:underline">Station-owner contact form</Link></p>
          <p><Link href="/terms#dmca" className="text-primary hover:underline">DMCA / removal process</Link></p>
          <p><Link href="/disclaimer" className="text-primary hover:underline">How listings work</Link></p>
          <p><Link href="/guides" className="text-primary hover:underline">Radio guides</Link></p>
        </div>
      }
    >
      <InfoSection id="how-directory-works" title="How station listings work">
        <p>
          Station names, stream addresses, flags, languages, tags, and logos come from the community-run{" "}
          <a href="https://www.radio-browser.info/" rel="noopener noreferrer" target="_blank">
            Radio Browser
          </a>{" "}
          directory. SYNTV RADIO reads that public metadata through server routes, cleans the labels, and organizes it
          into country, genre, and station pages. We do not create, own, or host the station records themselves.
        </p>
        <p>
          Because the source is community-maintained, a station may appear under more than one tag, or its details may be
          out of date. If you own a station or represent a rights holder, the fastest route is the contact form below.
        </p>
      </InfoSection>

      <InfoSection id="new-station" title="Suggesting a new station">
        <p>
          If your station is not listed, first check whether it already appears in{" "}
          <Link href="/stations">the station directory</Link> or on the{" "}
          <a href="https://www.radio-browser.info/" rel="noopener noreferrer" target="_blank">
            Radio Browser website
          </a>
          . Community contributors can add stations directly to that directory using its published process; SYNTV RADIO
          picks up public listings on its normal refresh cycle.
        </p>
        <p>
          You can also send us the station&rsquo;s public name, homepage, direct stream URL, country, language, and
          genre tags using the <Link href="/contact?topic=station-owner">station-owner form</Link>. We will review the
          details and may point you to the correct place to submit the record. We cannot promise that a third-party
          directory will accept every submission.
        </p>
        <InfoCallout title="Public streams only" tone="info">
          <p>
            Only suggest streams the broadcaster has made publicly available. Do not submit private, password-protected,
            or unlicensed rebroadcasts of another station&rsquo;s audio.
          </p>
        </InfoCallout>
      </InfoSection>

      <InfoSection id="corrections" title="Correcting or removing a listing">
        <p>
          Use the <Link href="/contact?topic=station-owner">station-owner form</Link> or email{" "}
          <a href={`mailto:${policyEmail}`}>{policyEmail}</a> if a name, logo, country, tag, homepage, or stream address
          is wrong; if a station has moved; or if you want a listing removed. Choose the copyright topic for rights and{" "}
          <Link href="/terms#dmca">DMCA / stream-removal requests</Link>.
        </p>
        <p>
          Include the SYNTV RADIO page URL or station ID, the exact field you want changed, and a public source that
          confirms the correction where possible. We may ask for proof of authority before updating ownership-related
          details.
        </p>
      </InfoSection>

      <InfoSection id="what-to-send" title="What to include">
        <ul>
          <li><strong>Station name and ID/URL:</strong> the listing on SYNTV RADIO, not just a search term.</li>
          <li><strong>Type of request:</strong> new listing, metadata correction, stream change, or removal.</li>
          <li><strong>Public details:</strong> homepage, direct stream URL, country, language, and tags.</li>
          <li><strong>Your relationship:</strong> owner, authorized representative, listener, or rights holder.</li>
          <li><strong>Evidence:</strong> a link from the station&rsquo;s official site for material changes.</li>
        </ul>
        <p>
          Please do not include passwords, private keys, or confidential agreements in the first message.
        </p>
      </InfoSection>

      <InfoSection id="what-we-cannot-do" title="What we cannot change">
        <p>
          SYNTV RADIO is a directory and web player. We cannot repair a station&rsquo;s stream server, guarantee
          availability, provide audience figures, or change records in the upstream directory on demand. Removing a
          listing here also does not remove the stream from the station&rsquo;s own website or from other services.
        </p>
        <p>
          Listings are reviewed by the site operator. We may decline requests that are abusive, unverifiable, or
          contrary to applicable law.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
