import Link from "next/link";
import { Globe2, Heart, Search, Smartphone } from "lucide-react";
import { InfoCallout, InfoPage, InfoSection } from "@/components/content/info-page";
import { infoPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";

export const metadata = infoPageMetadata({
  title: "About SYNTV RADIO",
  description:
    "Learn how SYNTV RADIO helps listeners discover live radio by country and genre, how the directory works, and what the project does and does not own.",
  path: "/about",
});

const sections = [
  { id: "mission", title: "What SYNTV RADIO is" },
  { id: "discover", title: "How listeners discover stations" },
  { id: "how-it-works", title: "How the platform works" },
  { id: "editorial", title: "Editorial approach" },
  { id: "technology", title: "Technology" },
  { id: "funding", title: "Independence and funding" },
  { id: "support", title: "Support and corrections" },
  { id: "contact", title: "Contact" },
];

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About SYNTV RADIO",
  url: absoluteUrl("/about"),
  description:
    "SYNTV RADIO is an independent directory and web player for discovering live online radio by country, genre, language, and station name.",
  isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
  about: {
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    sameAs: ["https://github.com/F4Y547/syntv_radio"],
  },
};

const features = [
  {
    icon: Globe2,
    title: "Country and genre browsing",
    text: "Move from a world view to a country page or a genre page, then open a station without losing the player.",
  },
  {
    icon: Search,
    title: "Fast search",
    text: "Search by station name, city, language, or tag. The directory query updates as you type.",
  },
  {
    icon: Heart,
    title: "A library that stays local",
    text: "Save favorites and build collections without creating an account. Your library stays in your browser.",
  },
  {
    icon: Smartphone,
    title: "Desktop and mobile",
    text: "The responsive layout and installable web app work across phone, tablet, and desktop browsers.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <InfoPage
        eyebrow="About"
        title="Radio discovery without the clutter"
        description="SYNTV RADIO is an independent directory and web player for live online radio. It is built for listeners who want to move quickly from a country or genre to a station that is actually playing."
        sections={sections}
        related={
          <div className="space-y-2 text-sm">
            <p className="font-display font-semibold text-foreground">Explore</p>
            <p><Link href="/stations" className="text-primary hover:underline">All stations</Link></p>
            <p><Link href="/countries" className="text-primary hover:underline">Countries</Link></p>
            <p><Link href="/genres" className="text-primary hover:underline">Genres</Link></p>
            <p><Link href="/faq" className="text-primary hover:underline">FAQ</Link></p>
          </div>
        }
      >
        <InfoSection id="mission" title="What SYNTV RADIO is">
          <p>
            SYNTV RADIO is a free web-based radio directory and player. Its purpose is simple: make it easier to find
            live radio from around the world, understand what you are about to play, and keep listening while you
            explore.
          </p>
          <p>
            The site is an independent project built and maintained by its site operator. Unless a page clearly says
            otherwise, SYNTV RADIO is not affiliated with the stations it indexes. We do not operate their streams and
            we do not claim ownership of their names, logos, programmes, or music.
          </p>
          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border/70 bg-background/30 p-4">
                <Icon size={18} className="text-primary" aria-hidden="true" />
                <h3 className="mt-2 font-display text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </InfoSection>

        <InfoSection id="discover" title="How listeners discover stations">
          <p>
            There is no single correct way to explore the directory. You can start with a country, a genre, a language,
            or a station name. The homepage surfaces trending stations and quick filters. The country and genre pages
            show a sample of stations with real metadata from the directory. The world explorer adds a geographic view
            for listeners who want to browse by place.
          </p>
          <p>
            Once you find a station, its detail page shows the country, language, codec, bitrate, tags, directory
            status, and a link to the station&rsquo;s own website when one is available. That context is there to help
            you decide what to play, not to imply that SYNTV RADIO operates the station.
          </p>
          <p>
            Favorites and collections are stored locally. They are useful for building a personal shortlist, but they
            are not a cloud account and do not follow you to another browser or device automatically. Listening
            statistics are also local and are intended as a lightweight personal snapshot.
          </p>
        </InfoSection>

        <InfoSection id="how-it-works" title="How the platform works">
          <p>
            Station metadata is retrieved from the community-run{" "}
            <a href="https://www.radio-browser.info/" rel="noopener noreferrer" target="_blank">
              Radio Browser
            </a>{" "}
            directory through server-side API routes. The site normalizes the data for browsing, adds its own page
            structure and editorial context, and links each listing to the station&rsquo;s public stream.
          </p>
          <p>
            When you press Play, your browser connects to the station&rsquo;s stream server. The audio does not pass
            through a SYNTV RADIO media server. This keeps the architecture simple and respects the fact that the
            stations own their broadcasts. It also means stream availability and quality depend on the station.
          </p>
          <p>
            Live listener counts are different from station ratings. They show active playback sessions registered on
            SYNTV RADIO, using a random tab-scoped identifier and short-lived heartbeats. They are an approximation of
            activity on this site, not a measurement of a station&rsquo;s total audience.
          </p>
        </InfoSection>

        <InfoSection id="editorial" title="Editorial approach">
          <p>
            The site aims to describe what it actually does. We do not publish invented reviews, fake ratings, made-up
            audience figures, or claims that a station has been verified when it has not. Country and genre pages use
            the real station records returned by the directory at the time the page is generated, and they say when
            that sample is limited.
          </p>
          <p>
            Tags and descriptions come from community data and can be incomplete. If a station is mislabelled, offline,
            duplicated, or no longer operating, a correction request is welcome. Rights holders can ask for a listing
            to be reviewed or removed.
          </p>
          <InfoCallout title="A note on station data" tone="info">
            <p>
              A SYNTV RADIO listing is a pointer to a third-party stream. It is not a copy of the stream, a rebroadcast,
              or a claim of ownership. See the <Link href="/disclaimer">Disclaimer</Link> for details.
            </p>
          </InfoCallout>
        </InfoSection>

        <InfoSection id="technology" title="Technology">
          <p>
            SYNTV RADIO is built with Next.js and React, styled with Tailwind CSS, and deployed on Vercel. The
            interactive globe uses WebGL with a fallback world map when WebGL is unavailable. A service worker provides
            a small offline shell and installable web-app support.
          </p>
          <p>
            Optional infrastructure includes a Redis-compatible store for shared listener counts when the site runs
            across multiple instances. The public site can operate without user accounts, payment processing, or
            third-party analytics.
          </p>
        </InfoSection>

        <InfoSection id="funding" title="Independence and funding">
          <p>
            Listening is free. The project may be supported by advertising in the future, but advertising is not
            currently active. If ads are enabled, they will be labelled, separated from player and navigation controls,
            and subject to the consent choices described in the <Link href="/privacy-policy">Privacy Policy</Link>.
            We do not sell station placements or present sponsored stations as editorial recommendations.
          </p>
        </InfoSection>

        <InfoSection id="support" title="Support and corrections">
          <p>
            For technical problems, include the page URL, the station name if relevant, your browser and device, and a
            short description of what happened. For station-owner or copyright requests, include the listing URL or
            station ID and the action you are requesting.
          </p>
          <p>
            Public GitHub issues are appropriate for non-sensitive technical reports. Do not post private information
            or confidential rights-holder material in a public issue.
          </p>
        </InfoSection>

        <InfoSection id="contact" title="Contact">
          <p>
            Use the <Link href="/contact">contact form</Link> to reach the site operator. The form supports general
            questions, technical support, station-owner reports, copyright and content-removal requests, privacy
            requests, and advertising or partnership questions.
          </p>
        </InfoSection>
      </InfoPage>
    </>
  );
}
