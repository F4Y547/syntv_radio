import Link from "next/link";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { InfoPage, InfoSection } from "@/components/content/info-page";
import { guides } from "@/lib/content/guides";
import { jsonLd } from "@/lib/seo/json-ld";
import { infoPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";

export const metadata = infoPageMetadata({
  title: "Radio Guides and Listening Tips",
  description:
    "Original guides to internet radio: bitrates and codecs, global music genres, stream troubleshooting, personal collections, and how directory metadata works.",
  path: "/guides",
});

const guidesJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "SYNTV RADIO guides",
  isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
  numberOfItems: guides.length,
  itemListElement: guides.map((guide, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: guide.title,
    url: absoluteUrl(`/guides/${guide.slug}`),
  })),
};

export default function GuidesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(guidesJsonLd) }} />
      <InfoPage
        eyebrow="Guides"
        title="Radio guides for curious listeners"
        description="Short, practical articles about how internet radio works and how to get more out of the directory. Written by the SYNTV RADIO team; no invented reviews or audience figures."
        updated="Last updated: November 27, 2026"
        sections={[]}
        related={
          <div className="space-y-2 text-sm">
            <p className="font-display font-semibold text-foreground">Keep exploring</p>
            <p><Link href="/stations" className="text-primary hover:underline">Station directory</Link></p>
            <p><Link href="/countries" className="text-primary hover:underline">Countries</Link></p>
            <p><Link href="/genres" className="text-primary hover:underline">Genres</Link></p>
            <p><Link href="/faq" className="text-primary hover:underline">FAQ</Link></p>
          </div>
        }
      >
        <InfoSection id="all-guides" title="All guides">
          <div className="grid gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <article key={guide.slug} className="flex h-full flex-col rounded-2xl border border-border/70 bg-background/30 p-5 transition hover:border-primary/40">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  <BookOpen size={13} aria-hidden="true" /> {guide.eyebrow}
                </p>
                <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                  <Link href={`/guides/${guide.slug}`} className="rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {guide.title}
                  </Link>
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-muted">{guide.description}</p>
                <p className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock3 size={13} aria-hidden="true" /> {guide.minutes} min read</span>
                  <span>Updated {guide.updated}</span>
                  <Link href={`/guides/${guide.slug}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                    Read guide <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </p>
              </article>
            ))}
          </div>
        </InfoSection>

        <InfoSection id="editorial-policy" title="How these guides are written">
          <p>
            These articles explain the service, the public directory behind it, and general listening practice. They are
            original editorial content, not station reviews, paid placements, or claims about a station&rsquo;s audience. When
            a detail depends on community-maintained data, the guide says so.
          </p>
          <p>
            Corrections are welcome. Use the <Link href="/contact?topic=technical">contact form</Link> if a technical
            explanation is outdated, or the <Link href="/contact?topic=station-owner">station form</Link> for a listing
            correction. See the <Link href="/about">About page</Link> for how SYNTV RADIO is organized.
          </p>
        </InfoSection>
      </InfoPage>
    </>
  );
}
