"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Tab = { id: string; label: string; content: ReactNode };

/**
 * The package's sections as tabs: one shows at a time, next to the price card. The address holds
 * the tab (#prices), so a link opens on it and Back returns to the one before. Every tab's content
 * is still in the page's HTML (hidden), so nothing is lost to search engines or to a slow script.
 */
export default function SectionTabs({ tabs, aside }: { tabs: Tab[]; aside: ReactNode }) {
  const [active, setActive] = useState(tabs[0].id);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const fromAddress = () => {
      const id = window.location.hash.slice(1);
      setActive(tabs.some((t) => t.id === id) ? id : tabs[0].id);
    };
    fromAddress();
    window.addEventListener("hashchange", fromAddress);
    return () => window.removeEventListener("hashchange", fromAddress);
  }, [tabs]);

  function open(id: string) {
    setActive(id);
    window.history.pushState(null, "", `#${id}`);
    // A shorter tab must not leave you looking at the footer: bring the tabs back into view.
    const top = bar.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) bar.current?.scrollIntoView({ block: "start" });
  }

  return (
    <>
      <nav className="pkgs-tabs" aria-label="Sections" ref={bar}>
        <ul>
          {tabs.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                aria-current={active === t.id ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  open(t.id);
                }}
              >
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pkgs-cols">
        <div className="pkgs-main">
          {tabs.map((t) => (
            <div key={t.id} hidden={active !== t.id}>
              {t.content}
            </div>
          ))}
        </div>
        {aside}
      </div>
    </>
  );
}
