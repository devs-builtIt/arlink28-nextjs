"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { StaffRoleName, UserResponse } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import PageHead from "@/components/admin/PageHead";
import Notice from "@/components/admin/Notice";
import { useAuth } from "@/context/AuthContext";
import { usersApi } from "@/utils/api/users";
import { fullDate, initials, roleLabel, timeAgo } from "@/components/admin/format";

type Message = { tone: "error" | "success"; text: string } | null;

export default function StaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<UserResponse[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStaff(await usersApi.list());
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "The staff list couldn't be loaded.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(person: UserResponse, role: StaffRoleName) {
    setMessage(null);
    setBusy(person.id);
    try {
      await usersApi.assignRole(person.id, role);
      await load();
      setMessage({
        tone: "success",
        text: `${person.username} is now ${role === "SuperAdmin" ? "a super admin" : "an operator"}.`,
      });
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "The role wasn't changed." });
    } finally {
      setBusy(null);
    }
  }

  async function deactivate(person: UserResponse) {
    setMessage(null);
    setBusy(person.id);
    try {
      await usersApi.deactivate(person.id);
      await load();
      setMessage({ tone: "success", text: `${person.username} can no longer sign in.` });
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "The account wasn't deactivated." });
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  }

  const activeCount = staff?.filter((s) => s.isActive).length ?? 0;

  return (
    <ProtectedPage requireSuperAdmin>
      <PageHead
        title="Staff"
        intro={
          staff
            ? `${activeCount} ${activeCount === 1 ? "person" : "people"} can sign in to the admin.`
            : "Everyone with an admin account."
        }
        actions={
          <Link className="btn btn-primary" href="/admin/users/invite">
            <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
            Invite staff
          </Link>
        }
      />

      {loadError && <Notice tone="error">{loadError}</Notice>}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      {!staff && !loadError && <p className="empty">Loading staff…</p>}

      {staff && (
        <div className="table-wrap">
          <table className="staff">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Last sign-in</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => {
                const isYou = person.username === user?.username;
                return (
                  <tr key={person.id} data-inactive={!person.isActive}>
                    <td>
                      <div className="person">
                        <span className="person-tile" aria-hidden="true">
                          {initials(person.username)}
                        </span>
                        <span>
                          <span className="person-name">
                            {person.username}
                            {isYou && <span className="muted"> (you)</span>}
                          </span>
                          <span className="person-email">{person.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      {isYou || !person.isActive ? (
                        <span className={`tag${person.role === "SuperAdmin" ? " tag-super" : ""}`}>
                          {roleLabel(person.role)}
                        </span>
                      ) : (
                        <select
                          className="input input-s"
                          aria-label={`Role for ${person.username}`}
                          value={person.role}
                          disabled={busy === person.id}
                          onChange={(e) => changeRole(person, e.target.value as StaffRoleName)}
                        >
                          <option value="Operator">Operator</option>
                          <option value="SuperAdmin">Super admin</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <span className={`status${person.isActive ? " status-active" : ""}`}>
                        {person.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>
                      {person.lastLoginAt ? (
                        <time className="muted" dateTime={person.lastLoginAt} title={fullDate(person.lastLoginAt)}>
                          {timeAgo(person.lastLoginAt)}
                        </time>
                      ) : (
                        <span className="muted">Never</span>
                      )}
                    </td>
                    <td>
                      {person.isActive && !isYou && (
                        <div className="row-actions">
                          {confirming === person.id ? (
                            <span className="confirm">
                              <span>Stop {person.username} signing in?</span>
                              <button
                                className="btn btn-danger btn-s"
                                disabled={busy === person.id}
                                onClick={() => deactivate(person)}
                              >
                                Deactivate
                              </button>
                              <button className="btn btn-quiet btn-s" onClick={() => setConfirming(null)}>
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button className="btn btn-quiet btn-s" onClick={() => setConfirming(person.id)}>
                              Deactivate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {staff?.length === 0 && (
        <div className="empty">
          <p>No staff accounts yet. Invite the first person to give them access.</p>
          <Link className="btn btn-primary" href="/admin/users/invite">
            Invite staff
          </Link>
        </div>
      )}
    </ProtectedPage>
  );
}
