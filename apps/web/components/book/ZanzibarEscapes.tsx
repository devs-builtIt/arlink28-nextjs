import { ZANZIBAR_ESCAPES } from "@/content/zanzibar-escapes";

/** The Blue Ocean Zanzibar escapes under the partner cards. Each page passes its own one-line lead-in. */
export default function ZanzibarEscapes({ text }: { text: string }) {
  return (
    <section className="bk-escapes" aria-labelledby="bk-escapes-title">
      <div className="bk-escapes-head">
        <span className="bk-tag">Featured getaway</span>
        <h2 id="bk-escapes-title">
          ARLink28 x Blue Ocean
          <br />
          <span className="bk-dim">Zanzibar escapes</span>
        </h2>
        <p>{text}</p>
      </div>
      <ul className="bk-escapes-grid">
        {ZANZIBAR_ESCAPES.map((p) => (
          <li key={p.title}>
            <a className="bk-escape" href="https://blueoceanhotels.com" target="_blank" rel="noopener noreferrer">
              <img src={p.img} alt="" loading="lazy" decoding="async" />
              <span className="bk-escape-body">
                <strong>{p.title}</strong>
                <span>
                  {p.meta} · from <b>{p.price}</b>
                </span>
                <span className="partner-card-btn">Enquire now</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
