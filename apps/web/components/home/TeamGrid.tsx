"use client";

import { useEffect, useRef, useState } from "react";
import type { Person } from "@/content/team";

const Arrow = () => (
  <span className="hm-go" aria-hidden="true">
    <svg viewBox="0 0 16 16">
      <path d="M4 12 12 4M5.5 4H12v6.5" />
    </svg>
  </span>
);

/**
 * The team: the advisory chairman in a feature card, then the coordinators in a grid. Choosing a person opens their
 * full biography in a dialog, so the page itself stays short.
 */
export default function TeamGrid({ people }: { people: Person[] }) {
  const [lead, ...rest] = people;
  const [open, setOpen] = useState<Person | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const show = (p: Person, el: HTMLElement) => {
    opener.current = el;
    setOpen(p);
  };
  // Every way of closing (the button, Esc, a click outside) ends in the dialog's own close event.
  const close = () => dialog.current?.close();

  return (
    <>
      <section className="hm-sec hm-sec-white" data-tone="light" aria-label="Advisory chairman">
        <div className="hm-wrap">
          <div className="tm-lead" data-rv>
            <div className="tm-lead-photo">
              <img src={lead.photo} alt={lead.alt} width={228} height={220} decoding="async" />
            </div>
            <div className="tm-lead-body">
              <span className="hm-sticker" aria-hidden="true">
                {lead.group}
              </span>
              <h2>
                {lead.name}
                <br />
                <span className="hm-dim">{lead.role}</span>
              </h2>
              <p>{lead.bio[0]}</p>
              <button type="button" className="hm-btn hm-btn-primary" onClick={(e) => show(lead, e.currentTarget)}>
                Read the full bio
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="hm-sec" aria-labelledby="tm-coordinators">
        <div className="hm-wrap">
          <h2 className="hm-title hm-title-left tm-heading" id="tm-coordinators" data-rv>
            <span className="hm-sticker" aria-hidden="true">
              Coordinators
            </span>
            The coordinators
            <br />
            <span className="hm-dim">behind each team.</span>
          </h2>
          <ul className="tm-grid">
            {rest.map((p, i) => (
              <li key={p.id} data-rv style={{ ["--i" as string]: i % 4 }}>
                <button type="button" className="tm-card" onClick={(e) => show(p, e.currentTarget)}>
                  <span className="tm-photo">
                    <img src={p.photo} alt={p.alt} loading="lazy" decoding="async" width={768} height={1024} />
                    <span className="hm-chip">{p.group}</span>
                    <Arrow />
                  </span>
                  <strong>{p.name}</strong>
                  <span className="tm-role">{p.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <dialog
        ref={dialog}
        className="tm-dialog"
        aria-labelledby="tm-dialog-name"
        onClose={() => {
          setOpen(null);
          opener.current?.focus();
        }}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        {open && (
          <div className="tm-dialog-in">
            <div className="tm-dialog-photo">
              <img src={open.photo} alt={open.alt} width={768} height={1024} />
            </div>
            <div className="tm-dialog-body">
              <span className="hm-sticker" aria-hidden="true">
                {open.group}
              </span>
              <h2 id="tm-dialog-name">
                {open.name}
                <br />
                <span className="hm-dim">{open.role}</span>
              </h2>
              <div className="tm-bio">
                {open.bio.map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
              </div>
            </div>
            <button type="button" className="tm-close" onClick={close} aria-label="Close">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
