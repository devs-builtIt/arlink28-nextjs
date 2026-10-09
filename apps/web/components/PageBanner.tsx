import type { ReactNode } from "react";

type Props = {
  /** The page's one h1. */
  title: ReactNode;
  /** A line or two on what the page is for. */
  intro?: ReactNode;
  /** Buttons, as links with the `pb-btn` classes. */
  actions?: ReactNode;
  /** Shown above the title: a way back, or the switcher between kinds of listing. */
  above?: ReactNode;
  /** The page docks a search bar into the card's bottom edge: leaves room for it. */
  overlap?: boolean;
  id?: string;
};

/**
 * The banner at the top of every inner page: a rounded photo card sitting under the header, like the
 * homepage's hero but shorter. The same photo, size and layout on every page.
 */
export default function PageBanner({ title, intro, actions, above, overlap = false, id = "page-title" }: Props) {
  return (
    <section className={`pb${overlap ? " pb-overlap" : ""}`} aria-labelledby={id}>
      <div className="pb-card">
        <img
          className="pb-img"
          src="/images/banner/banner-1920.webp"
          srcSet="/images/banner/banner-1280.webp 1280w, /images/banner/banner-1920.webp 1920w, /images/banner/banner-2560.webp 2560w"
          sizes="100vw"
          alt=""
          width={2560}
          height={1120}
          fetchPriority="high"
          decoding="async"
        />
        <div className="pb-in">
          {above}
          <h1 id={id}>{title}</h1>
          {intro && <p className="pb-intro">{intro}</p>}
          {actions && <div className="pb-actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
