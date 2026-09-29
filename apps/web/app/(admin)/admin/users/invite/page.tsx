"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { StaffRoleName } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import PageHead from "@/components/admin/PageHead";
import Notice from "@/components/admin/Notice";
import { usersApi } from "@/utils/api/users";

const ROLES: { value: StaffRoleName; name: string; desc: string }[] = [
  { value: "Operator", name: "Operator", desc: "Uses the admin day to day." },
  { value: "SuperAdmin", name: "Super admin", desc: "Can also invite staff, change roles and deactivate accounts." },
];

export default function InviteStaffPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRoleName>("Operator");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSentTo("");
    setLoading(true);
    try {
      await usersApi.invite({ email, role });
      setSentTo(email);
      setEmail("");
      setRole("Operator");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The invite wasn't sent. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedPage requireSuperAdmin>
      <PageHead
        title="Invite staff"
        intro="We'll email a link to set up their account. The link works for 48 hours."
        actions={
          <Link className="btn btn-quiet" href="/admin/users">
            Back to staff
          </Link>
        }
      />

      <div className="panel">
        {error && <Notice tone="error">{error}</Notice>}
        {sentTo && <Notice tone="success">Invite sent to {sentTo}.</Notice>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <fieldset className="field">
            <legend>Role</legend>
            <div className="choices">
              {ROLES.map((r) => (
                <label key={r.value} className="choice">
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                  />
                  <span className="choice-name">{r.name}</span>
                  <span className="choice-desc">{r.desc}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending invite…" : "Send invite"}
          </button>
        </form>
      </div>
    </ProtectedPage>
  );
}
