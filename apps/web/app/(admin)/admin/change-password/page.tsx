"use client";

import { useState, type FormEvent } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import PageHead from "@/components/admin/PageHead";
import Notice from "@/components/admin/Notice";
import { authApi } from "@/utils/api/auth";
import { PASSWORD_HINT } from "@/components/admin/format";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword: current, newPassword: next });
      setDone(true);
      setCurrent("");
      setNext("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your password wasn't changed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedPage>
      <PageHead title="Password" intro="Change the password you use to sign in to the admin." />

      <div className="panel">
        {error && <Notice tone="error">{error}</Notice>}
        {done && <Notice tone="success">Password changed. Use the new one next time you sign in.</Notice>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="current">Current password</label>
            <input
              id="current"
              className="input"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="next">New password</label>
            <input
              id="next"
              className="input"
              type="password"
              autoComplete="new-password"
              aria-describedby="next-hint"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
            <span className="field-hint" id="next-hint">
              {PASSWORD_HINT}
            </span>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Changing password…" : "Change password"}
          </button>
        </form>
      </div>
    </ProtectedPage>
  );
}
