"use client";

import { useEffect, useRef, useState } from "react";
import Notice from "@/components/admin/Notice";
import PhotoDropzone from "@/components/admin/PhotoDropzone";
import { checkPhotos, megabytes } from "@/utils/photos";

export type PendingPhoto = { key: string; file: File; url: string };

/** Photos picked in a create stepper, held until the draft exists. The first one is the main photo. */
export function usePendingPhotos() {
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [problems, setProblems] = useState<string[]>([]);

  // Free the preview URLs when the page goes away.
  const latest = useRef(photos);
  latest.current = photos;
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function add(files: File[]) {
    const { ok, problems: rejected } = checkPhotos(files, photos.length);
    setProblems(rejected);
    setPhotos((prev) => [
      ...prev,
      ...ok.map((file) => ({
        key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  }

  function remove(key: string) {
    setPhotos((prev) => {
      const gone = prev.find((p) => p.key === key);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.key !== key);
    });
  }

  function makeMain(key: string) {
    setPhotos((prev) => {
      const chosen = prev.find((p) => p.key === key);
      return chosen ? [chosen, ...prev.filter((p) => p.key !== key)] : prev;
    });
  }

  return { photos, problems, add, remove, makeMain };
}

/** The photos step: the dropzone, what was rejected, and the grid of what will be uploaded. */
export default function PendingPhotosStep({
  photos,
  problems,
  add,
  remove,
  makeMain,
  busy,
}: ReturnType<typeof usePendingPhotos> & { busy: boolean }) {
  const totalBytes = photos.reduce((sum, p) => sum + p.file.size, 0);
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
      <PhotoDropzone onFiles={add} disabled={busy} hasPhotos={photos.length > 0} />
      {photos.length > 0 && (
        <>
          <ul className="photo-grid" aria-label="Photos to upload">
            {photos.map((p, i) => (
              <li className="photo-tile" key={p.key}>
                <img src={p.url} alt="" />
                {i === 0 && <span className="photo-badge">Main photo</span>}
                <div className="photo-actions">
                  {i > 0 && (
                    <button
                      type="button"
                      className="btn btn-quiet btn-s"
                      onClick={() => makeMain(p.key)}
                      disabled={busy}
                    >
                      Make main
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-quiet btn-s"
                    onClick={() => remove(p.key)}
                    disabled={busy}
                    aria-label={`Remove ${p.file.name}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="field-hint">
            {photos.length} {photos.length === 1 ? "photo" : "photos"}, {megabytes(totalBytes)} in all.
          </p>
        </>
      )}
    </>
  );
}
