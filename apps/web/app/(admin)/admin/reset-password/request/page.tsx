"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authApi } from "@/utils/api/auth";
import AuthFrame from "@/components/admin/AuthFrame";
import Notice from "@/components/admin/Notice";

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.requestPasswordReset({ email });
    } catch {
      // The API answers 204 whether or not the email exists, so there's nothing to show.
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <AuthFrame
      title="Reset your password"
      intro={submitted ? undefined : "Enter the email on your staff account and we'll send you a reset link."}
    >
      {submitted ? (
        <Notice tone="success">
          If {email} belongs to a staff account, a reset link is on its way. The link works for 1 hour.
        </Notice>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="auth-foot">
        <Link className="link" href="/admin/login">
          Back to sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
