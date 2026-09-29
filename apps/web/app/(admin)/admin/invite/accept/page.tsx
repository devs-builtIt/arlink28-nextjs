"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usersApi } from "@/utils/api/users";
import { useAuth } from "@/context/AuthContext";
import AuthFrame from "@/components/admin/AuthFrame";
import Notice from "@/components/admin/Notice";
import { PASSWORD_HINT } from "@/components/admin/format";

function AcceptInviteForm() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const { refresh } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await usersApi.acceptInvite({ token, username, password });
      await refresh();
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your account wasn't created. Try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Notice tone="error">
        This invite link is incomplete. Open the link from your invite email again, or ask a super admin to send a new
        invite.
      </Notice>
    );
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            type="text"
            autoComplete="username"
            aria-describedby="username-hint"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <span className="field-hint" id="username-hint">
            3 to 50 letters, digits or underscores. You&apos;ll use it to sign in.
          </span>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            aria-describedby="password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="field-hint" id="password-hint">
            {PASSWORD_HINT}
          </span>
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Creating your account…" : "Create account and sign in"}
        </button>
      </form>
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <AuthFrame
      title="Set up your account"
      intro="You've been invited to the ARLink28 staff admin. Choose a username and password to finish."
    >
      <Suspense fallback={null}>
        <AcceptInviteForm />
      </Suspense>
    </AuthFrame>
  );
}
