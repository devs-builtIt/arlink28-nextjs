"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdminDestinationSummary } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import Notice from "@/components/admin/Notice";
import { Crumbs, Spinner } from "@/components/admin/ui";
import { ApiError } from "@/utils/api/client";
import { adminDestinationsApi } from "@/utils/api/destinations";
import { africanCountries } from "@/utils/countries";

const OTHER = "__other";

/** ASP.NET reports validation errors under the property name, capitalised. */
const fieldError = (errors: Record<string, string[]> | undefined, name: string) =>
  errors?.[name]?.[0] ?? errors?.[name.charAt(0).toUpperCase() + name.slice(1)]?.[0];

function NewDestination() {
  const router = useRouter();
  const params = useSearchParams();
  const presetParent = params.get("parent") ?? "";

  const [kind, setKind] = useState<"Place" | "Country">("Place");
  const [countries, setCountries] = useState<AdminDestinationSummary[] | null>(null);
  const [parentId, setParentId] = useState(presetParent);
  const [code, setCode] = useState("");
  const [otherCode, setOtherCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>();
  const africa = africanCountries();

  // The countries a place can go in: every one, drafts too, since a place can be written before its country is live.
  useEffect(() => {
    adminDestinationsApi
      .list({ kind: "Country", pageSize: 100 })
      .then((result) => {
        setCountries(result.items);
        if (result.items.length === 0 && !presetParent) setKind("Country");
      })
      .catch(() => setCountries([]));
  }, [presetParent]);

  const countryCode = code === OTHER ? otherCode.trim().toUpperCase() : code;
  const ready = name.trim() !== "" && (kind === "Place" ? parentId !== "" : /^[A-Z]{2}$/.test(countryCode));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    setError("");
    setFieldErrors(undefined);
    try {
      const created = await adminDestinationsApi.create(
        kind === "Place"
          ? { name: name.trim(), parentId, sortOrder: 0 }
          : { name: name.trim(), country: countryCode, sortOrder: 0 },
      );
      router.push(`/admin/destinations/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The destination wasn't created. Try again.");
      setFieldErrors(err instanceof ApiError ? err.fieldErrors : undefined);
      setSaving(false);
    }
  }

  return (
    <ProtectedPage wide>
      <div className="pk">
        <Crumbs trail={[{ label: "Destinations", href: "/admin/destinations" }, { label: "New" }]} />
        <div className="pk-header">
          <div>
            <h1 className="pk-title">New destination</h1>
            <p className="pk-meta">
              <span>It starts as a draft. You add the write-up, photos and things to do on the next page.</span>
            </p>
          </div>
        </div>

        <form className="pk-dest-new" onSubmit={submit}>
          <fieldset className="field">
            <legend>What are you adding?</legend>
            <label className="pk-radio">
              <input type="radio" name="kind" checked={kind === "Place"} onChange={() => setKind("Place")} />
              <span>
                A place
                <small>Victoria Falls, Chobe, Giza. It sits inside a country.</small>
              </span>
            </label>
            <label className="pk-radio">
              <input type="radio" name="kind" checked={kind === "Country"} onChange={() => setKind("Country")} />
              <span>
                A country
                <small>Botswana, Egypt. It groups the places inside it.</small>
              </span>
            </label>
          </fieldset>

          {kind === "Place" ? (
            <div className="field">
              <label htmlFor="dest-parent">Country</label>
              <select
                id="dest-parent"
                className="input"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                disabled={saving || countries === null}
                required
              >
                <option value="" disabled>
                  {countries === null ? "Loading countries" : "Choose a country"}
                </option>
                {(countries ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.status === "Draft" ? " (draft)" : ""}
                  </option>
                ))}
              </select>
              {countries !== null && countries.length === 0 && (
                <span className="field-hint">There are no countries yet. Add the country first.</span>
              )}
              {fieldError(fieldErrors, "parentId") && (
                <span className="field-error">{fieldError(fieldErrors, "parentId")}</span>
              )}
            </div>
          ) : (
            <div className="field-row">
              <div className="field">
                <label htmlFor="dest-country">Country</label>
                <select
                  id="dest-country"
                  className="input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={saving}
                  required
                >
                  <option value="" disabled>
                    Choose a country
                  </option>
                  {africa.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                  <option value={OTHER}>Somewhere else…</option>
                </select>
                {fieldError(fieldErrors, "country") && (
                  <span className="field-error">{fieldError(fieldErrors, "country")}</span>
                )}
              </div>
              {code === OTHER && (
                <div className="field">
                  <label htmlFor="dest-other">Two-letter country code</label>
                  <input
                    id="dest-other"
                    className="input"
                    value={otherCode}
                    onChange={(e) => setOtherCode(e.target.value)}
                    maxLength={2}
                    placeholder="GB"
                    disabled={saving}
                  />
                </div>
              )}
            </div>
          )}

          <div className="field">
            <label htmlFor="dest-name">Name</label>
            <input
              id="dest-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder={kind === "Place" ? "Victoria Falls" : "Botswana"}
              required
              disabled={saving}
            />
            <span className="field-hint">
              The page address comes from the name. You can change it until the first time it is published.
            </span>
            {fieldError(fieldErrors, "name") && <span className="field-error">{fieldError(fieldErrors, "name")}</span>}
          </div>

          {error && <Notice tone="error">{error}</Notice>}
          <div className="form-actions">
            <Link className="btn btn-quiet" href="/admin/destinations">
              Cancel
            </Link>
            <button className="btn btn-primary" type="submit" disabled={!ready || saving}>
              {saving && <Spinner />}
              {saving ? "Creating" : "Create draft"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedPage>
  );
}

export default function NewDestinationPage() {
  // useSearchParams needs a Suspense boundary so the page can still be prepared ahead of time.
  return (
    <Suspense fallback={null}>
      <NewDestination />
    </Suspense>
  );
}
