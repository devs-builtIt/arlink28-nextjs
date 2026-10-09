"use client";

import { useRef, useState, type FormEvent } from "react";
import type { AdminDestinationDetail, Attraction } from "@arlink28/api-client";
import Notice from "@/components/admin/Notice";
import { SaveBar, newKey, useSaver } from "@/components/admin/SectionSave";
import { Spinner } from "@/components/admin/ui";
import { ApiError } from "@/utils/api/client";
import { adminDestinationsApi } from "@/utils/api/destinations";
import { PHOTO_ACCEPT, checkPhotos } from "@/utils/photos";

const MAX = 50;

type Row = {
  key: string;
  /** Present once the attraction has been saved. Only then can it have a photo. */
  id?: string;
  name: string;
  summary: string;
  photoPath: string;
  photoAlt: string;
  photoCredit: string;
};

const toRow = (a: Attraction): Row => ({
  key: a.id,
  id: a.id,
  name: a.name,
  summary: a.summary ?? "",
  photoPath: a.photoPath ?? "",
  photoAlt: a.photoAlt ?? "",
  photoCredit: a.photoCredit ?? "",
});

const blankRow = (): Row => ({ key: newKey(), name: "", summary: "", photoPath: "", photoAlt: "", photoCredit: "" });

/** What counts as a change: the words and the order. A photo's file is saved by its own upload. */
const signature = (rows: Row[]) =>
  JSON.stringify(
    rows.map((r) => [r.id ?? null, r.name.trim(), r.summary.trim(), r.photoAlt.trim(), r.photoCredit.trim()]),
  );

type Props = { destination: AdminDestinationDetail; onChange: (d: AdminDestinationDetail) => void };

