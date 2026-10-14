import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import Reveal from "@/components/home/Reveal";
import { BLOG_TEASERS } from "@/content/blog-teasers";

export const metadata: Metadata = {
  title: "Blogs | ARLink28",
  description: "Travel stories and guides from ARLink28.",
  // A holding page until there are real posts.
  robots: { index: false, follow: true },
};

export default function BlogsPage() {
  return (
    <div className="hm">
      <Reveal />
      <PageBanner
        label="Blogs"
        title="Blogs"
        intro="Travel stories and guides for the routes our travellers ask about are on their way."
        actions={
          <>
            <Link className="pb-btn pb-btn-primary" href="/quote">
              Book now
            </Link>
            <Link className="pb-btn pb-btn-quiet" href="/destinations">
              Browse destinations
            </Link>
          </>
        }
      />

      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="bl-soon">
        <div className="hm-wrap">
          <div className="ab-split en-intro">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="bl-soon" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Coming soon
                </span>
                Guides are
                <br />
                <span className="hm-dim">on the way.</span>
              </h2>
            </div>
            <div className="ab-body">
              <p className="ab-lead" data-rv>
                We have not published any posts yet. These are the first three we are writing.
              </p>
              <p data-rv style={{ ["--i" as string]: 1 }}>
                In the meantime, if you are planning one of these trips, send us your route and dates and a person will
                reply with options and a price.
              </p>
            </div>
          </div>
          <ul className="tm-grid en-grid">
            {BLOG_TEASERS.map((post, i) => (
              <li key={post.title} data-rv style={{ ["--i" as string]: i }}>
                <div className="tm-card bl-static">
                  <span className="tm-photo">
                    <img src={post.image} alt={post.alt} loading="lazy" decoding="async" width={900} height={900} />
                    <span className="hm-chip">Coming soon</span>
                  </span>
                  <strong>{post.title}</strong>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ClosingCta />
    </div>
  );
}
