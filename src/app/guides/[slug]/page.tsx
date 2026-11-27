import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { InfoPage, InfoSection } from "@/components/content/info-page";
import { getGuideBySlug, guides } from "@/lib/content/guides";
import { jsonLd } from "@/lib/seo/json-ld";
import { infoPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Guide not found", robots: { index: false, follow: false } };

  const base = infoPageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
  });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: "2026-11-27T00:00:00.000Z",
      authors: ["SYNTV RADIO"],
    },
  };
}

export default async function GuideArticlePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const currentIndex = guides.findIndex((item) => item.slug === guide.slug);
  const nextGuide = guides[(currentIndex + 1) % guides.length];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: "2026-11-27",
    dateModified: "2026-11-27",
    author: { "@type": "Organization", name: siteName, url: siteUrl },
    publisher: { "@type": "Organization", name: siteName, url: siteUrl },
    mainEntityOfPage: absoluteUrl(`/guides/${guide.slug}`),
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }} />
      <InfoPage
        eyebrow={guide.eyebrow}
        title={guide.title}
        description={guide.description}
        updated={`Published November 27, 2026 · ${guide.minutes} min read`}
        sections={guide.sections.map((section) => ({ id: section.id, title: section.title }))}
        related={
          <div className="space-y-2 text-sm">
            <p className="font-display font-semibold text-foreground">More guides</p>
            <p><Link href="/guides" className="text-primary hover:underline">All guides</Link></p>
            {guides.filter((item) => item.slug !== guide.slug).slice(0, 3).map((item) => (
              <p key={item.slug}><Link href={`/guides/${item.slug}`} className="text-primary hover:underline">{item.title}</Link></p>
            ))}
          </div>
        }
      >
        {guide.sections.map((section) => (
          <InfoSection key={section.id} id={section.id} title={section.title}>
            {section.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
            {section.bullets && (
              <ul>
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            )}
          </InfoSection>
        ))}

        <nav aria-label="Guide navigation" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/30 p-4 text-sm">
          <Link href="/guides" className="inline-flex items-center gap-1.5 text-foreground-muted hover:text-foreground">
            <ArrowLeft size={15} aria-hidden="true" /> All guides
          </Link>
          <Link href={`/guides/${nextGuide.slug}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
            Next: {nextGuide.title} <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </nav>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 size={14} aria-hidden="true" /> Reviewed by the SYNTV RADIO team on {guide.updated}. Last updated November 27, 2026.
        </p>
      </InfoPage>
    </>
  );
}
