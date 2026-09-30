"use client";

import { useEffect, useState } from "react";

const KEY = "arlink28:saved-packages";

const read = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

/** A heart on a package's photo, to keep it for later. Kept in this browser only, for now. */
export default function SaveButton({ slug, title }: { slug: string; title: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => setSaved(read().includes(slug)), [slug]);

  function toggle() {
    const next = !saved;
    setSaved(next);
    try {
      const list = read().filter((s) => s !== slug);
      localStorage.setItem(KEY, JSON.stringify(next ? [...list, slug] : list));
    } catch {
      // Storage can be blocked. The heart still answers; it just won't be remembered.
    }
  }

  return (
    <button
      type="button"
      className="pkgs-heart"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      onClick={toggle}
    >
      <i className={saved ? "fa-solid fa-heart" : "fa-regular fa-heart"} aria-hidden="true"></i>
    </button>
  );
}
