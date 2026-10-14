import Link from "next/link";
import type { ReactNode } from "react";
import LegalToc from "./LegalToc";

const POLICIES = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "refund-policy", label: "Refund & Cancellation Policy" },
  { slug: "affiliate-disclosure", label: "Affiliate Disclosure" },
  { slug: "cookie-policy", label: "Cookie Policy" },
  { slug: "disclaimer", label: "Disclaimer" },
];

/**
 * The page around a legal document: the document's own text on the right, and on the left an "on this page" list and
 * the other policies. The text itself is passed in untouched; this component only lays it out.
 */
export default function LegalLayout({
  current,
  toc,
  children,
}: {
  current: string;
  toc: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <section className="hm-sec hm-sec-white" data-tone="light" aria-label="Policy text">
      <div className="hm-wrap">
        <div className="lg-layout">
          <aside className="lg-side">
            <LegalToc items={toc} />
          </aside>
          <div className="lg-main">
            <article className="lg-body">{children}</article>
            <nav className="lg-others" aria-label="Other policies">
              <h2>Our other policies</h2>
              <ul>
                {POLICIES.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/${p.slug}`} aria-current={p.slug === current ? "page" : undefined}>
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
