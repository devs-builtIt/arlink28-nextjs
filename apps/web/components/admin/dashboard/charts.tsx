"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useCountUp, useReveal } from "./motion";

/* ── helpers ───────────────────────────────────────────────────────────────────────────────────── */

type Pt = { x: number; y: number };

/** A smooth line through the points that never overshoots them (monotone cubic, as d3's curveMonotoneX). */
export function smoothPath(points: Pt[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0].x},${points[0].y}`;
  const dx: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x || 1;
    d[i] = (points[i + 1].y - points[i].y) / dx[i];
  }
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * d[i];
        m[i + 1] = t * b * d[i];
      }
    }
  }
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const w = dx[i] / 3;
    path += `C${points[i].x + w},${points[i].y + m[i] * w},${points[i + 1].x - w},${points[i + 1].y - m[i + 1] * w},${points[i + 1].x},${points[i + 1].y}`;
  }
  return path;
}

/** A tidy top for an axis (4, 8, 20, 40, 100...) and the step between its gridlines. */
export function niceScale(max: number, ticks = 4): { top: number; step: number } {
  if (max <= 0) return { top: ticks, step: 1 };
  const raw = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  return { top: Math.ceil(max / step) * step, step };
}

export const compact = (n: number) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/* ── Count ─────────────────────────────────────────────────────────────────────────────────────── */

/** A figure that counts up to its value. */
export function Count({
  value,
  start,
  format = (n: number) => Math.round(n).toLocaleString(),
}: {
  value: number;
  start: boolean;
  format?: (n: number) => string;
}) {
  const shown = useCountUp(value, start);
  return <span className="dv-num">{format(shown)}</span>;
}

/* ── Sparkline ─────────────────────────────────────────────────────────────────────────────────── */

export function Sparkline({ values, start, label }: { values: number[]; start: boolean; label: string }) {
  const id = useId();
  const progress = useReveal(start, 1200, values.length);
  const W = 160;
  const H = 44;
  const pad = 4;
  const max = Math.max(1, ...values);
  const points = values.map((v, i) => ({
    x: pad + (values.length === 1 ? (W - 2 * pad) / 2 : (i / (values.length - 1)) * (W - 2 * pad)),
    y: H - pad - (v / max) * (H - 2 * pad),
  }));
  const line = smoothPath(points);
  const last = points[points.length - 1];

  return (
    <svg className="dv-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x="0" y="0" width={W * progress} height={H} />
        </clipPath>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {points.length > 1 && (
        <>
          <path
            d={`${line}L${last.x},${H}L${points[0].x},${H}Z`}
            fill={`url(#${id}-fill)`}
            clipPath={`url(#${id}-clip)`}
          />
          <path d={line} className="dv-spark-line" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
        </>
      )}
    </svg>
  );
}

/* ── Area chart ────────────────────────────────────────────────────────────────────────────────── */

export type SeriesPoint = { label: string; value: number; previous?: number };

