"use client";

import { useRef, useState, type DragEvent } from "react";
import { PHOTO_ACCEPT } from "@/utils/photos";

type Props = {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  /** Shorter prompt once there are photos already. */
  hasPhotos?: boolean;
};

/**
 * Drop photos or pick them. One control does both, and it's a real <label> around a
 * file input, so keyboard and screen-reader users get the browser's own file picker.
 */
export default function PhotoDropzone({ onFiles, disabled, hasPhotos }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(list: FileList | null) {
    if (list && list.length > 0) onFiles(Array.from(list));
    if (input.current) input.current.value = ""; // the same file can be chosen again
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    if (!disabled) take(e.dataTransfer.files);
  }

  return (
    <label
      className={`dropzone${over ? " dropzone-over" : ""}${disabled ? " dropzone-disabled" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={input}
        type="file"
        multiple
        accept={PHOTO_ACCEPT}
        disabled={disabled}
        onChange={(e) => take(e.target.files)}
      />
      <i className="fa-solid fa-images" aria-hidden="true"></i>
      <span className="dropzone-title">{hasPhotos ? "Add more photos" : "Add photos"}</span>
      <span className="dropzone-hint">Drop them here, or click to choose. Select as many as you like.</span>
      <span className="dropzone-hint">JPEG, PNG or WebP, up to 10 MB each.</span>
    </label>
  );
}
