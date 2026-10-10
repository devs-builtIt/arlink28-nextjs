"use client";

import Link from "next/link";

type Props =
  { kind: "error"; reset: () => void; digest?: string } | { kind: "notfound"; reset?: undefined; digest?: undefined };

/**
 * What a visitor sees when a page fails or does not exist: a plain statement of what happened and the next step. It
 * is used by the error pages of both layout groups and by the 404 page.
 */
export default function ErrorPanel(props: Props) {
  const failed = props.kind === "error";
  return (
    <div className="hm">
      <section className="hm-sec er" aria-labelledby="er-title">
        <div className="hm-wrap">
          <span className="hm-sticker" aria-hidden="true">
            {failed ? "Something went wrong" : "Page not found"}
          </span>
          <h1 className="hm-title hm-title-left" id="er-title">
            {failed ? "We could not load" : "This page could"}
            <br />
            <span className="hm-dim">{failed ? "this page." : "not be found."}</span>
          </h1>
          <p className="er-text">
            {failed
              ? "The problem is on our side. Try again, and if it keeps happening, send us a message and a person will help."
              : "The address may be wrong, or the page may have moved. You can go back to the homepage or ask us directly."}
          </p>
          <div className="ab-actions">
            {failed ? (
              <button type="button" className="hm-btn hm-btn-primary" onClick={() => props.reset()}>
                Try again
              </button>
            ) : (
              <Link className="hm-btn hm-btn-primary" href="/">
                Back to home
              </Link>
            )}
            <Link className="hm-btn hm-btn-primary" href={failed ? "/" : "/contact"}>
              {failed ? "Back to home" : "Contact us"}
            </Link>
          </div>
          {failed && props.digest && <p className="er-ref">Reference: {props.digest}</p>}
        </div>
      </section>
    </div>
  );
}
