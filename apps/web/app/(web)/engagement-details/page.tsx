import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import Reveal from "@/components/home/Reveal";
import { ENGAGEMENTS } from "@/content/engagements";

export const metadata: Metadata = {
  title: "Engagement archive | ARLink28",
  description:
    "Full details of ARLink28's industry engagements, summits, expos and airshows across Africa and internationally.",
};

export default function EngagementDetailsPage() {
  return (
    <div className="hm">
      <Reveal />
      <PageBanner
        label="Engagement"
        above={
          <Link className="pb-back" href="/engagement">
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Back to engagement
          </Link>
        }
        title={
          <>
            Our engagement
            <br />
            archive
          </>
        }
        intro="Write-ups of the summits, expos and airshows ARLink28 has taken part in, with photos from each."
      />

      <section className="hm-sec hm-sec-white" data-tone="light" aria-label="Engagements">
        <div className="hm-wrap">
          <ol className="ev-list">
            {ENGAGEMENTS.map((e) => {
              const rest = e.images.slice(1, 4);
              return (
                <li key={e.id} id={e.id} className="ev">
                  <div className="ev-photos">
                    <img
                      className="ev-main"
                      src={e.images[0].src}
                      alt={e.images[0].alt}
                      loading="lazy"
                      decoding="async"
                      width={e.images[0].w}
                      height={e.images[0].h}
                    />
                    {rest.map((im) => (
                      <img
                        key={im.src}
                        src={im.src}
                        alt={im.alt}
                        loading="lazy"
                        decoding="async"
                        width={im.w}
                        height={im.h}
                      />
                    ))}
                  </div>
                  <div className="ev-body">
                    <p className="ev-pills">
                      <span>{e.badge}</span>
                      <span>{e.date}</span>
                    </p>
                    <h2>{e.title}</h2>
                    <div className="ev-text">
                      {e.summary.map((p) => (
                        <p key={p.slice(0, 40)}>{p}</p>
                      ))}
                    </div>
                    {e.full.length > 0 && (
                      <details className="ev-more">
                        <summary>Read the full write-up</summary>
                        <div className="ev-text">
                          {e.full.map((p) => (
                            <p key={p.slice(0, 40)}>{p}</p>
                          ))}
                        </div>
                      </details>
                    )}
                    <dl className="ev-meta">
                      <div>
                        <dt>Where</dt>
                        <dd>{e.place}</dd>
                      </div>
                      {e.reps && (
                        <div>
                          <dt>Represented by</dt>
                          <dd>{e.reps}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <ClosingCta
        pill="Meet the team"
        heading={["Meet us at an event.", "Or talk to us now."]}
        text="If you would like to meet ARLink28 at an industry event, or talk about working together, send us a message."
        cta="Get in touch"
        href="/contact"
      />
    </div>
  );
}
