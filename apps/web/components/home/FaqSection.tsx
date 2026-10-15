import Link from "next/link";

import FaqList from "@/components/home/FaqList";
import type { Faq } from "@/content/service-faqs";

/**
 * The FAQ section used on the home page and under every service page: a heading on the left, the questions as
 * a list of details on the right. With `schema` it also writes the questions as FAQPage structured data. The home
 * page leaves that off because its own page-level data already carries them.
 */
export default function FaqSection({ items, schema = true }: { items: readonly Faq[]; schema?: boolean }) {
  return (
    <section className="hm-sec" id="faq" aria-labelledby="hm-faq">
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: items.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      )}
      <div className="hm-wrap">
        <div className="hm-faq-wrap">
          <div className="hm-faq-side">
            <h2 className="hm-title hm-title-left" id="hm-faq" data-rv>
              <span className="hm-sticker" aria-hidden="true">
                FAQ
              </span>
              Questions
              <br />
              <span className="hm-dim">before you book.</span>
            </h2>
            <p data-rv style={{ ["--i" as string]: 1 }}>
              Cannot see your question? Ask the team and a person replies.
            </p>
            <Link className="hm-btn hm-btn-primary" href="/contact" data-rv style={{ ["--i" as string]: 2 }}>
              Contact us
            </Link>
          </div>
          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}
