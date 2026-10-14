export type BookPartner = {
  name: string;
  logo: string;
  desc: string;
  tags: string[];
  /** The link out, with the traveller's search filled in where the partner allows it. */
  href: string;
  cta: string;
};

/** The partner cards on a booking page. Each one opens the partner's own site in a new tab. */
export default function PartnerCards({ partners }: { partners: BookPartner[] }) {
  return (
    <div className="partners-grid">
      {partners.map((p) => (
        <div className="partner-card" key={p.name}>
          <img src={p.logo} alt="" className="partner-card-logo" />
          <div className="partner-card-name">{p.name}</div>
          <p className="partner-card-desc">{p.desc}</p>
          <ul className="partner-card-tags">
            {p.tags.map((tag) => (
              <li className="partner-tag" key={tag}>
                {tag}
              </li>
            ))}
          </ul>
          <a href={p.href} target="_blank" rel="noopener noreferrer" className="partner-card-btn">
            {p.cta} {p.name}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      ))}
    </div>
  );
}
