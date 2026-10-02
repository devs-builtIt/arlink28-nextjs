"use client";

import { useId, useMemo, useRef, useState } from "react";
import { AIRPORTS, POPULAR, type Airport } from "@/content/airports";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  name: string;
};

export const airportLabel = (a: Airport) => `${a.city} (${a.code})`;

/** Finds the airport a stored value like "Lagos (LOS)" points at, or null for free text. */
export const findAirport = (code: string) => AIRPORTS.find((a) => a.code === code) ?? null;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** A search box over the airport list. Anything typed that is not in the list is kept as typed. */
export default function AirportField({ label, value, onChange, placeholder, error, name }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const options = useMemo(() => {
    const q = norm(value.trim());
    if (!q) return POPULAR.map((code) => findAirport(code)).filter((a): a is Airport => a !== null);
    return AIRPORTS.filter((a) => norm(`${a.city} ${a.code} ${a.country} ${a.airport}`).includes(q)).slice(0, 8);
  }, [value]);

  const choose = (a: Airport) => {
    onChange(airportLabel(a));
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="hm-field hm-combo">
      <label htmlFor={id}>{label}</label>
      <input
        ref={input}
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${id}-${options[active].code}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off"
        autoCapitalize="words"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKey}
      />
      {open && options.length > 0 && (
        <ul className="hm-listbox" id={listId} role="listbox" aria-label={`${label} suggestions`}>
          {options.map((a, i) => (
            <li
              key={a.code}
              id={`${id}-${a.code}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "is-active" : undefined}
              // mousedown, not click: the input's blur would close the list before a click lands.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(a);
              }}
            >
              <span className="hm-code">{a.code}</span>
              <span>
                {a.city}
                <small>
                  {a.airport ? `${a.airport}, ` : ""}
                  {a.country}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="hm-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
