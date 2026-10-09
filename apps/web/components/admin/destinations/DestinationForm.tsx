"use client";

import { useState, type FormEvent } from "react";
import type { AdminDestinationDetail, UpdateDestinationRequest } from "@arlink28/api-client";
import { SaveBar, useSaver } from "@/components/admin/SectionSave";
import { ApiError } from "@/utils/api/client";
import { adminDestinationsApi } from "@/utils/api/destinations";

type Values = {
  name: string;
  slug: string;
  tagline: string;
  summary: string;
  description: string;
  bestTimeToVisit: string;
  latitude: string;
  longitude: string;
  sortOrder: string;
};

export type DestinationPart = "core" | "story" | "position";

const FIELDS: Record<DestinationPart, (keyof Values)[]> = {
  core: ["name", "slug", "tagline", "summary"],
  story: ["description", "bestTimeToVisit"],
  position: ["latitude", "longitude", "sortOrder"],
};

const toValues = (d: AdminDestinationDetail): Values => ({
  name: d.name,
  slug: d.slug,
  tagline: d.tagline ?? "",
  summary: d.summary ?? "",
  description: d.description ?? "",
  bestTimeToVisit: d.bestTimeToVisit ?? "",
  latitude: d.latitude == null ? "" : String(d.latitude),
  longitude: d.longitude == null ? "" : String(d.longitude),
  sortOrder: String(d.sortOrder),
});

const pick = (values: Values, part: DestinationPart) => Object.fromEntries(FIELDS[part].map((k) => [k, values[k]]));

/** ASP.NET reports validation errors under the property name, capitalised. */
function FieldError({ name, errors }: { name: string; errors?: Record<string, string[]> }) {
  const message = errors?.[name]?.[0] ?? errors?.[name.charAt(0).toUpperCase() + name.slice(1)]?.[0];
  return message ? <span className="field-error">{message}</span> : null;
}

const number = (text: string) => (text.trim() === "" ? undefined : Number(text));

/** What stops a part from saving, in plain words. Checked before anything is sent. */
function problem(part: DestinationPart, v: Values): string | undefined {
  if (part === "core") {
    if (!v.name.trim()) return "Give it a name.";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug.trim()))
      return "The address uses lowercase letters, numbers and single hyphens.";
  }
  if (part === "position") {
    const lat = number(v.latitude);
    const lng = number(v.longitude);
    if (lat !== undefined && (Number.isNaN(lat) || lat < -90 || lat > 90))
      return "Latitude is a number from -90 to 90.";
    if (lng !== undefined && (Number.isNaN(lng) || lng < -180 || lng > 180))
      return "Longitude is a number from -180 to 180.";
    const order = number(v.sortOrder);
    if (order !== undefined && (!Number.isInteger(order) || order < 0 || order > 10000))
      return "The order is a whole number from 0 to 10000.";
  }
  return undefined;
}

function payload(part: DestinationPart, v: Values): UpdateDestinationRequest {
  if (part === "core")
    return { name: v.name.trim(), slug: v.slug.trim(), tagline: v.tagline.trim(), summary: v.summary.trim() };
  if (part === "story") return { description: v.description.trim(), bestTimeToVisit: v.bestTimeToVisit.trim() };
  return { latitude: number(v.latitude), longitude: number(v.longitude), sortOrder: number(v.sortOrder) };
}

type Props = {
  destination: AdminDestinationDetail;
  part: DestinationPart;
  onSaved: (d: AdminDestinationDetail) => void;
};

