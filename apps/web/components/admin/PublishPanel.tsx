"use client";

import { useState } from "react";
import type { AdminPackageDetail } from "@arlink28/api-client";
import Notice from "@/components/admin/Notice";
import { adminPackagesApi } from "@/utils/api/packages";
import { ApiError } from "@/utils/api/client";
import { Spinner, StatusBadge } from "@/components/admin/ui";

type Props = { pkg: AdminPackageDetail; onChange: (pkg: AdminPackageDetail) => void };

/** Where the package is, and the moves from there. Publishing lists what is still missing. */
export default function PublishPanel({ pkg, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [confirming, setConfirming] = useState<"unpublish" | "archive" | null>(null);

  async function move(action: () => Promise<AdminPackageDetail>) {
    setBusy(true);
    setError("");
    setMissing([]);
    setConfirming(null);
    try {
      onChange(await action());
    } catch (err) {
      if (err instanceof ApiError && err.missing) setMissing(err.missing);
      else setError(err instanceof Error ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const published = pkg.status === "Published";
  const archived = pkg.status === "Archived";

  return (
    <section className="card" aria-labelledby="status-title">
      <h2 className="card-title" id="status-title">
        Status
      </h2>
      <p className="status-line">
        <StatusBadge status={pkg.status} />
        <span className="muted-wrap">
          {published && "Customers can see it on the site."}
          {pkg.status === "Draft" && "Not on the site yet."}
          {archived && "Hidden from the site."}
        </span>
      </p>

      {error && <Notice tone="error">{error}</Notice>}
      {missing.length > 0 && (
        <div className="notice notice-error" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
          <div>
            Not ready to publish. Still needed:
            <ul className="problem-list">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="form-actions">
        {pkg.status === "Draft" && (
          <button
            className="btn btn-primary"
            onClick={() => move(() => adminPackagesApi.publish(pkg.id))}
            disabled={busy}
          >
            {busy && <Spinner />}
            {busy ? "Publishing" : "Publish"}
          </button>
        )}
        {archived && (
          <button
            className="btn btn-quiet"
            onClick={() => move(() => adminPackagesApi.unpublish(pkg.id))}
            disabled={busy}
          >
            Move to drafts
          </button>
        )}
        {published &&
          (confirming === "unpublish" ? (
            <button
              className="btn btn-danger"
              onClick={() => move(() => adminPackagesApi.unpublish(pkg.id))}
              disabled={busy}
            >
              Yes, take it off the site
            </button>
          ) : (
            <button className="btn btn-quiet" onClick={() => setConfirming("unpublish")} disabled={busy}>
              Take off the site
            </button>
          ))}
        {!archived &&
          (confirming === "archive" ? (
            <button
              className="btn btn-danger"
              onClick={() => move(() => adminPackagesApi.archive(pkg.id))}
              disabled={busy}
            >
              Yes, archive it
            </button>
          ) : (
            <button className="btn btn-quiet" onClick={() => setConfirming("archive")} disabled={busy}>
              Archive
            </button>
          ))}
      </div>
    </section>
  );
}
