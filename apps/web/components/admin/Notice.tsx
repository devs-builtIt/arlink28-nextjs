import type { ReactNode } from "react";

/** Inline feedback. Errors interrupt screen readers (role=alert); successes don't. */
export default function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <div className={`notice notice-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <i
        className={`fa-solid ${tone === "error" ? "fa-circle-exclamation" : "fa-circle-check"}`}
        aria-hidden="true"
      ></i>
      <div>{children}</div>
    </div>
  );
}
