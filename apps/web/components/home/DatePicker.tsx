"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./datepicker.css";

export type DatePickerHandle = { open: () => void; focus: () => void };

type Props = {
  id: string;
  name: string;
  /** What the calendar is called to a screen reader, for example "Choose a departure date". */
  ariaLabel: string;
  /** A date as YYYY-MM-DD, or "" for none. */
  value: string;
  onChange: (value: string) => void;
  /** The earliest date that can be picked, as YYYY-MM-DD. */
  min?: string;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  /** Two dates (a trip's start and end) to shade between, as YYYY-MM-DD. */
  range?: [string, string] | null;
};

const POP_WIDTH = 320;
const POP_HEIGHT = 336; // the tallest the calendar gets (six weeks and the Clear row), used to keep it on screen
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
};
const addDays = (s: string, n: number) => {
  const p = parse(s)!;
  const d = new Date(p.y, p.m, p.d + n);
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
};
const todayIso = () => {
  const n = new Date();
  return toIso(n.getFullYear(), n.getMonth(), n.getDate());
};

const monthTitle = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const fullDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDate = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const shortDateYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

const asDate = (s: string) => {
  const p = parse(s)!;
  return new Date(p.y, p.m, p.d);
};
const label = (s: string) => {
  const sameYear = parse(s)!.y === new Date().getFullYear();
  return sameYear ? shortDate.format(asDate(s)).replace(",", "") : shortDateYear.format(asDate(s));
};

/**
 * A date field with its own calendar, so it looks like the rest of the form (the browser's built-in picker cannot be
 * styled). The calendar opens in a layer above the page, so the glass panel it belongs to never clips it, and it can be
 * driven entirely from the keyboard: arrows move by a day or a week, Page Up and Page Down by a month, Enter picks,
 * Escape closes. Weeks start on Monday.
 */
