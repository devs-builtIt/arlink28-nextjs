"use client";

import { useState } from "react";
import Notice from "@/components/admin/Notice";
import { Spinner } from "@/components/admin/ui";

let counter = 0;
/** A stable key for a form row that has no id yet. */
export const newKey = () => `row-${++counter}`;

/** Runs a save and tracks the state a section's Save button and messages need. */
export function useSaver() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>();

  async function run<T>(action: () => Promise<T>, done: (result: T) => void, fail?: (err: unknown) => void) {
    setError("");
    setFieldErrors(undefined);
    setSaved(false);
    setSaving(true);
    try {
      done(await action());
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The changes weren't saved. Try again.");
      fail?.(err);
    } finally {
      setSaving(false);
    }
  }

  return { saving, saved, error, fieldErrors, setFieldErrors, run, clearSaved: () => setSaved(false) };
}

type Props = {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string;
  label?: string;
  /** Something the section can't save yet, e.g. a price that isn't a number. Shown instead of sending. */
  blocked?: string;
};

/** The error, then a foot bar: what state the section is in, and its Save button (off until something changes). */
export function SaveBar({ dirty, saving, saved, error, label = "Save changes", blocked }: Props) {
  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="form-actions">
        <span className="save-state">
          {saved && !dirty ? (
            <span className="saved-note" role="status">
              Saved
            </span>
          ) : blocked && dirty ? (
            blocked
          ) : dirty ? (
            "Unsaved changes"
          ) : null}
        </span>
        <button className="btn btn-primary" type="submit" disabled={saving || !dirty || !!blocked}>
          {saving && <Spinner />}
          {saving ? "Saving" : label}
        </button>
      </div>
    </>
  );
}
