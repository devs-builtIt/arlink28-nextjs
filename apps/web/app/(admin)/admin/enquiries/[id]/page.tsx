"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { EnquiryDetail, EnquiryStatus } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import Notice from "@/components/admin/Notice";
import { Crumbs, Panel, Skeleton } from "@/components/admin/ui";
import { EnquiryStatusBadge, STATUSES, dayLabel, typeLabel } from "@/components/admin/EnquiryParts";
import { fullDate, money, timeAgo } from "@/components/admin/format";
import { ApiError } from "@/utils/api/client";
import { isHoliday, typeLabel as kindLabel } from "@/utils/productTypes";
import { adminEnquiriesApi } from "@/utils/api/enquiries";

/** A phone number as WhatsApp wants it: digits only, and long enough to be one. */
function whatsappHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

function CopyReference({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: the reference is still on screen to select.
    }
  }

  return (
    <button
      type="button"
      className="enq-copy"
      onClick={copy}
      data-copied={copied || undefined}
      title="Copy the reference"
    >
      <span>{reference}</span>
      <span className="enq-copy-state" role="status">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

/** Three states in a row with a thumb that slides to the current one. */
function StatusControl({
  value,
  onChange,
  busy,
}: {
  value: EnquiryStatus;
  onChange: (next: EnquiryStatus) => void;
  busy: boolean;
}) {
  return (
    <div
      className="enq-seg"
      role="radiogroup"
      aria-label="Status"
      style={{ "--i": STATUSES.indexOf(value) } as React.CSSProperties}
    >
      <span className="enq-seg-thumb" aria-hidden="true"></span>
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          disabled={busy}
          onClick={() => value !== s && onChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="enq-grid" aria-hidden="true">
      <div className="enq-col">
        <div className="pk-panel">
          <div className="pk-panel-head">
            <Skeleton w={120} h={16} />
          </div>
          <div className="pk-panel-body pk-stack">
            <Skeleton w="90%" h={13} />
            <Skeleton w="80%" h={13} />
            <Skeleton w="60%" h={13} />
          </div>
        </div>
      </div>
      <div className="enq-col">
        <div className="pk-panel">
          <div className="pk-panel-head">
            <Skeleton w={80} h={16} />
          </div>
          <div className="pk-panel-body">
            <Skeleton w="100%" h={40} r={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [enquiry, setEnquiry] = useState<EnquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; missing: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setError(null);
    adminEnquiriesApi
      .get(id)
      .then((result) => !stale && setEnquiry(result))
      .catch(
        (err) =>
          !stale &&
          setError({
            message: err instanceof Error ? err.message : "The enquiry couldn't be loaded.",
            missing: err instanceof ApiError && err.status === 404,
          }),
      )
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [id, retry]);

  async function setStatus(next: EnquiryStatus) {
    if (!enquiry) return;
    const before = enquiry;
    // Show the change at once; put it back if the API says no.
    setEnquiry({ ...enquiry, status: next });
    setSaving(true);
    setNotice(null);
    try {
      setEnquiry(await adminEnquiriesApi.setStatus(enquiry.id, next));
      setNotice({ tone: "success", text: `Marked as ${next.toLowerCase()}.` });
    } catch (err) {
      setEnquiry(before);
      setNotice({
        tone: "error",
        text: err instanceof Error ? err.message : "The status couldn't be changed. Try again.",
      });
    }
    setSaving(false);
  }

  const crumbs = [{ label: "Enquiries", href: "/admin/enquiries" }, { label: enquiry?.reference ?? "Enquiry" }];
  const whatsapp = whatsappHref(enquiry?.phone);

  return (
    <ProtectedPage wide>
      <div className="pk enq">
        <Crumbs trail={crumbs} />

        {error ? (
          <div className="pk-empty">
            <h2>{error.missing ? "Enquiry not found" : "The enquiry couldn't be loaded"}</h2>
            <p>{error.missing ? "It may have been removed, or the link is wrong." : error.message}</p>
            {error.missing ? (
              <Link className="btn btn-quiet" href="/admin/enquiries">
                Back to enquiries
              </Link>
            ) : (
              <button type="button" className="btn btn-quiet" onClick={() => setRetry((n) => n + 1)}>
                Try again
              </button>
            )}
          </div>
        ) : loading && !enquiry ? (
          <>
            <div className="pk-header">
              <div className="pk-stack">
                <Skeleton w={220} h={28} />
                <Skeleton w={320} h={14} />
              </div>
            </div>
            <DetailSkeleton />
          </>
        ) : enquiry ? (
          <>
            <div className="pk-header">
              <div>
                <div className="pk-heading">
                  <h1 className="pk-title">{enquiry.name}</h1>
                  <EnquiryStatusBadge status={enquiry.status} />
                </div>
                <p className="pk-meta">
                  <CopyReference reference={enquiry.reference} />
                  <span>{typeLabel(enquiry.type)}</span>
                  <span>
                    Received{" "}
                    <time dateTime={enquiry.createdAt} title={fullDate(enquiry.createdAt)}>
                      {timeAgo(enquiry.createdAt)}
                    </time>
                  </span>
                </p>
              </div>
              <div className="pk-header-actions">
                {whatsapp && (
                  <a className="btn btn-quiet" href={whatsapp} target="_blank" rel="noopener noreferrer">
                    <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
                    WhatsApp
                  </a>
                )}
                <a
                  className="btn btn-primary"
                  href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Your ARLink28 enquiry ${enquiry.reference}`)}`}
                >
                  <i className="fa-solid fa-envelope" aria-hidden="true"></i>
                  Reply by email
                </a>
              </div>
            </div>

            {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

            <div className="enq-grid">
              <div className="enq-col">
                <Panel id="message" title={enquiry.subject ?? "Message"} split={false}>
                  {enquiry.message ? (
                    <p className="enq-message">{enquiry.message}</p>
                  ) : (
                    <p className="muted">The guest didn&apos;t leave a message.</p>
                  )}
                </Panel>

                {enquiry.type === "Package" && (
                  <Panel id="trip" title="Package requested" split={false}>
                    <dl className="enq-facts">
                      <div>
                        <dt>Package</dt>
                        <dd>
                          {enquiry.packageId ? (
                            <Link href={`/admin/packages/${enquiry.packageId}`}>{enquiry.packageTitle}</Link>
                          ) : (
                            (enquiry.packageTitle ?? "Removed")
                          )}
                        </dd>
                      </div>
                      {enquiry.productType && !isHoliday(enquiry.productType) && (
                        <div>
                          <dt>Kind</dt>
                          <dd>{kindLabel(enquiry.productType)}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Check-in</dt>
                        <dd>
                          {enquiry.checkIn ? dayLabel(enquiry.checkIn) : <span className="muted">Not given</span>}
                        </dd>
                      </div>
                      <div>
                        <dt>Nights</dt>
                        <dd>{enquiry.nights ?? <span className="muted">Not given</span>}</dd>
                      </div>
                      <div>
                        <dt>Price at the time</dt>
                        <dd>
                          {enquiry.quotedTotalMinor != null && enquiry.currency ? (
                            money(enquiry.quotedTotalMinor, enquiry.currency)
                          ) : (
                            <span className="muted">No online price for these dates. Price it by hand.</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </Panel>
                )}
              </div>

              <div className="enq-col">
                <Panel id="status" title="Status" split={false}>
                  <StatusControl value={enquiry.status} onChange={setStatus} busy={saving} />
                  <p className="enq-note">
                    Updated{" "}
                    <time dateTime={enquiry.updatedAt} title={fullDate(enquiry.updatedAt)}>
                      {timeAgo(enquiry.updatedAt)}
                    </time>
                    .
                  </p>
                </Panel>

                <Panel id="guest" title="Guest" split={false}>
                  <dl className="enq-facts enq-facts-stack">
                    <div>
                      <dt>Email</dt>
                      <dd>
                        <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
                      </dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>
                        {enquiry.phone ? (
                          <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
                        ) : (
                          <span className="muted">Not given</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Agreed to be contacted</dt>
                      <dd>{fullDate(enquiry.consentAt)}</dd>
                    </div>
                    {enquiry.sourceUrl && (
                      <div>
                        <dt>Came from</dt>
                        <dd className="enq-source">{enquiry.sourceUrl}</dd>
                      </div>
                    )}
                  </dl>
                </Panel>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </ProtectedPage>
  );
}
