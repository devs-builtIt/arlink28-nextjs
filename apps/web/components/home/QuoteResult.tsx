"use client";

import Link from "next/link";
import { forwardRef, useState } from "react";
import { PHONES } from "@/content/home-proof";

const NEXT_STEPS = [
  "A member of the team reads your request.",
  "You get options and a price by email.",
  "Nothing is charged until you agree.",
];

/** What the visitor sees once the request is in: the reference, what happens next, and a way to act. */
export const QuoteDone = forwardRef<HTMLDivElement, { reference: string; email: string; onAgain: () => void }>(
  function QuoteDone({ reference, email, onAgain }, ref) {
    const [copied, setCopied] = useState(false);

    async function copy() {
      try {
        await navigator.clipboard.writeText(reference);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Copying is a convenience; the reference is on screen to read out.
      }
    }

    return (
      <div className="qf-done" ref={ref} tabIndex={-1} role="status">
        <span className="qf-done-mark" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2>Request received</h2>
        <p className="qf-done-lead">
          We will reply to <strong>{email}</strong> with options and a price.
        </p>

        <div className="qf-ref">
          <span>Your reference</span>
          <strong>{reference}</strong>
          <button type="button" onClick={copy} aria-label={`Copy reference ${reference}`}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <ol className="qf-steps">
          {NEXT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <p className="qf-done-urgent">
          Urgent? Call{" "}
          {PHONES.map((p, i) => (
            <span key={p.href}>
              {i > 0 && " or "}
              <a href={p.href}>{p.label}</a>
            </span>
          ))}{" "}
          and quote the reference.
        </p>

        <div className="qf-done-actions">
          <Link className="hm-btn hm-btn-primary" href="/">
            Back to home
          </Link>
          <button type="button" className="qf-again" onClick={onAgain}>
            Send another request
          </button>
        </div>
      </div>
    );
  },
);

/** The request could not be sent: what went wrong, and the other ways to reach us. */
export function QuoteAlert({ message }: { message: string }) {
  return (
    <div className="qf-alert" role="alert">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7.5v5.5M12 16.4v.1" />
      </svg>
      <div>
        <strong>Your request has not been sent</strong>
        <p>
          {message} Try again, or call{" "}
          {PHONES.map((p, i) => (
            <span key={p.href}>
              {i > 0 && " or "}
              <a href={p.href}>{p.label}</a>
            </span>
          ))}
          .
        </p>
      </div>
    </div>
  );
}
