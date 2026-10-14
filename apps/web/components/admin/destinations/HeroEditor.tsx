"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AdminDestinationDetail } from "@arlink28/api-client";
import Notice from "@/components/admin/Notice";
import { SaveBar, useSaver } from "@/components/admin/SectionSave";
import { Spinner } from "@/components/admin/ui";
import { adminDestinationsApi } from "@/utils/api/destinations";
import { PHOTO_ACCEPT, checkPhotos } from "@/utils/photos";

type Props = { destination: AdminDestinationDetail; onChange: (d: AdminDestinationDetail) => void };

/**
 * The main photo. Choosing a file starts a new photo with its own (blank) alt text and credit, so an
 * old credit can't end up under a different picture. With no file chosen, the two fields edit the saved ones.
 */
export default function HeroEditor({ destination, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [alt, setAlt] = useState(destination.heroAlt ?? "");
  const [credit, setCredit] = useState(destination.heroCredit ?? "");
  const [problems, setProblems] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const text = useSaver();

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(list: FileList | null) {
    const picked = list?.[0];
    if (input.current) input.current.value = "";
    if (!picked) return;
    const { ok, problems } = checkPhotos([picked]);
    setProblems(problems);
    if (ok.length === 0) return;
    setUploadError("");
    setFile(ok[0]);
    setAlt("");
    setCredit("");
  }

  function cancel() {
    setFile(null);
    setProblems([]);
    setAlt(destination.heroAlt ?? "");
    setCredit(destination.heroCredit ?? "");
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const updated = await adminDestinationsApi.setHero(
        destination.id,
        file,
        alt.trim() || undefined,
        credit.trim() || undefined,
      );
      onChange(updated);
      setFile(null);
      setAlt(updated.heroAlt ?? "");
      setCredit(updated.heroCredit ?? "");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "The photo didn't upload. Try again.");
    } finally {
      setUploading(false);
    }
  }

  const savedAlt = destination.heroAlt ?? "";
  const savedCredit = destination.heroCredit ?? "";
  const dirty = !file && (alt.trim() !== savedAlt || credit.trim() !== savedCredit);

  function saveText(e: FormEvent) {
    e.preventDefault();
    text.run(
      () => adminDestinationsApi.update(destination.id, { heroAlt: alt.trim(), heroCredit: credit.trim() }),
      (updated) => onChange(updated),
    );
  }

  const shown = preview || destination.heroPath;
  return (
    <form onSubmit={saveText}>
      {problems.length > 0 && (
        <Notice tone="error">
          <ul className="problem-list">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Notice>
      )}
      {uploadError && <Notice tone="error">{uploadError}</Notice>}

      <div className="pk-dest-hero">
        {shown ? (
          <img src={shown} alt={file ? "The photo you chose" : (destination.heroAlt ?? "")} />
        ) : (
          <p className="empty photos-empty">No main photo yet. A destination needs one before it can be published.</p>
        )}
      </div>

      <div className="pk-dest-hero-actions">
        <label className="btn btn-quiet">
          <input
            ref={input}
            type="file"
            accept={PHOTO_ACCEPT}
            className="sr-only"
            onChange={(e) => choose(e.target.files)}
            disabled={uploading}
          />
          {destination.heroPath || file ? "Choose a different photo" : "Choose a photo"}
        </label>
        <span className="field-hint">JPEG, PNG or WebP, up to 10 MB.</span>
      </div>

      <div className="field">
        <label htmlFor="hero-alt">Describe the photo</label>
        <input
          id="hero-alt"
          className="input"
          value={alt}
          onChange={(e) => {
            text.clearSaved();
            setAlt(e.target.value);
          }}
          maxLength={250}
          placeholder="A herd of elephants drinking at the Chobe River"
          disabled={uploading || text.saving}
        />
        <span className="field-hint">
          For people who can&apos;t see it, and for search. Leave it blank to use the name.
        </span>
      </div>
      <div className="field">
        <label htmlFor="hero-credit">Photo credit</label>
        <input
          id="hero-credit"
          className="input"
          value={credit}
          onChange={(e) => {
            text.clearSaved();
            setCredit(e.target.value);
          }}
          maxLength={250}
          placeholder="Photo by Rory Ashman on Unsplash"
          disabled={uploading || text.saving}
        />
        <span className="field-hint">Shown under the photo on the site.</span>
      </div>

      {file ? (
        <div className="form-actions">
          <span className="save-state">{file.name} isn&apos;t saved yet</span>
          <button type="button" className="btn btn-quiet" onClick={cancel} disabled={uploading}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={upload} disabled={uploading}>
            {uploading && <Spinner />}
            {uploading ? "Uploading" : "Upload photo"}
          </button>
        </div>
      ) : (
        destination.heroPath && <SaveBar dirty={dirty} {...text} label="Save text" />
      )}
    </form>
  );
}