const DatePicker = forwardRef<DatePickerHandle, Props>(function DatePicker(
  { id, name, ariaLabel, value, onChange, min, placeholder = "Select date", invalid, describedBy, range },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ y: 0, m: 0 });
  const [focusDay, setFocusDay] = useState("");
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  // True from opening until the first day has taken focus.
  const fresh = useRef(false);

  const floor = min && parse(min) ? min : todayIso();

  const openPicker = () => {
    const rect = trigger.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - POP_WIDTH - 12));
      const below = rect.bottom + 6;
      const above = rect.top - POP_HEIGHT - 6;
      // Below the field if it fits, else above it, else as low as the screen allows.
      const top =
        below + POP_HEIGHT <= window.innerHeight - 12
          ? below
          : above >= 12
            ? above
            : Math.max(12, window.innerHeight - POP_HEIGHT - 12);
      setPos({ left, top });
    }
    const start = value && parse(value) ? value : floor;
    const p = parse(start)!;
    setView({ y: p.y, m: p.m });
    setFocusDay(start);
    fresh.current = true;
    setOpen(true);
  };

  useImperativeHandle(ref, () => ({ open: openPicker, focus: () => trigger.current?.focus({ preventScroll: true }) }));

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus({ preventScroll: true });
  };

  const choose = (iso: string) => {
    onChange(iso);
    close(true);
  };

  // Put keyboard focus on the current day when the calendar opens and while moving between days. Focus on the month
  // arrows is left alone, so pressing one does not pull it away.
  useEffect(() => {
    if (!open) return;
    const onDay = document.activeElement instanceof HTMLElement && document.activeElement.classList.contains("dp-day");
    if (!fresh.current && !onDay) return;
    const day = pop.current?.querySelector<HTMLButtonElement>(`button[data-iso="${focusDay}"]`);
    if (day) {
      day.focus({ preventScroll: true });
      fresh.current = false;
    }
  }, [open, focusDay, view]);

  // A click anywhere else, a scroll or a resize closes it.
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!pop.current?.contains(t) && !trigger.current?.contains(t)) setOpen(false);
    };
    const leave = () => setOpen(false);
    document.addEventListener("mousedown", away);
    window.addEventListener("scroll", leave, true);
    window.addEventListener("resize", leave);
    return () => {
      document.removeEventListener("mousedown", away);
      window.removeEventListener("scroll", leave, true);
      window.removeEventListener("resize", leave);
    };
  }, [open]);

  const goTo = (iso: string) => {
    if (iso < floor) return;
    const p = parse(iso)!;
    setFocusDay(iso);
    setView({ y: p.y, m: p.m });
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    const next = { y: d.getFullYear(), m: d.getMonth() };
    const f = parse(floor)!;
    if (next.y < f.y || (next.y === f.y && next.m < f.m)) return;
    setView(next);
    // keep the same day of the month where it exists, never earlier than the first allowed date
    const cur = parse(focusDay) ?? { d: 1 };
    const last = new Date(next.y, next.m + 1, 0).getDate();
    const iso = toIso(next.y, next.m, Math.min(cur.d, last));
    setFocusDay(iso < floor ? floor : iso);
  };

  const onGridKey = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in step) {
      e.preventDefault();
      goTo(addDays(focusDay, step[e.key]));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const weekday = (asDate(focusDay).getDay() + 6) % 7;
      goTo(addDays(focusDay, e.key === "Home" ? -weekday : 6 - weekday));
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      shiftMonth((e.key === "PageUp" ? -1 : 1) * (e.shiftKey ? 12 : 1));
    }
  };

  const onPopKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  // Build the month: leading blanks so the 1st lands under the right weekday, then the days, padded to whole weeks.
  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => toIso(view.y, view.m, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const f = parse(floor)!;
  const atFloorMonth = view.y === f.y && view.m === f.m;
  const today = todayIso();

  return (
    <div className="dp">
      <button
        ref={trigger}
        id={id}
        type="button"
        className="dp-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? close(false) : openPicker())}
      >
        <span className={value ? undefined : "dp-placeholder"}>
          {value && parse(value) ? label(value) : placeholder}
        </span>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <rect x="2" y="3.2" width="12" height="10.6" rx="2" />
          <path d="M2 6.6h12M5.4 1.8v2.6M10.6 1.8v2.6" />
        </svg>
      </button>
      <input type="hidden" name={name} value={value} />

      {open &&
        createPortal(
          <div
            ref={pop}
            className="dp-pop"
            role="dialog"
            aria-label={ariaLabel}
            style={{ left: pos.left, top: pos.top }}
            onKeyDown={onPopKey}
          >
            <div className="dp-head">
              <button
                type="button"
                className="dp-nav"
                aria-label="Previous month"
                disabled={atFloorMonth}
                onClick={() => shiftMonth(-1)}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M10 3.5 5.5 8l4.5 4.5" />
                </svg>
              </button>
              <span className="dp-title" aria-live="polite">
                {monthTitle.format(first)}
              </span>
              <button type="button" className="dp-nav" aria-label="Next month" onClick={() => shiftMonth(1)}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m6 3.5 4.5 4.5L6 12.5" />
                </svg>
              </button>
            </div>

            <div role="grid" aria-label={monthTitle.format(first)} className="dp-grid" onKeyDown={onGridKey}>
              <div role="row" className="dp-week">
                {WEEKDAYS.map((w) => (
                  <div key={w} role="columnheader">
                    {w}
                  </div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div role="row" className="dp-row" key={wi}>
                  {week.map((iso, di) => {
                    if (!iso) return <div role="gridcell" key={di} />;
                    const disabled = iso < floor;
                    const selected = iso === value;
                    const edge = !!range && (iso === range[0] || iso === range[1]);
                    const inside = !!range && iso > range[0] && iso < range[1];
                    const cls = [
                      "dp-day",
                      iso === today ? "is-today" : "",
                      selected || edge ? "is-selected" : "",
                      inside ? "is-inside" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <div role="gridcell" key={di} aria-selected={selected || undefined}>
                        <button
                          type="button"
                          className={cls}
                          data-iso={iso}
                          disabled={disabled}
                          tabIndex={iso === focusDay ? 0 : -1}
                          aria-label={fullDate.format(asDate(iso))}
                          aria-current={iso === today ? "date" : undefined}
                          onClick={() => choose(iso)}
                        >
                          {parse(iso)!.d}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {value && (
              <div className="dp-foot">
                <button
                  type="button"
                  className="dp-text"
                  onClick={() => {
                    onChange("");
                    close(true);
                  }}
                >
                  Clear date
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
});

export default DatePicker;
