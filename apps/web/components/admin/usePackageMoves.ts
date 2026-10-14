"use client";

import { useState } from "react";
import type { AdminPackageDetail } from "@arlink28/api-client";
import { ApiError } from "@/utils/api/client";

export type PackageMove = "publish" | "unpublish" | "archive";

/**
 * The status moves staff make on a listing (publish, take off the site, archive), shared by the card and the
 * table row's menu. Publishing lists what the listing still needs; taking down and archiving ask twice.
 */
export function usePackageMoves(onChanged: () => void) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<PackageMove | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function move(action: () => Promise<AdminPackageDetail>) {
    setBusy(true);
    setError("");
    setMissing([]);
    setConfirming(null);
    try {
      await action();
      onChanged();
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.missing) setMissing(err.missing);
      else setError(err instanceof Error ? err.message : "That didn't work. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, confirming, setConfirming, missing, error, move };
}
