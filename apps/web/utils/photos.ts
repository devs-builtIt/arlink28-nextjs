// Client-side checks for package photos. They only save a round trip: the API
// checks every file again by its bytes, and its answer is the one that counts.

export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_PHOTOS_PER_UPLOAD = 20;

const TYPES = new Set(PHOTO_ACCEPT.split(","));

export type PhotoCheck = { ok: File[]; problems: string[] };

/** Splits a selection into files the API will take and a message for each it won't. */
export function checkPhotos(files: File[], alreadyPending = 0): PhotoCheck {
  const ok: File[] = [];
  const problems: string[] = [];
  for (const file of files) {
    if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
      problems.push(`${file.name} is an iPhone HEIC photo. Export it as JPEG, or set the camera to "Most Compatible".`);
    } else if (!TYPES.has(file.type)) {
      problems.push(`${file.name} isn't a JPEG, PNG or WebP photo.`);
    } else if (file.size > MAX_PHOTO_BYTES) {
      problems.push(`${file.name} is ${megabytes(file.size)}. The limit is ${megabytes(MAX_PHOTO_BYTES)} per photo.`);
    } else if (alreadyPending + ok.length >= MAX_PHOTOS_PER_UPLOAD) {
      problems.push(`${file.name} wasn't added: ${MAX_PHOTOS_PER_UPLOAD} photos at a time is the most.`);
    } else {
      ok.push(file);
    }
  }
  return { ok, problems };
}

export function megabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
