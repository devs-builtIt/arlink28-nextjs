import Link from "next/link";

const PLACES = [
  ["cpt", "Cape Town"],
  ["chobe", "Chobe"],
  ["giza", "Giza"],
] as const;

/**
 * The closing call to action: a dark card with the heading, a line on what happens next, the Book now button and
 * three African route photos. Used at the foot of the homepage and of the inner pages that end on a call to action.
 */
type Props = {
  pill?: string;
  /** The two lines of the heading: the second is shown softer. */
  heading?: [string, string];
  text?: string;
  cta?: string;
  href?: string;
  /** Run the dark band edge to edge instead of as a card inside the page width. */
  bleed?: boolean;
};

export default function ClosingCta({
  pill = "Ready to go?",
  heading = ["Enjoy the trip.", "We sort the booking."],
  text = "Tell us where you want to go. We take care of the flights, hotel and visa, so all you do is arrive and enjoy it. Nothing is charged until you agree.",
  cta = "Book now",
  href = "/quote",
  bleed = false,
}: Props) {
  return (
    <section
      className={bleed ? "hm-sec hm-deals-bleed" : "hm-sec hm-sec-white hm-sec-flush"}
      data-tone={bleed ? "dark" : "light"}
      aria-labelledby="hm-deals"
    >
      <div className="hm-wrap">
        <div className="hm-deals" data-theme="dark">
          <div className="hm-deals-copy">
            <h2 id="hm-deals" data-rv style={{ ["--i" as string]: 0 }}>
              <span className="hm-sticker" aria-hidden="true">
                {pill}
              </span>
              {heading[0]}
              <br />
              <span className="hm-dim">{heading[1]}</span>
            </h2>
            <p data-rv style={{ ["--i" as string]: 2 }}>
              {text}
            </p>
            <div className="hm-actions" data-rv style={{ ["--i" as string]: 3 }}>
              <Link className="hm-btn hm-btn-primary" href={href}>
                {cta}
              </Link>
            </div>
          </div>
          <ul className="hm-deals-photos">
            {PLACES.map(([c, city], i) => (
              <li key={c} data-rv style={{ ["--i" as string]: i + 2 }}>
                <Link href="/quote" aria-label={`Get a quote for ${city}`}>
                  <img
                    src={`/images/home/route-${c}.webp`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={800}
                    height={1000}
                  />
                  <span className="hm-go" aria-hidden="true">
                    <svg viewBox="0 0 16 16">
                      <path d="M4 12 12 4M5.5 4H12v6.5" />
                    </svg>
                  </span>
                  <span className="hm-chip">{city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
