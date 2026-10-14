import type { Metadata } from "next";
import Link from "next/link";
import PageBanner from "@/components/PageBanner";

export const metadata: Metadata = {
  title: "Blogs | ARLink28",
  description: "Travel stories and guides from ARLink28.",
  // A holding page until there are real posts.
  robots: { index: false, follow: true },
};

export default function BlogsPage() {
  return (
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
  );
}
