import Link from "next/link";
import { InfoCallout, InfoPage, InfoSection } from "@/components/content/info-page";
import { infoPageMetadata } from "@/lib/seo/metadata";

export const metadata = infoPageMetadata({
  title: "Terms and Conditions",
  description:
    "The terms that apply when you use SYNTV RADIO, including acceptable use, third-party radio streams, intellectual property, and liability.",
  path: "/terms",
});

const sections = [
  { id: "acceptance", title: "Acceptance of these terms" },
  { id: "service", title: "The service" },
  { id: "radio-streams", title: "Radio streams and third parties" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "intellectual-property", title: "Intellectual property" },
  { id: "user-submissions", title: "Messages and submissions" },
  { id: "availability", title: "Availability and changes" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "liability", title: "Limitation of liability" },
  { id: "external-links", title: "External links and advertising" },
  { id: "copyright", title: "Copyright and content reports" },
  { id: "governing-law", title: "Governing law" },
  { id: "changes", title: "Changes to these terms" },
  { id: "contact", title: "Contact" },
];

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms and Conditions"
      description="These terms govern your use of SYNTV RADIO. By using the site, you agree to them. If you do not agree, please do not use the service."
      updated="Last updated: November 27, 2026"
      sections={sections}
      related={
        <div className="space-y-2 text-sm">
          <p className="font-display font-semibold text-foreground">Related pages</p>
          <p><Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link></p>
          <p><Link href="/disclaimer" className="text-primary hover:underline">Disclaimer</Link></p>
          <p><Link href="/contact" className="text-primary hover:underline">Report an issue</Link></p>
        </div>
      }
    >
      <InfoSection id="acceptance" title="Acceptance of these terms">
        <p>
          These Terms and Conditions (&ldquo;Terms&rdquo;) apply to the SYNTV RADIO website at{" "}
          <a href="https://syntv.online">https://syntv.online</a> and to the features made available through it. By
          accessing or using the site, you agree to these Terms and to our{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
        <p>
          If you use the site on behalf of an organization, you represent that you have authority to accept these
          Terms for that organization. If you do not agree, do not use the site.
        </p>
      </InfoSection>

      <InfoSection id="service" title="The service">
        <p>
          SYNTV RADIO is a free directory and web player for live online radio. It indexes station metadata supplied
          through the Radio Browser community directory and lets you search, browse, save, and play stations. The site
          is a discovery tool, not a broadcaster, record label, music licensing service, or emergency information
          service.
        </p>
        <p>
          You need a compatible browser and an internet connection. Mobile data, carrier charges, and device
          requirements are your responsibility. Some features, such as offline caching, installation, background
          playback, and lock-screen controls, depend on your browser and operating system.
        </p>
      </InfoSection>

      <InfoSection id="radio-streams" title="Radio streams and third parties">
        <p>
          The audio you hear is delivered by independent radio stations and stream providers. SYNTV RADIO does not
          host, operate, or control those streams. When you press Play, your browser connects directly to the
          provider&rsquo;s server.
        </p>
        <p>
          Station names, logos, programmes, music, news, and other content belong to their respective owners. SYNTV
          RADIO does not claim ownership of third-party station content and does not represent that it holds
          broadcasting, music, or performance licences for those streams.
        </p>
        <p>
          A station may be offline, geo-restricted, overloaded, mislabelled, or unavailable in your browser. A listing
          on SYNTV RADIO is not an endorsement of the station, its views, its advertisers, or the accuracy of its
          metadata.
        </p>
      </InfoSection>

      <InfoSection id="acceptable-use" title="Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the site in violation of applicable law or the rights of another person.</li>
          <li>Attempt to disrupt, overload, scrape at an abusive rate, or bypass rate limits or security controls.</li>
          <li>Introduce malware, automate fraudulent requests, or interfere with the player, APIs, or other users.</li>
          <li>Misrepresent your identity or authority when submitting a station-owner, copyright, or privacy request.</li>
          <li>Use the site to distribute unlawful, defamatory, or infringing material through contact forms or public issue links.</li>
          <li>Frame, mirror, or redistribute the site in a way that suggests SYNTV RADIO endorses or operates a third-party service.</li>
        </ul>
        <p>
          We may suspend or restrict access, remove content, or decline a submission when we reasonably believe these
          Terms or applicable law have been violated.
        </p>
      </InfoSection>

      <InfoSection id="intellectual-property" title="Intellectual property">
        <p>
          The SYNTV RADIO name, logo, site design, original editorial text, and software are owned by or licensed to
          the site operator and are protected by applicable intellectual-property laws. You may view and use the site
          for personal, non-commercial listening and discovery.
        </p>
        <p>
          You may not copy, modify, distribute, sell, or create derivative works from the site&rsquo;s original
          content or branding without prior written permission, except where applicable law allows it. Linking to
          public SYNTV RADIO pages is permitted.
        </p>
        <p>
          Third-party station names, logos, and content remain the property of their owners. Nothing in these Terms
          grants you a licence to use third-party content beyond what the owner permits.
        </p>
      </InfoSection>

      <InfoSection id="user-submissions" title="Messages and submissions">
        <p>
          If you submit a contact message, station report, copyright notice, or other communication, you confirm that
          the information is accurate to the best of your knowledge and that you have the right to share it. You grant
          us permission to review, store, and use the message as needed to respond, investigate, maintain records, or
          comply with law.
        </p>
        <p>
          Do not submit confidential information, passwords, payment card details, identity documents, or material
          you are not authorized to share. We may remove or disregard submissions that are abusive, misleading, or
          unrelated to the site.
        </p>
      </InfoSection>

      <InfoSection id="availability" title="Availability and changes">
        <p>
          The site is provided on an &ldquo;as available&rdquo; basis. We may add, change, suspend, or remove
          features, stations, pages, or APIs at any time. We do not guarantee uninterrupted availability, a particular
          station, a particular stream quality, or that a listing will remain online.
        </p>
        <p>
          We may also update these Terms. The &ldquo;Last updated&rdquo; date shows the current version. Continued use
          after a change means you accept the updated Terms to the extent permitted by law.
        </p>
      </InfoSection>

      <InfoSection id="disclaimers" title="Disclaimers">
        <p>
          To the fullest extent permitted by law, the site and its content are provided without warranties of any
          kind, whether express, implied, or statutory, including warranties of merchantability, fitness for a
          particular purpose, non-infringement, accuracy, and availability.
        </p>
        <p>
          SYNTV RADIO does not warrant that station metadata, stream addresses, listener counts, tags, languages, or
          country information are accurate or current. See the <Link href="/disclaimer">Disclaimer</Link> for more
          information about third-party streams and directory data.
        </p>
      </InfoSection>

      <InfoSection id="liability" title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, SYNTV RADIO and its operator will not be liable for indirect,
          incidental, special, consequential, exemplary, or punitive damages, or for loss of data, profits, goodwill,
          or business opportunity, arising from or related to your use of the site, third-party streams, external
          links, or inability to use the service.
        </p>
        <p>
          Where liability cannot be excluded, our aggregate liability arising from the site will not exceed the
          greater of the amount you paid to use the site (which is currently zero) or the minimum amount required by
          applicable law. Nothing in these Terms limits liability that cannot lawfully be limited.
        </p>
      </InfoSection>

      <InfoSection id="external-links" title="External links and advertising">
        <p>
          The site links to station websites, Radio Browser, GitHub, and other third-party resources. Those sites are
          not under our control, and their terms and privacy policies apply. A link does not imply endorsement.
        </p>
        <p>
          Advertising is not currently active. If ads are displayed in the future, they will be labelled as
          advertisements and kept separate from player and navigation controls. Advertisers are responsible for their
          own content and offers. SYNTV RADIO does not endorse products or services merely because an ad appears.
        </p>
        <InfoCallout title="No deceptive controls" tone="info">
          <p>
            Advertisements will never be presented as download buttons, play buttons, or other site controls. If you
            see an ad that appears deceptive, please report it through the contact form.
          </p>
        </InfoCallout>
      </InfoSection>

      <InfoSection id="copyright" title="Copyright and content reports">
        <p>
          If you own copyright or other rights in material that appears in a directory listing, use the{" "}
          <Link href="/contact">contact form</Link> and choose the copyright or content-removal topic. Include your
          name and contact details, the station name and SYNTV RADIO URL or station ID, the material you own, and a
          clear description of the requested action. If you are authorized to act for the rights holder, explain your
          authority.
        </p>
        <p>
          We can review and update or remove a directory listing. We do not control the station&rsquo;s independent
          stream, so a removal from SYNTV RADIO may not remove the stream from the station&rsquo;s own website or
          other directories. We may ask for additional information and may forward a report to the station or
          directory data source where appropriate.
        </p>
      </InfoSection>

      <InfoSection id="governing-law" title="Governing law">
        <p>
          These Terms are governed by the laws that apply to the site operator, without regard to conflict-of-laws
          rules, except where mandatory consumer-protection or privacy laws in your place of residence provide
          otherwise. Nothing in these Terms excludes rights that cannot be excluded under applicable law.
        </p>
        <p>
          Before starting a formal dispute, please contact us through the contact form so we can try to resolve the
          issue informally.
        </p>
      </InfoSection>

      <InfoSection id="changes" title="Changes to these terms">
        <p>
          We may revise these Terms to reflect changes to the site, legal requirements, or operational practices.
          The updated version will be posted on this page with a new date. Material changes will be communicated on
          the site where practicable.
        </p>
      </InfoSection>

      <InfoSection id="contact" title="Contact">
        <p>
          Questions about these Terms, station listings, copyright, or privacy can be sent through the{" "}
          <Link href="/contact">contact form</Link>. For non-sensitive technical reports, the public GitHub issue
          tracker linked from that page is also available.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
