import type { ReactNode } from "react";

/** A line of the summary beside a create stepper. */
export function SummaryRow({ label, value, empty }: { label: string; value: string; empty?: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd data-empty={value ? undefined : ""}>{value || empty}</dd>
    </div>
  );
}

/** A line of the review step, with a way back to the step that owns it. */
export function ReviewRow({ label, onChange, children }: { label: string; onChange: () => void; children: ReactNode }) {
  return (
    <div className="pk-review-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
      <button
        type="button"
        className="btn btn-quiet btn-s"
        onClick={onChange}
        aria-label={`Change ${label.toLowerCase()}`}
      >
        Change
      </button>
    </div>
  );
}