export function AreaChart({
  points,
  start,
  replayKey,
  showPrevious,
  unit,
}: {
  points: SeriesPoint[];
  start: boolean;
  replayKey: unknown;
  showPrevious: boolean;
  unit: string;
}) {
  const id = useId();
  const [boxRef, width] = useWidth<HTMLDivElement>();
  const progress = useReveal(start && width > 0, 1300, replayKey);
  const [active, setActive] = useState<number | null>(null);

  const H = 280;
  const m = { top: 16, right: 12, bottom: 30, left: 38 };
  const innerW = Math.max(0, width - m.left - m.right);
  const innerH = H - m.top - m.bottom;
  const max = Math.max(1, ...points.map((p) => Math.max(p.value, showPrevious ? (p.previous ?? 0) : 0)));
  const { top, step } = niceScale(max);
  const x = (i: number) => m.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => m.top + innerH - (v / top) * innerH;

  const cur = points.map((p, i) => ({ x: x(i), y: y(p.value) }));
  const prev = points.map((p, i) => ({ x: x(i), y: y(p.previous ?? 0) }));
  const line = smoothPath(cur);
  const area =
    cur.length > 1 ? `${line}L${cur[cur.length - 1].x},${m.top + innerH}L${cur[0].x},${m.top + innerH}Z` : "";

  const gridValues: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) gridValues.push(v);
  const tickCount = Math.min(points.length, width < 520 ? 4 : 7);
  const tickIdx = Array.from({ length: tickCount }, (_, i) =>
    tickCount === 1 ? 0 : Math.round((i / (tickCount - 1)) * (points.length - 1)),
  );

  const nearest = (clientX: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const px = clientX - rect.left;
    if (points.length <= 1) return 0;
    const i = Math.round(((px - m.left) / innerW) * (points.length - 1));
    return Math.min(points.length - 1, Math.max(0, i));
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => setActive(nearest(e.clientX, e.currentTarget));
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") setActive((a) => Math.min(points.length - 1, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? points.length) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const hover = active !== null ? points[active] : null;
  const total = points.reduce((s, p) => s + p.value, 0);
  const peak = points.reduce((best, p) => (p.value > best.value ? p : best), points[0] ?? { label: "", value: 0 });
  const summary = `${total} ${unit} in total. The busiest was ${peak.label}, with ${peak.value}. Use the arrow keys to read each one.`;

  return (
    <div
      className="dv-area"
      ref={boxRef}
      style={{ height: H }}
      tabIndex={0}
      role="img"
      aria-label={summary}
      onPointerMove={onMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
    >
      {width > 0 && (
        <svg width={width} height={H} aria-hidden="true">
          <defs>
            <clipPath id={`${id}-clip`}>
              <rect x={m.left - 2} y="0" width={(innerW + 4) * progress} height={H} />
            </clipPath>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="dv-area-stop" stopOpacity="0.22" />
              <stop offset="1" className="dv-area-stop" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridValues.map((v) => (
            <g key={v}>
              <line className="dv-gridline" x1={m.left} x2={width - m.right} y1={y(v)} y2={y(v)} />
              <text className="dv-axis" x={m.left - 10} y={y(v)} textAnchor="end" dominantBaseline="middle">
                {compact(v)}
              </text>
            </g>
          ))}
          {tickIdx.map((i, k) => (
            <text
              key={`${i}-${k}`}
              className="dv-axis"
              x={x(i)}
              y={H - 8}
              textAnchor={k === 0 ? "start" : k === tickIdx.length - 1 ? "end" : "middle"}
            >
              {points[i].label}
            </text>
          ))}

          {showPrevious && (
            <path
              className="dv-line-prev"
              d={smoothPath(prev)}
              pathLength={1}
              strokeDasharray="0.012 0.012"
              style={{ opacity: progress }}
            />
          )}
          {area && <path d={area} fill={`url(#${id}-fill)`} clipPath={`url(#${id}-clip)`} />}
          <path className="dv-line" d={line} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />

          {active !== null && (
            <g>
              <line className="dv-cross" x1={cur[active].x} x2={cur[active].x} y1={m.top} y2={m.top + innerH} />
              {showPrevious && <circle className="dv-dot-prev" cx={prev[active].x} cy={prev[active].y} r="4" />}
              <circle className="dv-dot" cx={cur[active].x} cy={cur[active].y} r="5.5" />
            </g>
          )}
        </svg>
      )}

      {hover && active !== null && (
        <div
          className="dv-tip"
          style={{
            left: Math.min(Math.max(cur[active].x, 80), Math.max(80, width - 80)),
            top: Math.max(0, cur[active].y - 12),
          }}
        >
          <span className="dv-tip-label">{hover.label}</span>
          <strong>
            {hover.value} <small>{hover.value === 1 ? unit.replace(/ies$/, "y").replace(/s$/, "") : unit}</small>
          </strong>
          {showPrevious && hover.previous !== undefined && (
            <span className="dv-tip-prev">
              Before: {hover.previous}
              {hover.previous > 0 && (
                <em className={hover.value >= hover.previous ? "is-up" : "is-down"}>
                  {hover.value >= hover.previous ? "+" : ""}
                  {Math.round(((hover.value - hover.previous) / hover.previous) * 100)}%
                </em>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Donut ─────────────────────────────────────────────────────────────────────────────────────── */

export type Slice = { key: string; label: string; value: number; color: string };

export function Donut({ slices, start, centreLabel }: { slices: Slice[]; start: boolean; centreLabel: string }) {
  const progress = useReveal(start, 1300, slices.length);
  const [hot, setHot] = useState<string | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const size = 168;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 3 : 0;

  let offset = 0;
  const arcs = slices.map((s) => {
    const length = total ? (s.value / total) * c : 0;
    const begin = offset;
    offset += length;
    const drawn = Math.max(0, Math.min(length, progress * c - begin));
    return { ...s, begin, length, drawn };
  });
  const shownTotal = useCountUp(total, start);

  return (
    <div className="dv-donut">
      <div className="dv-donut-art">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${total} ${centreLabel}, split by type`}>
          <circle className="dv-donut-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
          {arcs.map((a) => (
            <circle
              key={a.key}
              className="dv-donut-arc"
              cx={size / 2}
              cy={size / 2}
              r={r}
              strokeWidth={hot === a.key ? stroke + 4 : stroke}
              stroke={a.color}
              strokeDasharray={`${Math.max(0, a.drawn - gap)} ${c}`}
              strokeDashoffset={-a.begin}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ opacity: hot && hot !== a.key ? 0.35 : 1 }}
              onPointerEnter={() => setHot(a.key)}
              onPointerLeave={() => setHot(null)}
            />
          ))}
        </svg>
        <div className="dv-donut-centre">
          <span className="dv-num">{Math.round(shownTotal).toLocaleString()}</span>
          <small>{centreLabel}</small>
        </div>
      </div>
      <ul className="dv-legend">
        {slices.map((s) => (
          <li
            key={s.key}
            className={hot === s.key ? "is-hot" : undefined}
            onPointerEnter={() => setHot(s.key)}
            onPointerLeave={() => setHot(null)}
          >
            <i style={{ background: s.color }} aria-hidden="true" />
            <span>{s.label}</span>
            <strong>{s.value}</strong>
            <em>{total ? Math.round((s.value / total) * 100) : 0}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Bars ──────────────────────────────────────────────────────────────────────────────────────── */

export type BarItem = { key: string; label: string; value: number; sub?: string; color?: string; href?: string };

export function BarList({ items, start, max }: { items: BarItem[]; start: boolean; max?: number }) {
  const progress = useReveal(start, 1000, items.length);
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="dv-bars">
      {items.map((item, i) => {
        // Rows start one after another.
        const local = Math.min(1, Math.max(0, progress * 1.4 - i * 0.12));
        return (
          <li key={item.key}>
            <div className="dv-bars-row">
              <span className="dv-bars-label" title={item.label}>
                {item.label}
              </span>
              <strong>{item.value}</strong>
            </div>
            <div className="dv-track">
              <div
                className="dv-fill"
                style={{ width: `${(item.value / top) * 100 * local}%`, background: item.color }}
                role="presentation"
              />
            </div>
            {item.sub && <small>{item.sub}</small>}
          </li>
        );
      })}
    </ul>
  );
}

/** Columns that rise from the baseline, the highest one in the strong colour. */
export function Columns({
  values,
  labels,
  start,
  unit,
}: {
  values: number[];
  labels: string[];
  start: boolean;
  unit: string;
}) {
  const progress = useReveal(start, 1000, values.join());
  const max = Math.max(1, ...values);
  const best = values.indexOf(Math.max(...values));
  const [hot, setHot] = useState<number | null>(null);
  return (
    <div
      className="dv-cols"
      role="img"
      aria-label={`${unit} by day of the week: ${labels.map((l, i) => `${l} ${values[i]}`).join(", ")}`}
    >
      {values.map((v, i) => {
        const local = Math.min(1, Math.max(0, progress * 1.5 - i * 0.07));
        const strong = values.some((n) => n > 0) && i === best;
        return (
          <div
            key={labels[i]}
            className={`dv-col${strong ? " is-top" : ""}${hot === i ? " is-hot" : ""}`}
            onPointerEnter={() => setHot(i)}
            onPointerLeave={() => setHot(null)}
          >
            <span className="dv-col-value" style={{ opacity: hot === i || strong ? 1 : 0 }}>
              {v}
            </span>
            <div className="dv-col-track">
              <div className="dv-col-bar" style={{ height: `${Math.max(v > 0 ? 4 : 0, (v / max) * 100) * local}%` }} />
            </div>
            <span className="dv-col-label">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Stacked horizontal bar: segments grow in left to right. */
export function Stack({
  segments,
  start,
}: {
  segments: { key: string; label: string; value: number; color: string }[];
  start: boolean;
}) {
  const progress = useReveal(start, 1000, segments.map((s) => s.value).join());
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div className="dv-stack" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
      {total === 0 ? (
        <span className="dv-stack-empty" />
      ) : (
        segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <span
              key={s.key}
              className="dv-stack-seg"
              title={`${s.label}: ${s.value}`}
              style={{ width: `${(s.value / total) * 100 * progress}%`, background: s.color }}
            />
          ))
      )}
    </div>
  );
}
