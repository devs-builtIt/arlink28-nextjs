"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type HeroSlide = {
  region: string;
  place: string;
  blurb: string;
  /** The same picture at several widths, smallest first. The browser picks the one that stays sharp on its screen. */
  sizes: { src: string; w: number }[];
  thumb: string;
  /** Where the crop stays centred (CSS object-position), so the subject is not cut off on wide or short screens. */
  focus?: string;
};

const largest = (s: HeroSlide) => s.sizes[s.sizes.length - 1];
const fallback = (s: HeroSlide) => (s.sizes.find((v) => v.w >= 1920) ?? largest(s)).src;

const INTERVAL = 7000; // ms a slide stays; the thumbnail's progress bar runs for exactly this long

// The reveal: the new picture shows through 30 horizontal slats that open from the bottom edge of each slat upwards,
// one after another from the bottom of the screen to the top, like blinds opening.
const BANDS = 30;
const STAGGER = 14; // ms between one slat starting and the next
const BAND_MS = 450; // ms one slat takes to open
const REVEAL_MS = (BANDS - 1) * STAGGER + BAND_MS;

const pad = (n: number) => String(n).padStart(2, "0");

function blinds(t: number): string {
  const period = 100 / BANDS;
  const stops: string[] = [];
  for (let k = 0; k < BANDS; k++) {
    const p = Math.min(1, Math.max(0, (t - k * STAGGER) / BAND_MS));
    const open = 1 - Math.pow(1 - p, 3);
    const a = k * period;
    stops.push(
      `#000 ${a}%`,
      `#000 ${a + open * period}%`,
      `transparent ${a + open * period}%`,
      `transparent ${a + period}%`,
    );
  }
  return `linear-gradient(0deg, ${stops.join(",")})`;
}

/** A stack of lines in one place: the current one rolls up into view, the one before it rolls up and out. */
function Roll({
  items,
  index,
  prev,
  className,
}: {
  items: ReactNode[];
  index: number;
  prev: number | null;
  className?: string;
}) {
  return (
    <span className={`hm-roll${className ? ` ${className}` : ""}`} aria-hidden="true">
      {items.map((node, i) => (
        <span key={i} className={i === index ? "is-on" : i === prev ? "is-prev" : undefined}>
          {node}
        </span>
      ))}
    </span>
  );
}

/**
 * The full-bleed hero photo as a slideshow. A new photo opens over the old one through blinds, each photo drifts
 * slowly closer while it is shown, and the place, the count and the blurb roll up into place. A strip along the bottom
 * holds one thumbnail per slide with a progress bar under the current one; clicking a thumbnail jumps to it. A pause
 * button stops everything, and visitors who prefer reduced motion get a plain, quick crossfade and no autoplay.
 * The pictures are decorative: the hero heading carries the meaning.
 */
export default function HeroSlides({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  // Bumped on a manual change or a resume so the progress bar and the timer start together again.
  const [run, setRun] = useState(0);
  const layers = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const go = (next: number) => {
    if (next === index) return;
    const layer = layers.current[next];
    if (layer && !reduced) {
      // Closed before it is shown, so the new photo never flashes up whole.
      const closed = blinds(0);
      layer.style.maskImage = closed;
      layer.style.webkitMaskImage = closed;
    }
    setPrev(index);
    setIndex(next);
    setRun((r) => r + 1);
  };

  // Open the blinds on the photo that just became current.
  useEffect(() => {
    const layer = layers.current[index];
    if (!layer || prev === null || reduced) return;
    const start = performance.now();
    let frame = 0;
    const clear = () => {
      layer.style.maskImage = "";
      layer.style.webkitMaskImage = "";
    };
    const tick = (now: number) => {
      const t = now - start;
      if (t >= REVEAL_MS) {
        clear();
        return;
      }
      const mask = blinds(t);
      layer.style.maskImage = mask;
      layer.style.webkitMaskImage = mask;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      clear();
    };
  }, [index, prev, reduced]);

  const auto = playing && !reduced;

  useEffect(() => {
    if (!auto) return;
    const timer = window.setTimeout(() => go((index + 1) % slides.length), INTERVAL);
    return () => window.clearTimeout(timer);
    // `go` only reads `index` and `reduced`, which are already dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, index, run, slides.length]);

  const current = slides[index];

  return (
    <>
      <div
        className={`hm-slides${reduced ? " is-reduced" : ""}${playing ? "" : " is-paused"}`}
        style={{ ["--slide-ms" as string]: `${INTERVAL + REVEAL_MS + 400}ms` } as CSSProperties}
        aria-hidden="true"
      >
        {slides.map((s, i) => (
          <div
            key={s.thumb}
            ref={(el) => {
              layers.current[i] = el;
            }}
            className={`hm-slide${i === index ? " is-on" : i === prev ? " is-prev" : ""}`}
          >
            <div className="hm-slide-zoom">
              <img
                src={fallback(s)}
                srcSet={s.sizes.map((v) => `${v.src} ${v.w}w`).join(", ")}
                sizes="100vw"
                width={largest(s).w}
                height={Math.round(largest(s).w * 0.5625)}
                alt=""
                style={s.focus ? { objectPosition: s.focus } : undefined}
                loading={i === 0 ? undefined : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className={`hm-slider${playing ? "" : " is-paused"}`}
        style={{ ["--slide-ms" as string]: `${INTERVAL}ms` } as CSSProperties}
      >
        <div className="hm-slider-info">
          <p className="sr-only" aria-live="polite">
            {current.region}, {current.place}, slide {index + 1} of {slides.length}
          </p>
          <p className="hm-slider-line" aria-hidden="true">
            <Roll
              index={index}
              prev={prev}
              items={slides.map((s) => (
                <>
                  {s.region} <i>|</i> {s.place}
                </>
              ))}
            />
            <span className="hm-slider-count">
              <Roll index={index} prev={prev} items={slides.map((_, i) => pad(i + 1))} />
              <i>&mdash;</i>
              {pad(slides.length)}
            </span>
          </p>
          <Roll className="hm-slider-blurb" index={index} prev={prev} items={slides.map((s) => s.blurb)} />
        </div>

        <div className="hm-slider-nav">
          <ul className="hm-slider-thumbs">
            {slides.map((s, i) => (
              <li key={s.thumb}>
                <button
                  type="button"
                  className={i === index ? "is-on" : undefined}
                  aria-label={`Show ${s.place}, ${s.region}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => go(i)}
                >
                  <span className="hm-slider-num">{pad(i + 1)}.</span>
                  <span className="hm-slider-frame">
                    <img src={s.thumb} width={360} height={240} alt="" loading="lazy" />
                  </span>
                  <span className="hm-slider-bar" aria-hidden="true">
                    {i === index && (
                      <span
                        key={`${index}-${run}`}
                        style={{ animationDuration: `${INTERVAL}ms` }}
                        className={auto ? "is-running" : undefined}
                      />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!reduced && (
            <button
              type="button"
              className="hm-slider-pause"
              aria-label={playing ? "Pause the slideshow" : "Play the slideshow"}
              onClick={() => {
                setPlaying((p) => !p);
                setRun((r) => r + 1);
              }}
            >
              {playing ? (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M5 3v10M11 3v10" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M5 3.2v9.6L13 8z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
