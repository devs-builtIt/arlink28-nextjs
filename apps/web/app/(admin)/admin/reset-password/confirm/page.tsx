"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/utils/api/auth";
import AuthFrame from "@/components/admin/AuthFrame";
import Notice from "@/components/admin/Notice";
import { PASSWORD_HINT } from "@/components/admin/format";

function ConfirmResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.confirmPasswordReset({ token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The password wasn't saved. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        <Notice tone="error">This reset link is incomplete. Request a new one and use the link in that email.</Notice>
        <Link className="btn btn-quiet" href="/admin/reset-password/request">
          Request a new link
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <Notice tone="success">Password saved. Sign in with your new password.</Notice>
        <Link className="btn btn-primary btn-block" href="/admin/login">
          Sign in
        </Link>
      </>
    );
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            aria-describedby="password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          <span className="field-hint" id="password-hint">
            {PASSWORD_HINT}
          </span>
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save new password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <AuthFrame title="Choose a new password">
      <Suspense fallback={null}>
        <ConfirmResetForm />
      </Suspense>
    </AuthFrame>
  );
}
