"use client";

import { useState } from "react";
import type { PackageMedia } from "@arlink28/api-client";
import Notice from "@/components/admin/Notice";
import PhotoDropzone from "@/components/admin/PhotoDropzone";
import { adminPackagesApi } from "@/utils/api/packages";
import { checkPhotos } from "@/utils/photos";

type Props = {
  packageId: string;
  media: PackageMedia[];
  onChange: (media: PackageMedia[]) => void;
};

const byOrder = (a: PackageMedia, b: PackageMedia) => a.sortKey - b.sortKey;

/** A package's photos: add several at once, choose the main one, reorder, remove. */
export default function PhotoManager({ packageId, media, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);

  const ordered = [...media].sort(byOrder);

  /** Runs one change to the photos and reports a failure in place. */
  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setError("");
    setConfirming(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : failure);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function upload(files: File[]) {
    const { ok, problems } = checkPhotos(files);
    setProblems(problems);
    if (ok.length === 0) return;
    await run(async () => {
      setProgress(0);
      const saved = await adminPackagesApi.uploadPhotos(packageId, ok, setProgress);
      onChange([...media, ...saved]);
    }, "The photos didn't upload. Try again.");
  }

  const reorder = (ids: string[]) => adminPackagesApi.reorderMedia(packageId, ids).then(onChange);

  const makeMain = (id: string) =>
    run(async () => {
      await adminPackagesApi.updateMedia(packageId, id, { role: "Hero" });
      await reorder([id, ...ordered.filter((m) => m.id !== id).map((m) => m.id)]);
    }, "That photo couldn't be made the main one.");

  function move(id: string, by: -1 | 1) {
    const ids = ordered.map((m) => m.id);
    const from = ids.indexOf(id);
    const to = from + by;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    return run(() => reorder(ids), "The photos couldn't be reordered.");
  }

  const remove = (id: string) =>
    run(async () => {
      await adminPackagesApi.deleteMedia(packageId, id);
      // The API promotes the next photo when the main one goes, so ask it what's left.
      onChange((await adminPackagesApi.get(packageId)).media);
    }, "That photo couldn't be removed.");

  return (
    <>
      {problems.length > 0 && (
        <Notice tone="error">
          <ul className="problem-list">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <PhotoDropzone onFiles={upload} disabled={busy} hasPhotos={ordered.length > 0} />

      {progress !== null && (
        <p className="upload-line" role="status">
          <progress className="upload-progress" value={progress} max={1} aria-label="Upload progress" />
          {progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : "Saving…"}
        </p>
      )}

      {ordered.length === 0 ? (
        <p className="empty photos-empty">No photos yet. A package needs a main photo before it can be published.</p>
      ) : (
        <ul className="photo-grid" aria-label="Package photos">
          {ordered.map((m, i) => (
            <li className="photo-tile" key={m.id}>
              <img src={m.path} alt={m.alt ?? ""} />
              {m.role === "Hero" && <span className="photo-badge">Main photo</span>}
              {m.role === "Poster" && <span className="photo-badge photo-badge-quiet">Poster</span>}
              {m.videoProvider && <span className="photo-badge photo-badge-quiet">Video</span>}
              <div className="photo-actions">
                {m.role !== "Hero" && !m.videoProvider && (
                  <button type="button" className="btn btn-quiet btn-s" onClick={() => makeMain(m.id)} disabled={busy}>
                    Make main
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-quiet btn-s btn-icon"
                  onClick={() => move(m.id, -1)}
                  disabled={busy || i === 0}
                  aria-label={`Move photo ${i + 1} earlier`}
                >
                  <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-quiet btn-s btn-icon"
                  onClick={() => move(m.id, 1)}
                  disabled={busy || i === ordered.length - 1}
                  aria-label={`Move photo ${i + 1} later`}
                >
                  <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </button>
                {confirming === m.id ? (
                  <button type="button" className="btn btn-danger btn-s" onClick={() => remove(m.id)} disabled={busy}>
                    Remove it
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-quiet btn-s"
                    onClick={() => setConfirming(m.id)}
                    disabled={busy}
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
