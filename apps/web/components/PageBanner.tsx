import type { ReactNode } from "react";

type Props = {
  /** The page's one h1. */
  title: ReactNode;
  /** The area of the site this page belongs to, shown as a pill above the title. */
  label?: string;
  /** A line or two on what the page is for. */
  intro?: ReactNode;
  /** Buttons, as links with the `pb-btn` classes. */
  actions?: ReactNode;
  /** Shown above the title: a way back, or the switcher between kinds of listing. */
  above?: ReactNode;
  /** The page docks a search bar into the card's bottom edge: leaves room for it. */
  overlap?: boolean;
  /** Which photo: the safari by default; holidays, flights, hotels, visas, Elite Jets, the Namibia desert and Destinations each have their own. */
  photo?: "banner" | "holidays" | "flights" | "hotels" | "visas" | "elite" | "namibia" | "destinations";
  id?: string;
};

/**
 * The banner at the top of every inner page: a rounded photo card sitting under the header, like the
 * homepage's hero but shorter. The same size and layout on every page; the photo is the one thing that can differ.
 */
export default function PageBanner({
  title,
  label,
  intro,
  actions,
  above,
  overlap = false,
  photo = "banner",
  id = "page-title",
}: Props) {
  return (
    <section className={`pb${overlap ? " pb-overlap" : ""}`} data-photo={photo} aria-labelledby={id}>
      <div className="pb-card">
        <img
          className="pb-img"
          src={`/images/banner/${photo}-1920.webp`}
          srcSet={
            `/images/banner/${photo}-1280.webp 1280w, /images/banner/${photo}-1920.webp 1920w` +
            // The Namibia and Destinations photos have no 2560 version.
            (photo === "namibia" || photo === "destinations" ? "" : `, /images/banner/${photo}-2560.webp 2560w`)
          }
          sizes="100vw"
          alt=""
          width={2560}
          height={1120}
          fetchPriority="high"
          decoding="async"
        />
        <div className="pb-in">
          {above}
          {label && <span className="pb-label">{label}</span>}
          <h1 id={id}>{title}</h1>
          {intro && <p className="pb-intro">{intro}</p>}
          {actions && <div className="pb-actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
