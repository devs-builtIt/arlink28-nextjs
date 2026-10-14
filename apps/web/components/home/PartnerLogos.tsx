import { PARTNER_LOGOS } from "@/content/home-proof";

/** A quiet strip of partner logos that drifts slowly. The second copy is for the loop and is hidden from readers. */
export default function PartnerLogos() {
  return (
    <div className="hm-logos-band">
      <div className="hm-logos">
        <div className="hm-logos-track">
          {[0, 1].map((n) => (
            <ul key={n} aria-hidden={n === 1 ? "true" : undefined} aria-label={n === 0 ? "Our partners" : undefined}>
              {PARTNER_LOGOS.map((l) => (
                <li key={l.name}>
                  <img src={l.src} alt={n === 0 ? l.name : ""} loading="lazy" decoding="async" height={40} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
