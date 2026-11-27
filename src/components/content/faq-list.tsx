import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { faqItems, type FaqItem } from "@/lib/content/faq";

export function FaqList({
  items = faqItems,
  limit,
  showContactLink = false,
}: {
  items?: FaqItem[];
  limit?: number;
  showContactLink?: boolean;
}) {
  const visible = typeof limit === "number" ? items.slice(0, limit) : items;

  return (
    <div className="space-y-3">
      {visible.map((item) => (
        <details
          key={item.question}
          className="group rounded-xl border border-border/70 bg-background/30 open:border-primary/30 open:bg-primary-soft/20"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base">
            <span>{item.question}</span>
            <ChevronDown
              size={17}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-border/50 px-4 py-3.5 text-sm leading-relaxed text-foreground-muted">
            {item.answer}
          </div>
        </details>
      ))}
      {showContactLink && (
        <p className="pt-2 text-sm text-foreground-muted">
          Still have a question?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact SYNTV RADIO
          </Link>
          .
        </p>
      )}
    </div>
  );
}