/** One part of a destination's details, with its own Save. */
export default function DestinationForm({ destination, part, onSaved }: Props) {
  const [values, setValues] = useState(() => toValues(destination));
  const saver = useSaver();

  const dirty = JSON.stringify(pick(values, part)) !== JSON.stringify(pick(toValues(destination), part));
  const blocked = problem(part, values);
  const set = (key: keyof Values, value: string) => {
    saver.clearSaved();
    setValues((v) => ({ ...v, [key]: value }));
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    if (blocked) return;
    saver.run(
      () => adminDestinationsApi.update(destination.id, payload(part, values)),
      (updated) => {
        onSaved(updated);
        setValues((current) => ({ ...current, ...pick(toValues(updated), part) }));
      },
      (err) => saver.setFieldErrors(err instanceof ApiError ? err.fieldErrors : undefined),
    );
  }

  const off = saver.saving;
  return (
    <form onSubmit={submit}>
      {part === "core" && (
        <>
          <div className="field">
            <label htmlFor="d-name">Name</label>
            <input
              id="d-name"
              className="input"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={100}
              required
              disabled={off}
            />
            <FieldError name="name" errors={saver.fieldErrors} />
          </div>
          <div className="field">
            <label htmlFor="d-slug">Page address</label>
            <input
              id="d-slug"
              className="input"
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
              maxLength={100}
              disabled={off || destination.slugLocked}
              aria-describedby="d-slug-hint"
            />
            <span className="field-hint" id="d-slug-hint">
              {destination.slugLocked
                ? "It has been published, so the address can't change. Shared links would break."
                : `/destinations/${values.slug || "…"}. You can change it until the first time it is published.`}
            </span>
            <FieldError name="slug" errors={saver.fieldErrors} />
          </div>
          <div className="field">
            <label htmlFor="d-tagline">Tagline</label>
            <input
              id="d-tagline"
              className="input"
              value={values.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              maxLength={160}
              disabled={off}
            />
            <span className="field-hint">
              One line under the name, such as &ldquo;The largest elephant herds in Africa&rdquo;.
            </span>
            <FieldError name="tagline" errors={saver.fieldErrors} />
          </div>
          <div className="field">
            <label htmlFor="d-summary">Summary</label>
            <textarea
              id="d-summary"
              className="input textarea"
              rows={3}
              value={values.summary}
              onChange={(e) => set("summary", e.target.value)}
              maxLength={400}
              disabled={off}
            />
            <span className="field-hint">
              Shown on the destination card and at the top of its page. Needed before it can be published.
            </span>
            <FieldError name="summary" errors={saver.fieldErrors} />
          </div>
        </>
      )}

      {part === "story" && (
        <>
          <div className="field">
            <label htmlFor="d-description">Description</label>
            <textarea
              id="d-description"
              className="input textarea"
              rows={10}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={10000}
              disabled={off}
            />
            <span className="field-hint">Leave a blank line between paragraphs.</span>
            <FieldError name="description" errors={saver.fieldErrors} />
          </div>
          <div className="field">
            <label htmlFor="d-best">Best time to visit</label>
            <input
              id="d-best"
              className="input"
              value={values.bestTimeToVisit}
              onChange={(e) => set("bestTimeToVisit", e.target.value)}
              maxLength={200}
              placeholder="May to October, the dry season"
              disabled={off}
            />
            <FieldError name="bestTimeToVisit" errors={saver.fieldErrors} />
          </div>
        </>
      )}

      {part === "position" && (
        <>
          <div className="field-row">
            <div className="field">
              <label htmlFor="d-lat">Latitude</label>
              <input
                id="d-lat"
                className="input"
                inputMode="decimal"
                value={values.latitude}
                onChange={(e) => set("latitude", e.target.value)}
                placeholder="-17.9243"
                disabled={off}
              />
              <FieldError name="latitude" errors={saver.fieldErrors} />
            </div>
            <div className="field">
              <label htmlFor="d-lng">Longitude</label>
              <input
                id="d-lng"
                className="input"
                inputMode="decimal"
                value={values.longitude}
                onChange={(e) => set("longitude", e.target.value)}
                placeholder="25.8572"
                disabled={off}
              />
              <FieldError name="longitude" errors={saver.fieldErrors} />
            </div>
          </div>
          <p className="field-hint pk-dest-gap">Optional. A coordinate can be changed but not cleared once saved.</p>
          <div className="field">
            <label htmlFor="d-order">Order on the destinations page</label>
            <input
              id="d-order"
              className="input pk-dest-number"
              inputMode="numeric"
              value={values.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
              disabled={off}
            />
            <span className="field-hint">
              Lower numbers come first. Places with the same number are ordered by name.
            </span>
            <FieldError name="sortOrder" errors={saver.fieldErrors} />
          </div>
        </>
      )}

      <SaveBar dirty={dirty} {...saver} blocked={blocked} />
    </form>
  );
}
