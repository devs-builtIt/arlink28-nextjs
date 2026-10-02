import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";

export const metadata: Metadata = {
  title: "Blogs | ARLink28",
  description: "Travel stories and guides from ARLink28.",
  // A holding page until there are real posts.
  robots: { index: false, follow: true },
};

export default function BlogsPage() {
  return (
    <div className="hm">
      <section className="hm-page hm-wrap">
        <h1>Blogs</h1>
        <p>Travel stories and guides for the routes our travellers ask about are on their way.</p>
        <div className="hm-actions">
          <Link className="hm-btn hm-btn-primary" href="/quote">
            Get a quote
          </Link>
          <Link className="hm-btn hm-btn-quiet" href="/destinations">
            Browse destinations
          </Link>
        </div>
      </section>
    </div>
  );
}
