import type { ReactNode } from "react";

type Props = {
  /** Font Awesome icon name, e.g. "fa-id-badge". */
  icon: string;
  children: ReactNode;
  /** "livery" marks where you are; "quiet" is every other sign. */
  tone?: "livery" | "quiet";
  size?: "hero" | "page" | "section";
  as?: "h1" | "h2" | "p" | "span";
  className?: string;
};

/**
 * An airport-style wayfinding sign: a pictogram tile followed by a word.
 * Page titles, the rail and the login screen are all built from it.
 */
export default function Sign({ icon, children, tone = "livery", size = "page", as: Tag = "h1", className }: Props) {
  return (
    <Tag className={["sign", `sign-${size}`, className].filter(Boolean).join(" ")}>
      <span className={`sign-tile sign-tile-${tone}`} aria-hidden="true">
        <i className={`fa-solid ${icon}`}></i>
      </span>
      <span className="sign-label">{children}</span>
    </Tag>
  );
}