/** The things to do: add, reorder and remove them, and give each a photo. The list saves as a whole. */
export default function AttractionsEditor({ destination, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>(() =>
    [...destination.attractions].sort((a, b) => a.sortOrder - b.sortOrder).map(toRow),
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const saver = useSaver();
  // The signature of what is saved. Photos and other tabs may change the destination without touching this list.
  const saved = useRef(signature(rows));

  const dirty = signature(rows) !== saved.current;
  const blocked = rows.some((r) => !r.name.trim())
    ? "Every attraction needs a name."
    : rows.length > MAX
      ? `A destination can list at most ${MAX} attractions.`
      : undefined;

  const edit = (key: string, patch: Partial<Row>) => {
    saver.clearSaved();
    setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  const move = (index: number, by: -1 | 1) => {
    saver.clearSaved();
    setRows((all) => {
      const next = [...all];
      const to = index + by;
      if (to < 0 || to >= next.length) return all;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  };
  const remove = (key: string) => {
    saver.clearSaved();
    setRows((all) => all.filter((r) => r.key !== key));
  };

  function save(e: FormEvent) {
    e.preventDefault();
    if (blocked) return;
    saver.run(
      () =>
        adminDestinationsApi.replaceAttractions(
          destination.id,
          rows.map((r) => ({
            id: r.id,
            name: r.name.trim(),
            summary: r.summary.trim(),
            photoAlt: r.photoAlt.trim(),
            photoCredit: r.photoCredit.trim(),
          })),
        ),
      (updated) => {
        const next = [...updated.attractions].sort((a, b) => a.sortOrder - b.sortOrder).map(toRow);
        setRows(next);
        saved.current = signature(next);
        onChange(updated);
      },
      (err) => saver.setFieldErrors(err instanceof ApiError ? err.fieldErrors : undefined),
    );
  }

  async function addPhoto(row: Row, list: FileList | null, reset: () => void) {
    const picked = list?.[0];
    reset();
    if (!picked || !row.id) return;
    const { ok, problems } = checkPhotos([picked]);
    setProblems(problems);
    if (ok.length === 0) return;
    setUploading(row.key);
    setPhotoError("");
    try {
      // A replacement starts with no credit: the old one belonged to the old picture.
      const replacing = row.photoPath !== "";
      const updated = await adminDestinationsApi.setAttractionPhoto(
        destination.id,
        row.id,
        ok[0],
        replacing ? undefined : row.photoAlt.trim() || undefined,
        replacing ? undefined : row.photoCredit.trim() || undefined,
      );
      const fresh = updated.attractions.find((a) => a.id === row.id);
      if (fresh) {
        // Only this row takes the new photo: the words typed in the others stay as they are.
        setRows((all) =>
          all.map((r) =>
            r.key === row.key
              ? {
                  ...r,
                  photoPath: fresh.photoPath ?? "",
                  photoAlt: fresh.photoAlt ?? "",
                  photoCredit: fresh.photoCredit ?? "",
                }
              : r,
          ),
        );
        // The photo's words are now saved: count them as saved, so they don't show as an unsaved change.
        saved.current = JSON.stringify(
          (JSON.parse(saved.current) as (string | null)[][]).map((entry) =>
            entry[0] === row.id ? [entry[0], entry[1], entry[2], fresh.photoAlt ?? "", fresh.photoCredit ?? ""] : entry,
          ),
        );
      }
      onChange(updated);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "The photo didn't upload. Try again.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <form onSubmit={save}>
      {problems.length > 0 && (
        <Notice tone="error">
          <ul className="problem-list">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Notice>
      )}
      {photoError && <Notice tone="error">{photoError}</Notice>}

      {rows.length === 0 ? (
        <p className="empty photos-empty">
          No attractions yet.{" "}
          {destination.kind === "Place"
            ? "A place needs at least one before it can be published."
            : "Add the things worth the trip."}
        </p>
      ) : (
        <ol className="pk-dest-rows" aria-label="Attractions">
          {rows.map((r, i) => (
            <li className="pk-dest-row" key={r.key}>
              <div className="pk-dest-row-main">
                <div className="field">
                  <label htmlFor={`a-name-${r.key}`}>Name</label>
                  <input
                    id={`a-name-${r.key}`}
                    className="input"
                    value={r.name}
                    onChange={(e) => edit(r.key, { name: e.target.value })}
                    maxLength={120}
                    placeholder="River safari"
                    disabled={saver.saving}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`a-sum-${r.key}`}>What it is</label>
                  <textarea
                    id={`a-sum-${r.key}`}
                    className="input textarea"
                    rows={2}
                    value={r.summary}
                    onChange={(e) => edit(r.key, { summary: e.target.value })}
                    maxLength={300}
                    disabled={saver.saving}
                  />
                </div>

                {r.id ? (
                  <div className="pk-dest-row-photo">
                    {r.photoPath && <img src={r.photoPath} alt={r.photoAlt || r.name} />}
                    <div>
                      <label className="btn btn-quiet btn-s">
                        <input
                          type="file"
                          accept={PHOTO_ACCEPT}
                          className="sr-only"
                          disabled={uploading !== null || saver.saving}
                          onChange={(e) => {
                            const input = e.target;
                            void addPhoto(r, input.files, () => {
                              input.value = "";
                            });
                          }}
                        />
                        {uploading === r.key && <Spinner />}
                        {uploading === r.key
                          ? "Uploading"
                          : r.photoPath
                            ? `Replace the photo of ${r.name || "this attraction"}`
                            : `Add a photo for ${r.name || "this attraction"}`}
                      </label>
                      {r.photoPath && (
                        <div className="field-row">
                          <div className="field">
                            <label htmlFor={`a-alt-${r.key}`}>Describe the photo</label>
                            <input
                              id={`a-alt-${r.key}`}
                              className="input"
                              value={r.photoAlt}
                              onChange={(e) => edit(r.key, { photoAlt: e.target.value })}
                              maxLength={250}
                              disabled={saver.saving}
                            />
                          </div>
                          <div className="field">
                            <label htmlFor={`a-credit-${r.key}`}>Photo credit</label>
                            <input
                              id={`a-credit-${r.key}`}
                              className="input"
                              value={r.photoCredit}
                              onChange={(e) => edit(r.key, { photoCredit: e.target.value })}
                              maxLength={250}
                              disabled={saver.saving}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="field-hint">Save the list first, then you can add a photo.</p>
                )}
              </div>

              <div className="pk-dest-row-actions">
                <button
                  type="button"
                  className="btn btn-quiet btn-s btn-icon"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || saver.saving}
                  aria-label={`Move ${r.name || `attraction ${i + 1}`} earlier`}
                >
                  <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-quiet btn-s btn-icon"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1 || saver.saving}
                  aria-label={`Move ${r.name || `attraction ${i + 1}`} later`}
                >
                  <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-quiet btn-s"
                  onClick={() => remove(r.key)}
                  disabled={saver.saving}
                  aria-label={`Remove ${r.name || `attraction ${i + 1}`}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="pk-dest-add">
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            saver.clearSaved();
            setRows((all) => [...all, blankRow()]);
          }}
          disabled={rows.length >= MAX || saver.saving}
        >
          <i className="fa-solid fa-plus" aria-hidden="true"></i>
          Add an attraction
        </button>
        <span className="field-hint">Removing one deletes its photo when you save.</span>
      </div>

      <SaveBar dirty={dirty} {...saver} blocked={blocked} label="Save attractions" />
    </form>
  );
}
