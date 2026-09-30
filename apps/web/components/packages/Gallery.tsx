"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryImage = { id: string; src: string; alt: string; caption?: string | null; label?: string };

/**
 * A photo mosaic: one large photo with up to four beside it. Any photo opens a full-screen
 * viewer with arrow keys and a count. The viewer is a native dialog, so Esc closes it and
 * focus stays inside it.
 */
export default function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [current, setCurrent] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const open = (index: number) => {
    opener.current = document.activeElement as HTMLElement | null;
    setCurrent(index);
  };
  const step = useCallback(
    (by: number) => setCurrent((i) => (i === null ? i : (i + by + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (current !== null && !el.open) el.showModal();
    if (current === null && el.open) el.close();
  }, [current]);

  if (images.length === 0) {
    return (
      <div className="pkgs-gallery pkgs-gallery-empty" data-count="0">
        <i className="fa-regular fa-image" aria-hidden="true"></i>
        <p>Photos of this package are on their way.</p>
      </div>
    );
  }

  const shown = images.slice(0, 5);
  const more = images.length - shown.length;
  const active = current === null ? null : images[current];

  return (
    <>
      <div className="pkgs-gallery" data-count={shown.length}>
        {shown.map((img, i) => (
          <button
            key={img.id}
            type="button"
            className="pkgs-gallery-tile"
            onClick={() => open(i)}
            aria-label={`Open photo ${i + 1} of ${images.length}: ${img.alt || title}`}
          >
            <img src={img.src} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async" />
          </button>
        ))}
        {images.length > 1 && (
          <button type="button" className="pkgs-gallery-all" onClick={() => open(0)}>
            <i className="fa-regular fa-images" aria-hidden="true"></i>
            {more > 0 ? `Show all ${images.length} photos` : "View photos"}
          </button>
        )}
      </div>

      <dialog
        ref={dialog}
        className="pkgs-viewer"
        aria-label={`${title}: photos`}
        onClose={() => {
          setCurrent(null);
          opener.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        {active && (
          <>
            <button type="button" className="pkgs-viewer-close" onClick={() => setCurrent(null)}>
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              <span className="sr-only">Close photos</span>
            </button>
            <figure>
              <img src={active.src} alt={active.alt || title} />
              <figcaption>
                <span>
                  {current! + 1} of {images.length}
                </span>
                {active.label && <span className="pkgs-viewer-label">{active.label}</span>}
                {active.caption && <span>{active.caption}</span>}
              </figcaption>
            </figure>
            {images.length > 1 && (
              <>
                <button type="button" className="pkgs-viewer-nav pkgs-viewer-prev" onClick={() => step(-1)}>
                  <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
                  <span className="sr-only">Previous photo</span>
                </button>
                <button type="button" className="pkgs-viewer-nav pkgs-viewer-next" onClick={() => step(1)}>
                  <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                  <span className="sr-only">Next photo</span>
                </button>
              </>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
