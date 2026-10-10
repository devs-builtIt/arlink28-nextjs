"use client";

import { useEffect, useRef, useState } from "react";

/** True when the visitor asked for less motion. Everything here then shows its final state straight away. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Becomes true once the element has been on screen, and stays true. */
export function useInView<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen]);
  return [ref, seen];
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Runs from 0 to 1 over `duration` ms once `start` is true, and again whenever `replayKey` changes. Charts draw
 * themselves from this one number, so a line, its fill and its dots always move together.
 */
export function useReveal(start: boolean, duration = 1100, replayKey: unknown = 0, delay = 0): number {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setProgress(1);
      return;
    }
    let frame = 0;
    let begin = 0;
    setProgress(0);
    const tick = (now: number) => {
      if (!begin) begin = now + delay;
      const t = Math.min(1, Math.max(0, (now - begin) / duration));
      setProgress(easeOutCubic(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, duration, replayKey, delay, reduced]);

  return progress;
}

/** A number that counts up to `value`, and from the old value to a new one when it changes. */
export function useCountUp(value: number, start: boolean, duration = 1000): number {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      from.current = value;
      setShown(value);
      return;
    }
    const origin = from.current;
    let frame = 0;
    let begin = 0;
    const tick = (now: number) => {
      if (!begin) begin = now;
      const t = Math.min(1, (now - begin) / duration);
      const next = origin + (value - origin) * easeOutCubic(t);
      from.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, start, duration, reduced]);

  return shown;
}
