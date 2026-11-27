import Link from "next/link";
import { InfoCallout, InfoPage, InfoSection } from "@/components/content/info-page";
import { infoPageMetadata } from "@/lib/seo/metadata";


export const metadata = infoPageMetadata({
  title: "Privacy Policy",
  description:
    "How SYNTV RADIO handles browser storage, anonymous listener counts, contact messages, hosting logs, third-party radio streams, and future advertising.",
  path: "/privacy-policy",
});

const sections = [
  { id: "overview", title: "Overview" },
  { id: "information-you-provide", title: "Information you provide" },
  { id: "automatic-information", title: "Information processed automatically" },
  { id: "local-storage", title: "Browser storage" },
  { id: "cookies", title: "Cookies and similar technologies" },
  { id: "advertising", title: "Advertising and Google AdSense" },
  { id: "third-parties", title: "Third-party services" },
  { id: "analytics", title: "Analytics and listener counts" },
  { id: "retention", title: "Data retention" },
  { id: "rights", title: "Your privacy rights" },
  { id: "children", title: "Children" },
  { id: "international", title: "International processing" },
  { id: "security", title: "Security" },
  { id: "changes", title: "Policy changes" },
  { id: "contact", title: "Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="This policy explains what SYNTV RADIO processes when you use the site, what stays in your browser, and the choices available to you."
      updated="Last updated: November 27, 2026"
      sections={sections}
      related={
        <div className="space-y-2 text-sm">
          <p className="font-display font-semibold text-foreground">Related pages</p>
          <p><Link href="/terms" className="text-primary hover:underline">Terms and Conditions</Link></p>
          <p><Link href="/disclaimer" className="text-primary hover:underline">Disclaimer</Link></p>
          <p><Link href="/contact" className="text-primary hover:underline">Contact &amp; privacy requests</Link></p>
        </div>
      }
    >
      <InfoSection id="overview" title="Overview">
        <p>
          SYNTV RADIO (&ldquo;SYNTV RADIO&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is an
          independent online radio discovery and listening website available at{" "}
          <a href="https://syntv.online">https://syntv.online</a>. This policy describes the data practices of the
          website itself. It does not describe the practices of the independent radio stations, stream providers,
          hosting providers, or advertising partners that we link to or use.
        </p>
        <p>
          You do not need an account to use SYNTV RADIO. We do not ask for your name, postal address, telephone
          number, or precise location in order to listen.
        </p>
      </InfoSection>

      <InfoSection id="information-you-provide" title="Information you provide">
        <p>
          <strong>Contact form.</strong> The contact form asks for an email address, a topic, a message, and
          optionally your name and a station name or URL. We use those details only to review and respond to your
          message, including station-owner, copyright, privacy, and technical reports.
        </p>
        <p>
          When delivery is configured, the message is transmitted to the site operator through a configured email
          provider or webhook. That provider may process and retain the message under its own privacy policy. If the
          form is not configured to deliver messages, it displays an error and does not store the message. If delivery
          is configured but notification fails after the message is saved, SYNTV RADIO may retain the message for
          operator review and will show a clear notice in the form.
        </p>
        <p>
          Contact submissions stored for operator review may include submission metadata such as timestamp, sender IP
          address, and browser user-agent when available, to support abuse prevention, troubleshooting, and audit
          history. This metadata is visible only to authorized administrators.
        </p>
        <p>
          <strong>Public GitHub issues.</strong> The site links to a public GitHub issue tracker for non-sensitive
          technical reports. Anything you post there is public and is governed by GitHub&rsquo;s policies. Do not post
          private information, identity documents, or confidential copyright material in a public issue.
        </p>
        <p>
          <strong>No accounts or payments.</strong> SYNTV RADIO does not currently offer user accounts, subscriptions,
          or payments. We do not knowingly collect payment card information through the site.
        </p>
      </InfoSection>

      <InfoSection id="automatic-information" title="Information processed automatically">
        <p>
          Like most websites, SYNTV RADIO and its hosting provider process technical information needed to deliver
          pages and protect the service. This can include your IP address, browser type and user-agent string,
          requested URL, referring page, approximate region derived from network data, timestamps, and error or
          performance diagnostics.
        </p>
        <p>
          The site is hosted on Vercel. Vercel may process request logs, security events, and delivery diagnostics as
          part of providing hosting. We do not currently use Vercel Analytics or Speed Insights in the application
          code. Vercel&rsquo;s own privacy policy applies to its platform processing.
        </p>
        <p>
          <strong>Rate limiting.</strong> Listener-count, playback-session, analytics, and contact endpoints use
          short-lived, in-memory rate-limit counters keyed by IP address to prevent abuse. These counters are not a
          user profile and are not written to our listener analytics store. They reset automatically. Standard
          hosting logs may retain request information for a longer period under the hosting provider&rsquo;s settings.
        </p>
        <p>
          <strong>Search terms.</strong> Search text is sent to our station API and forwarded to the Radio Browser
          directory to return results. Search terms may appear in standard server or hosting logs. Do not enter
          sensitive personal information into the search box.
        </p>
      </InfoSection>

      <InfoSection id="local-storage" title="Browser storage">
        <p>
          SYNTV RADIO stores preferences and small pieces of state in your browser so the player and library work
          without an account. This information stays on your device unless your browser or device syncs it. You can
          remove it by clearing site data for syntv.online in your browser settings.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-foreground">
                <th className="py-2 pr-3 font-semibold">Storage key</th>
                <th className="py-2 pr-3 font-semibold">Type</th>
                <th className="py-2 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:favorites</td><td className="py-2 pr-3">localStorage</td><td className="py-2">Stations you save.</td></tr>
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:recents</td><td className="py-2 pr-3">localStorage</td><td className="py-2">Recently played stations.</td></tr>
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:volume</td><td className="py-2 pr-3">localStorage</td><td className="py-2">Player volume.</td></tr>
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:collections</td><td className="py-2 pr-3">localStorage</td><td className="py-2">Collections you create.</td></tr>
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:listening-stats</td><td className="py-2 pr-3">localStorage</td><td className="py-2">Local listening time and session totals.</td></tr>
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:locale</td><td className="py-2 pr-3">localStorage</td><td className="py-2">Your language choice.</td></tr>
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:theme</td><td className="py-2 pr-3">localStorage</td><td className="py-2">Dark or light appearance.</td></tr>
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:consent:v1</td><td className="py-2 pr-3">localStorage</td><td className="py-2">Your privacy choices and the date they were saved.</td></tr>
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:listener-session-id</td><td className="py-2 pr-3">sessionStorage</td><td className="py-2">A random, tab-scoped identifier used to register an anonymous playback session for live listener counts.</td></tr>
              <tr><td className="py-2 pr-3 font-mono text-[11px]">syntv-radio:listener-admin-token</td><td className="py-2 pr-3">sessionStorage</td><td className="py-2">Only if a site administrator opens the protected listener analytics page; stores the admin token for that tab.</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          The service worker also uses your browser&rsquo;s Cache Storage to keep the offline page and a small set of
          static assets available. Cached files are replaced when the cache version changes and can be removed by
          clearing site data.
        </p>
        <p>
          <strong>Global Privacy Control and Do Not Track.</strong> If your browser sends a Global Privacy Control or
          Do Not Track signal, optional analytics and advertising choices are forced off and cannot be enabled from
          that browser. The site still uses necessary storage to function.
        </p>
      </InfoSection>

      <InfoSection id="cookies" title="Cookies and similar technologies">
        <p>
          SYNTV RADIO&rsquo;s application code does not currently set first-party advertising or analytics cookies.
          The site uses browser local storage, session storage, and cache storage as described above. Our hosting
          provider may use strictly necessary cookies or similar technology for security, load balancing, or
          delivery.
        </p>
        <p>
          When you play a station, your browser connects directly to that station&rsquo;s stream server. The stream
          provider may set its own cookies or process your IP address and user-agent under its own policy. Station
          logos are loaded from third-party URLs supplied by the directory; those servers may also receive your IP
          address and request headers. SYNTV RADIO does not control those third-party technologies.
        </p>
      </InfoSection>

      <InfoSection id="advertising" title="Advertising and Google AdSense">
        <p>
          Advertising is <strong>not currently active</strong> on SYNTV RADIO. The site is technically prepared for
          Google AdSense using publisher ID <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[12px]">ca-pub-6652257842391620</code>.
          No AdSense library or ad unit is loaded unless the site owner enables advertising and the visitor grants
          the optional advertising choice.
        </p>
        <p>
          If advertising is enabled, Google and its advertising partners may use cookies, local storage, device
          identifiers, IP address, and approximate location to serve personalized or non-personalized ads, measure ad
          performance, limit repetition, and prevent fraud. Personalized advertising may involve profiling based on
          your activity across sites. Non-personalized advertising may still use limited data for frequency capping,
          aggregate reporting, and fraud prevention.
        </p>
        <p>
          Where required, we will request consent before using optional advertising technologies. Visitors in the
          European Economic Area, the United Kingdom, and Switzerland may require a Google-certified consent
          management platform (CMP) configured through the AdSense account. The first-party privacy banner on this
          site is a transparency and choice notice; it is not a claim that a custom banner satisfies every regional
          certification requirement. The site owner must configure the applicable Google-certified CMP before ads are
          served in those regions.
        </p>
        <p>
          You can learn more from{" "}
          <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer" target="_blank">
            Google&rsquo;s advertising technologies information
          </a>{" "}
          and{" "}
          <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">
            Google&rsquo;s Privacy Policy
          </a>
          . You can change your SYNTV RADIO choice at any time using <strong>Cookie preferences</strong> in the footer.
        </p>
        <InfoCallout title="Current status" tone="info">
          <p>
            No advertising scripts are loaded today. The consent choices are stored so the site can respect your
            preference if advertising is activated later.
          </p>
        </InfoCallout>
      </InfoSection>

      <InfoSection id="third-parties" title="Third-party services">
        <ul>
          <li>
            <strong>Radio Browser.</strong> Station names, tags, countries, languages, logos, and stream addresses come
            from the community-run Radio Browser directory. Our server requests directory data from Radio Browser;
            your browser is not required to contact Radio Browser directly.
          </li>
          <li>
            <strong>Radio stations and stream hosts.</strong> Playback connects your browser directly to the selected
            station&rsquo;s stream provider. Those providers receive your IP address and request information and may
            use their own cookies or logs.
          </li>
          <li>
            <strong>Vercel.</strong> Hosting, delivery, security, and platform logging.
          </li>
          <li>
            <strong>Redis-compatible store.</strong> If the site owner configures <code>REDIS_URL</code>, anonymous
            listener sessions and aggregate listener analytics are stored in that shared store. Without it, the site
            uses process memory for development or single-instance operation.
          </li>
          <li>
            <strong>Contact delivery provider.</strong> If the owner configures an email provider or webhook, contact
            form submissions are transmitted through that service.
          </li>
          <li>
            <strong>GitHub.</strong> If you follow a repository or issue link, GitHub processes the request under its
            own policy.
          </li>
        </ul>
        <p>
          These services may process data in countries other than yours. Their own privacy policies and terms apply
          to their processing.
        </p>
      </InfoSection>

      <InfoSection id="analytics" title="Analytics and listener counts">
        <p>
          SYNTV RADIO does not currently use Google Analytics or another third-party analytics product. The site does
          operate its own listener-count feature so visitors can see how many active SYNTV RADIO playback sessions
          exist.
        </p>
        <p>
          When playback starts, the browser generates a random session identifier and sends it with the station ID to
          our listener API. Heartbeats update the session while playback continues. The identifier is stored in{" "}
          <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[12px]">sessionStorage</code> for the tab
          and is not derived from your identity. The listener store contains the random session ID, station ID,
          timestamps, and expiry. It does not contain your email address or account details.
        </p>
        <p>
          Listener counts reflect playback sessions registered on SYNTV RADIO. They are not a station&rsquo;s global
          audience, official ratings, or a count of listeners on other platforms.
        </p>
        <p>
          The protected analytics dashboard is intended for the site operator. It may show aggregate counts, peak
          concurrency, top stations, daily trends, and average session duration. It does not display individual
          visitor identities.
        </p>
      </InfoSection>

      <InfoSection id="retention" title="Data retention">
        <ul>
          <li>
            <strong>Browser storage:</strong> remains until you clear site data or your browser removes it.
          </li>
          <li>
            <strong>Listener sessions:</strong> expire automatically after a short period without a heartbeat. The
            default expiry is 90 seconds and is configurable between 30 and 300 seconds.
          </li>
          <li>
            <strong>Listener analytics:</strong> when the shared store is configured, daily aggregates are kept for
            up to 45 days, minute-level snapshots for up to 24 hours, and summary counters until the owner resets or
            deletes them. The in-memory fallback resets when the server process restarts.
          </li>
          <li>
            <strong>Rate-limit counters:</strong> short-lived and automatically reset.
          </li>
          <li>
            <strong>Contact messages:</strong> retained by the site operator or configured delivery provider only as
            long as needed to review and respond, resolve the report, or meet legal obligations.
          </li>
          <li>
            <strong>Hosting logs:</strong> retained according to the hosting provider&rsquo;s settings and policies.
          </li>
        </ul>
      </InfoSection>

      <InfoSection id="rights" title="Your privacy rights">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, or receive a copy of personal
          information; to object to or restrict certain processing; to withdraw consent; and to appeal or complain to
          a supervisory authority. You may also have the right not to receive discriminatory treatment for exercising
          a privacy right.
        </p>
        <p>
          SYNTV RADIO does not currently sell personal information or share it for cross-context behavioral
          advertising. If that changes, this policy and the available choices will be updated before the change takes
          effect.
        </p>
        <p>
          To make a request, use the <Link href="/contact">contact form</Link> and choose the privacy topic. Describe
          the request and the browser or device involved. We may need to verify your identity or ask for enough
          information to locate the relevant records. Do not include government identification numbers or other
          sensitive documents in the first message.
        </p>
        <p>
          Because many preferences are stored only in your browser, clearing site data is often the fastest way to
          remove them. Server-side listener records use random session identifiers and may expire before a request can
          be matched to them.
        </p>
      </InfoSection>

      <InfoSection id="children" title="Children">
        <p>
          SYNTV RADIO is a general-audience radio directory and is not directed to children under 13. We do not
          knowingly collect personal information from children through accounts because the site does not offer
          accounts. If you believe a child submitted personal information through the contact form, use the contact
          form to ask us to review and delete it.
        </p>
      </InfoSection>

      <InfoSection id="international" title="International processing">
        <p>
          SYNTV RADIO is available worldwide. Our hosting provider, infrastructure providers, and contact delivery
          provider may process technical information in the United States or other countries. Where required, we rely
          on appropriate safeguards for international transfers. Third-party stations and stream hosts process data
          under their own policies and may be located anywhere.
        </p>
      </InfoSection>

      <InfoSection id="security" title="Security">
        <p>
          We use HTTPS, restricted administrative access, short-lived listener sessions, rate limiting, and
          server-side validation to reduce risk. No internet service can guarantee absolute security. Please do not
          send passwords, payment card data, identity documents, or other sensitive information through the contact
          form.
        </p>
      </InfoSection>

      <InfoSection id="changes" title="Policy changes">
        <p>
          We may update this policy as the site or legal requirements change. The &ldquo;Last updated&rdquo; date at
          the top of the page shows the latest revision. If a change materially affects how we use personal
          information, we will provide a prominent notice on the site before the change takes effect where
          practicable.
        </p>
      </InfoSection>

      <InfoSection id="contact" title="Contact">
        <p>
          Use the <Link href="/contact">contact form</Link> for privacy questions, deletion requests, station-owner
          reports, copyright concerns, and technical support. Select the topic that best matches your request so it can
          be routed appropriately. For non-sensitive technical reports, the public GitHub issue tracker linked from
          the contact page is also available.
        </p>
        <p>
          This policy is provided for transparency. It is not legal advice, and it does not create rights beyond those
          provided by applicable law.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
