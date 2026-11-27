"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "technical", label: "Technical support" },
  { value: "station-owner", label: "Station owner request" },
  { value: "copyright", label: "Copyright or content removal" },
  { value: "privacy", label: "Privacy request" },
  { value: "advertising", label: "Advertising or partnership" },
  { value: "other", label: "Other" },
] as const;

type Topic = (typeof TOPICS)[number]["value"];
type FieldName = "email" | "topic" | "message" | "privacyAccepted";
type FieldErrors = Partial<Record<FieldName, string>>;
type Status = "idle" | "submitting" | "success" | "saved-not-notified" | "error" | "not-configured";

interface ContactFormProps {
  initialTopic?: string;
  initialStation?: string;
}

function isTopic(value: string | undefined): value is Topic {
  return TOPICS.some((topic) => topic.value === value);
}

export function ContactForm({ initialTopic, initialStation = "" }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<Topic>(isTopic(initialTopic) ? initialTopic : "general");
  const [station, setStation] = useState(initialStation.slice(0, 200));
  const [message, setMessage] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Enter your email address so we can reply.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!isTopic(topic)) next.topic = "Choose a topic.";
    if (message.trim().length < 20) next.message = "Please include at least 20 characters of detail.";
    if (!privacyAccepted) next.privacyAccepted = "Please acknowledge the privacy notice.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");
    if (!validate()) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          station: station.trim(),
          message: message.trim(),
          privacyAccepted,
          companyWebsite,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        code?: string;
        field?: FieldName;
      };

      if (response.ok && data.success) {
        setStatus("success");
        setName("");
        setEmail("");
        setTopic("general");
        setStation("");
        setMessage("");
        setPrivacyAccepted(false);
        setCompanyWebsite("");
        return;
      }

      if (response.status === 503 && data.code === "contact_not_configured") {
        setStatus("not-configured");
        return;
      }

      if (response.status === 502 && data.code === "delivery_failed_submission_saved") {
        setStatus("saved-not-notified");
        setServerError(data.error || "Your message was saved, but the notification could not be delivered. Our team can still review it.");
        setName("");
        setEmail("");
        setTopic("general");
        setStation("");
        setMessage("");
        setPrivacyAccepted(false);
        setCompanyWebsite("");
        return;
      }

      if (data.field) setErrors((current) => ({ ...current, [data.field as FieldName]: data.error }));
      setServerError(data.error || "The message could not be sent. Please try again.");
      setStatus("error");
    } catch {
      setServerError("The message could not be sent. Check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-live/30 bg-live/10 p-6" role="status" aria-live="polite">
        <CheckCircle2 size={24} className="text-live" aria-hidden="true" />
        <h2 className="mt-3 font-display text-xl font-semibold text-foreground">Message sent</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          Thank you. Your message was accepted for delivery. Please keep an eye on the email address you provided for
          a reply. We cannot promise a specific response time.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Send another message
        </button>
      </div>
    );
  }

  if (status === "saved-not-notified") {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6" role="status" aria-live="polite">
        <AlertCircle size={24} className="text-warning" aria-hidden="true" />
        <h2 className="mt-3 font-display text-xl font-semibold text-foreground">Message saved</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          {serverError || "Your message was saved, but the notification email could not be delivered. Our team can still review it in the admin dashboard."}
        </p>
        <button
          type="button"
          onClick={() => { setServerError(""); setStatus("idle"); }}
          className="mt-4 rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Send another message
        </button>
      </div>
    );
  }

  const errorSummary = Object.values(errors).filter(Boolean);

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={status === "submitting"} className="space-y-5">
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="contact-company-website">Leave this field empty</label>
        <input
          id="contact-company-website"
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          value={companyWebsite}
          onChange={(event) => setCompanyWebsite(event.target.value)}
        />
      </div>

      {status === "not-configured" && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed text-foreground-muted" role="alert">
          <p className="font-semibold text-foreground">The contact form is not configured for delivery yet.</p>
          <p className="mt-1">
            No message was sent or stored. The site owner must configure a verified email provider or webhook before
            this form can deliver messages. For non-sensitive technical reports, you can use the{" "}
            <a
              href="https://github.com/F4Y547/syntv_radio/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              public GitHub issue tracker
            </a>
            . Do not post private information there.
          </p>
        </div>
      )}

      {status === "error" && serverError && (
        <div className="flex gap-2 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error" role="alert">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {errorSummary.length > 0 && (
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error" role="alert">
          <p className="font-semibold">Please check the form:</p>
          <ul className="mt-1 list-disc pl-5">
            {errorSummary.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Name <span className="text-muted-foreground">(optional)</span></span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 100))}
            autoComplete="name"
            className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value.slice(0, 254))}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            placeholder="you@example.com"
          />
          {errors.email && <span id="contact-email-error" className="mt-1 block text-xs text-error">{errors.email}</span>}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Topic</span>
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value as Topic)}
            aria-invalid={Boolean(errors.topic)}
            aria-describedby={errors.topic ? "contact-topic-error" : undefined}
            className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {TOPICS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          {errors.topic && <span id="contact-topic-error" className="mt-1 block text-xs text-error">{errors.topic}</span>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Station name or URL <span className="text-muted-foreground">(optional)</span></span>
          <input
            type="text"
            value={station}
            onChange={(event) => setStation(event.target.value.slice(0, 200))}
            className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            placeholder="Station name, SYNTV page URL, or station ID"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-foreground">Message</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, 5_000))}
          rows={7}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : "contact-message-help"}
          className="mt-1.5 w-full resize-y rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
          placeholder="Describe your question or report. For copyright requests, identify the station and the material involved."
        />
        <span id="contact-message-help" className="mt-1 block text-xs text-muted-foreground">
          {message.trim().length}/5000 characters. At least 20 characters required.
        </span>
        {errors.message && <span id="contact-message-error" className="mt-1 block text-xs text-error">{errors.message}</span>}
      </label>

      <div>
        <label className="flex items-start gap-3 text-sm text-foreground-muted">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(event) => setPrivacyAccepted(event.target.checked)}
            aria-invalid={Boolean(errors.privacyAccepted)}
            aria-describedby={errors.privacyAccepted ? "contact-privacy-error" : undefined}
            className="mt-0.5 h-4 w-4 rounded border-border bg-background text-primary focus:ring-ring"
          />
          <span>
            I understand that my name, email address, topic, station reference, and message will be sent to the site
            operator so they can respond. See the <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        {errors.privacyAccepted && <span id="contact-privacy-error" className="mt-1 block text-xs text-error">{errors.privacyAccepted}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
          {status === "submitting" ? "Sending..." : "Send message"}
        </button>
        {status === "submitting" && (
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            Sending your message through the configured delivery provider…
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Messages are rate-limited to prevent abuse. Do not send passwords, payment data, or identity documents.
        </p>
      </div>
    </form>
  );
}
