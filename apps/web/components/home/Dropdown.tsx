"use client";

import { useEffect, useId, useRef, useState } from "react";

export type DropdownOption = { value: string; label: string };

/** Party sizes as ranges, so the list stays short. The value is what the team reads in the request. */
export const PARTY_SIZES: DropdownOption[] = [
  { value: "1 person", label: "1 person" },
  { value: "2 people", label: "2 people" },
  { value: "3 to 5 people", label: "3 to 5 people" },
  { value: "6 to 9 people", label: "6 to 9 people" },
  { value: "10 or more", label: "10 or more" },
];

/** The same ranges with short labels, for narrow fields. */
export const PARTY_SIZES_SHORT: DropdownOption[] = PARTY_SIZES.map((o, i) => ({
  value: o.value,
  label: ["1", "2", "3 to 5", "6 to 9", "10+"][i],
}));

type Props = {
  id: string;
  name: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
};

/**
 * A select with our own list, so it looks the same in every browser and theme. It follows the listbox
 * pattern: the button opens the list; arrows, Home, End and letters move; Enter or Space chooses; Escape closes.
 */
export default function Dropdown({ id, name, value, options, onChange, placeholder = "Choose", invalid }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const selected = options.findIndex((o) => o.value === value);

  const show = () => {
    setActive(selected >= 0 ? selected : 0);
    setOpen(true);
  };
  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
  };

  // A click anywhere outside the dropdown closes it.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Keep the highlighted row in view when the list scrolls.
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key.length === 1) {
      const next = options.findIndex((o, i) => i > active && o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      const first = next >= 0 ? next : options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (first >= 0) setActive(first);
    }
  }

  return (
    <div className="dd" ref={root}>
      <button
        type="button"
        id={id}
        name={name}
        className="dd-btn"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
      >
        <span className={selected >= 0 ? undefined : "dd-placeholder"}>
          {selected >= 0 ? options[selected].label : placeholder}
        </span>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
        </svg>
      </button>
      {open && (
        <ul className="dd-list" id={listId} role="listbox" ref={list} aria-labelledby={id}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === selected}
              className={i === active ? "is-active" : undefined}
              // mousedown, not click: it keeps focus on the button, so the list does not close first.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(i);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span>{o.label}</span>
              {i === selected && (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m3 8.5 3.2 3.2L13 4.8" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
