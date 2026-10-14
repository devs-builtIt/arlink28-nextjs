"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AdminPackageList } from "@arlink28/api-client";
import { usePackageMoves, type PackageMove } from "@/components/admin/usePackageMoves";
import { adminPackagesApi } from "@/utils/api/packages";

type Item = AdminPackageList["items"][number];

/**
 * The three-dot menu at the end of a table row: edit, publish or take off the site, archive. The menu is
 * fixed to the screen, not the table, so the table's own scrolling cannot clip it.
 */
export default function PackageRowMenu({ item: p, onChanged }: { item: Item; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{ top: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const { busy, confirming, setConfirming, missing, error, move } = usePackageMoves(() => {
    setOpen(false);
    onChanged();
  });

  const published = p.status === "Published";
  const archived = p.status === "Archived";

  function toggle() {
    if (open) return setOpen(false);
    const r = button.current!.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    setAt({ top: below < 230 ? Math.max(8, r.top - 190) : r.bottom + 6, right: window.innerWidth - r.right });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    setConfirming(null);
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        button.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const ask = (kind: PackageMove, label: string, run: () => ReturnType<typeof adminPackagesApi.archive>) => (
    <button
      type="button"
      role="menuitem"
      className={confirming === kind ? "is-danger" : undefined}
      disabled={busy}
      onClick={() => (confirming === kind ? move(run) : setConfirming(kind))}
    >
      {confirming === kind ? "Sure?" : label}
    </button>
  );

  return (
    <span className="pk-rowmenu" onClick={(e) => e.stopPropagation()}>
      <button
        ref={button}
        type="button"
        className="pk-dots"
        aria-label={`Actions for ${p.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <i className="fa-solid fa-ellipsis" aria-hidden="true"></i>
      </button>
      {open && at && (
        <div ref={menu} className="pk-menu" role="menu" style={{ top: at.top, right: at.right }}>
          <Link role="menuitem" href={`/admin/packages/${p.id}`}>
            Edit
          </Link>
          {p.status === "Draft" && (
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => move(() => adminPackagesApi.publish(p.id))}
            >
              {busy ? "Publishing" : "Publish"}
            </button>
          )}
          {archived && (
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => move(() => adminPackagesApi.unpublish(p.id))}
            >
              Move to drafts
            </button>
          )}
          {published && ask("unpublish", "Take off the site", () => adminPackagesApi.unpublish(p.id))}
          {!archived && ask("archive", "Archive", () => adminPackagesApi.archive(p.id))}
          {(error || missing.length > 0) && (
            <div className="pk-menu-note" role="alert">
              {error || (
                <>
                  Not ready to publish. Still needed:
                  <ul>
                    {missing.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
