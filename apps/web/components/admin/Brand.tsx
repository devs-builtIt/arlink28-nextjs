/**
 * The ARLink28 mark (cropped from the horizontal logo, whose lettering is too
 * small to read at UI sizes) with the name set as real text.
 */
export default function Brand({ caption, size = "m" }: { caption?: string; size?: "m" | "l" }) {
  return (
    <span className={`brand brand-${size}`}>
      <img src="/images/admin/logo-mark.png" alt="" aria-hidden="true" />
      <span className="brand-text">
        <span className="brand-name">ARLink28</span>
        {caption && <span className="brand-caption">{caption}</span>}
      </span>
    </span>
  );
}
