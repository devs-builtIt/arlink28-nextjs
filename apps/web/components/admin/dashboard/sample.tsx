"use client";

import { createContext, useContext, useEffect, useState } from "react";

const KEY = "arlink-dashboard-sample";

const SampleContext = createContext(true);

/** Whether the cards that run on sample figures are showing them. */
export const useShowSample = () => useContext(SampleContext);
export const SampleProvider = SampleContext.Provider;

/** The choice is remembered in this browser; it falls back to showing the samples when storage is unavailable. */
export function useSamplePreference(): [boolean, (show: boolean) => void] {
  const [show, setShow] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "off") setShow(false);
    } catch {
      // Storage blocked: keep the default.
    }
  }, []);
  const update = (next: boolean) => {
    setShow(next);
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {
      // The choice just lasts for this visit.
    }
  };
  return [show, update];
}

export function SamplePill() {
  return (
    <span className="dv-sample" title="Sample figures, not real records">
      Sample
    </span>
  );
}

/** What a sample card shows when sample figures are switched off. */
export function NotConnected({ title, what }: { title?: string; what: string }) {
  return (
    <div className="dv-notconnected">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 7H6a4 4 0 0 0 0 8h3m6-8h3a4 4 0 0 1 0 8h-3M8 11h8" />
      </svg>
      {title && <strong>{title}</strong>}
      <p>Not connected yet. This fills in once {what} are recorded.</p>
    </div>
  );
}

/** The note above a tab that is built on sample figures, with the switch that hides them. */
export function SampleBanner({
  show,
  onChange,
  what,
}: {
  show: boolean;
  onChange: (show: boolean) => void;
  what: string;
}) {
  return (
    <div className="dv-banner" role="note">
      <div>
        <strong>Sample figures</strong>
        <p>
          {what} aren&apos;t recorded in the system yet, so the cards marked <SamplePill /> show what this page will
          look like with real records. Nothing on them is real.
        </p>
      </div>
      <label className="dv-switch">
        <input type="checkbox" checked={show} onChange={(e) => onChange(e.target.checked)} />
        <span aria-hidden="true" />
        Show samples
      </label>
    </div>
  );
}
