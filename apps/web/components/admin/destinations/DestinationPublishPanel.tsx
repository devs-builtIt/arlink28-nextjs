"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminDestinationDetail } from "@arlink28/api-client";
import Notice from "@/components/admin/Notice";
import { Spinner, StatusBadge } from "@/components/admin/ui";
import { ApiError } from "@/utils/api/client";
import { adminDestinationsApi } from "@/utils/api/destinations";

type Props = { destination: AdminDestinationDetail; onChange: (d: AdminDestinationDetail) => void };

/** Where the destination is, and the moves from there. Publishing lists what is still missing. */
export default function DestinationPublishPanel({ destination, onChange }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [confirming, setConfirming] = useState<"unpublish" | "delete" | null>(null);

  async function move(action: () => Promise<AdminDestinationDetail>) {
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

  async function remove() {
    setBusy(true);
    setError("");
    setMissing([]);
    try {
      await adminDestinationsApi.remove(destination.id);
      router.push("/admin/destinations");
    } catch (err) {
      // A 409 says what still uses it ("Packages still use Masai Mara…"): show that as it is.
      setError(err instanceof Error ? err.message : "It couldn't be deleted. Try again.");
      setConfirming(null);
      setBusy(false);
    }
  }

  const published = destination.status === "Published";

  return (
    <section className="card" aria-labelledby="status-title">
      <h2 className="card-title" id="status-title">
        Status
      </h2>
      <p className="status-line">
        <StatusBadge status={destination.status} />
        <span className="muted-wrap">{published ? "Visitors can see it on the site." : "Not on the site yet."}</span>
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
        {!published && (
          <button
            className="btn btn-primary"
            onClick={() => move(() => adminDestinationsApi.publish(destination.id))}
            disabled={busy}
          >
            {busy && <Spinner />}
            Publish
          </button>
        )}
        {published &&
          (confirming === "unpublish" ? (
            <button
              className="btn btn-danger"
              onClick={() => move(() => adminDestinationsApi.unpublish(destination.id))}
              disabled={busy}
            >
              Yes, take it off the site
            </button>
          ) : (
            <button className="btn btn-quiet" onClick={() => setConfirming("unpublish")} disabled={busy}>
              Take off the site
            </button>
          ))}
        {confirming === "delete" ? (
          <button className="btn btn-danger" onClick={remove} disabled={busy}>
            Yes, delete it
          </button>
        ) : (
          <button className="btn btn-quiet" onClick={() => setConfirming("delete")} disabled={busy}>
            Delete
          </button>
        )}
      </div>
      {confirming === "delete" && (
        <p className="field-hint">
          Its photos are deleted too. You can&apos;t delete one that packages or places still use.
        </p>
      )}
    </section>
  );
}
