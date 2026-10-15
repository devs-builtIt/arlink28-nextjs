import Link from "next/link";
import type { ReactNode } from "react";

type Step = { title: string; text: string };

/**
 * How it works, on every page that has it: a full-bleed photo under a dark wash, a heading, the steps as frosted
 * cards with a large numeral, and one call to action. Children render under the button.
 */
export default function StepsOnPhoto({
  id,
  sticker = "How it works",
  heading,
  steps,
  photo,
  focus = "50% 50%",
  cta,
  children,
}: {
  id: string;
  sticker?: string;
  heading: ReactNode;
  steps: readonly Step[];
  photo: string;
  focus?: string;
  cta: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <section className="hm-sec hm-how-bg" data-tone="dark" aria-labelledby={id}>
      <img
        className="hm-how-bg-img"
        src={photo}
        alt=""
        loading="lazy"
        decoding="async"
        width={1920}
        height={1080}
        style={{ objectPosition: focus }}
      />
      <div className="hm-wrap">
        <h2 className="hm-title" id={id} data-rv>
          <span className="hm-sticker" aria-hidden="true">
            {sticker}
          </span>
          {heading}
        </h2>
        <ol className="hm-steps-glass">
          {steps.map((st, i) => (
            <li key={st.title} data-rv style={{ ["--i" as string]: i }}>
              <span className="hm-step-num" aria-hidden="true">
                0{i + 1}
              </span>
              <h3>{st.title}</h3>
              <p>{st.text}</p>
            </li>
          ))}
        </ol>
        <div className="hm-how-cta" data-rv>
          <Link className="hm-btn hm-btn-primary" href={cta.href}>
            {cta.label}
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}
