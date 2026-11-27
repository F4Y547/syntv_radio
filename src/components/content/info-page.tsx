import type { ReactNode } from "react";

export interface InfoSectionLink {
  id: string;
  title: string;
}

export function InfoPage({
  eyebrow,
  title,
  description,
  updated,
  sections,
  related,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updated?: string;
  sections: InfoSectionLink[];
  related?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/30 p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_75%_20%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_55%),radial-gradient(ellipse_45%_45%_at_15%_85%,color-mix(in_srgb,var(--color-live)_7%,transparent),transparent_55%)]"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="inline-flex items-center rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground-muted sm:text-lg">{description}</p>
          {updated && (
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{updated}</p>
          )}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0 space-y-8 rounded-2xl border border-border/70 bg-surface/25 p-5 backdrop-blur-sm sm:p-7">
          {children}
        </article>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {sections.length > 0 && (
            <nav aria-label="On this page" className="rounded-2xl border border-border/70 bg-surface/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">On this page</p>
              <ol className="mt-3 space-y-2 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-foreground-muted transition hover:text-foreground">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {related && <div className="rounded-2xl border border-border/70 bg-surface/30 p-4">{related}</div>}
        </aside>
      </div>
    </div>
  );
}

export function InfoSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 space-y-3 border-b border-border/50 pb-7 last:border-b-0 last:pb-0"
    >
      <h2 id={`${id}-heading`} className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground-muted [&_a]:text-primary [&_a:hover]:underline [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function InfoCallout({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "warning";
}) {
  const styles =
    tone === "warning"
      ? "border-warning/30 bg-warning/10"
      : "border-primary/25 bg-primary-soft/55";
  return (
    <div className={`rounded-xl border p-4 text-sm leading-relaxed text-foreground-muted ${styles}`}>
      <p className="font-display text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-1.5 space-y-2 [&_a]:text-primary [&_a:hover]:underline">{children}</div>
    </div>
  );
}
