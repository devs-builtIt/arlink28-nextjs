"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminReference } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import Notice from "@/components/admin/Notice";
import PackageFields, { newProduct, type PackageFormValues } from "@/components/admin/PackageFields";
import PendingPhotosStep, { usePendingPhotos } from "@/components/admin/PendingPhotos";
import { ReviewRow, SummaryRow } from "@/components/admin/WizardParts";
import { Crumbs, Skeleton, Spinner } from "@/components/admin/ui";
import { money, toMinor } from "@/components/admin/format";
import { adminPackagesApi } from "@/utils/api/packages";
import {
  PRICE_LABEL,
  detailsProblem,
  detailsSummary,
  detailsToPayload,
  fromPriceMinor,
  typeLabel,
  type OtherType,
} from "@/utils/productTypes";

const STEPS = [
  { id: "basics", label: "Basics", note: "Name and destination" },
  { id: "details", label: "Details", note: "What is on offer" },
  { id: "photos", label: "Photos", note: "The main photo and the gallery" },
  { id: "review", label: "Review", note: "Check it, then create the draft" },
] as const;
type StepId = (typeof STEPS)[number]["id"];
const LAST = STEPS.length - 1;

/** The create stepper for a flight, hotel reservation or visa. Holiday packages have their own (they need stays and rates). */
export default function ProductWizard({ type }: { type: OtherType }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const label = typeLabel(type);

  const [reference, setReference] = useState<AdminReference | null>(null);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [values, setValues] = useState<PackageFormValues>(() => newProduct(type));
  const pending = usePendingPhotos();
  const { photos } = pending;

  // Kept once the draft exists, so a retry carries on where it stopped and never creates a second one.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const saved = useRef<Record<string, string>>({});
  const [phase, setPhase] = useState<"idle" | "saving" | "uploading">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    adminPackagesApi
      .reference()
      .then((refs) => {
        setReference(refs);
        if (refs.destinations.length === 1) {
          setValues((v) => (v.destinationId ? v : { ...v, destinationId: refs.destinations[0].id }));
        }
      })
      .catch(() => setError("The lists this form picks from couldn't be loaded. Reload the page to try again."));
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const basicsOk = values.title.trim() !== "" && values.destinationId !== "";
  const detailsIssue = detailsProblem(type, values.details);
  const priceText = type === "VisaSupport" ? values.details.serviceFee : values.fromPrice;
  const priceIssue =
    priceText?.trim() && toMinor(priceText.trim()) === null
      ? "Type the price as a number, like 180 or 180.50."
      : undefined;
  const problem: Record<StepId, string | undefined> = {
    basics: basicsOk ? undefined : "Give it a name and choose a destination.",
    details: detailsIssue ?? priceIssue,
    photos: undefined,
    review: undefined,
  };
  const blockers = STEPS.flatMap((s, i) => (problem[s.id] ? [{ index: i, label: s.label, text: problem[s.id]! }] : []));

  function goTo(index: number) {
    setAttempted(false);
    setStep(index);
    setFurthest((f) => Math.max(f, index));
  }

  function next() {
    if (formRef.current && !formRef.current.reportValidity()) return;
    if (problem[STEPS[step].id]) {
      setAttempted(true);
      return;
    }
    goTo(Math.min(step + 1, LAST));
  }

  async function create() {
    setError("");
    let stage = "the draft";
    let id = createdId;
    try {
      setPhase("saving");
      const signature = JSON.stringify(values);
      if (saved.current.details !== signature) {
        const body = {
          title: values.title.trim(),
          destinationId: values.destinationId,
          subtitle: values.subtitle.trim() || undefined,
          summary: values.summary.trim() || undefined,
          baseCurrency: values.baseCurrency,
          details: detailsToPayload(type, values.details, values.baseCurrency),
          fromPriceMinor: fromPriceMinor(type, values.details, values.fromPrice) || undefined,
        };
        if (!id) {
          const created = await adminPackagesApi.create({
            ...body,
            productType: type,
            category: "",
            nights: 0,
            adults: 0,
            children: 0,
          });
          id = created.id;
          setCreatedId(id);
        } else {
          stage = "the details";
          await adminPackagesApi.update(id, body);
        }
        const listing = {
          description: values.description.trim(),
          seoTitle: values.seoTitle.trim(),
          seoDescription: values.seoDescription.trim(),
          featured: values.featured,
        };
        if (Object.values(listing).some(Boolean)) {
          stage = "the listing text";
          await adminPackagesApi.update(id, listing);
        }
        saved.current.details = signature;
      }

      const photoSignature = JSON.stringify(photos.map((p) => [p.file.name, p.file.size]));
      if (photos.length > 0 && saved.current.photos !== photoSignature) {
        stage = "the photos";
        setPhase("uploading");
        setProgress(0);
        await adminPackagesApi.uploadPhotos(
          id!,
          photos.map((p) => p.file),
          setProgress,
        );
        saved.current.photos = photoSignature;
      }
      router.push(`/admin/packages/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(
        id
          ? `The draft is saved, but ${stage} didn't save: ${message} Fix it and try again, or open the draft to carry on there.`
          : message,
      );
      setPhase("idle");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < LAST) next();
    else if (blockers.length === 0) void create();
  }

  const busy = phase !== "idle";
  const destination = reference?.destinations.find((d) => d.id === values.destinationId);
  const what = detailsSummary(type, detailsToPayload(type, values.details, values.baseCurrency));
  const priceMinor = fromPriceMinor(type, values.details, values.fromPrice);
  const priceLine = priceMinor ? money(priceMinor, values.baseCurrency) : "";
  const current = STEPS[step];
  const heading: Record<StepId, [string, string]> = {
    basics: ["Basics", "The name and summary customers see first."],
    details: [`${label} details`, "What the customer is being offered."],
    photos: ["Photos", "The first photo is the main one, shown on the card."],
    review: ["Review", "Check everything, then create the draft. Nothing is published until you say so."],
  };

  const checklist: [string, boolean][] = [
    ["A name and destination", basicsOk],
    ["A summary", values.summary.trim() !== ""],
    [`The ${label.toLowerCase()} details`, !detailsIssue],
    ["A main photo", photos.length > 0],
  ];

  const createLabel =
    phase === "saving"
      ? "Creating…"
      : phase === "uploading"
        ? `Uploading photos… ${Math.round(progress * 100)}%`
        : `Create ${label.toLowerCase()}`;

  return (
    <ProtectedPage wide>
      <div className="pk">
        <Crumbs
          trail={[
            { label: "Packages", href: "/admin/packages" },
            { label: "New", href: "/admin/packages/new" },
            { label },
          ]}
        />
        <div className="pk-header">
          <div>
            <h1 className="pk-title">New {label.toLowerCase()}</h1>
            <p className="pk-meta">
              <span>Starts as a draft, so nothing shows on the site until it&apos;s published.</span>
            </p>
          </div>
        </div>

        <form className="pk-wizard" ref={formRef} onSubmit={onSubmit}>
          <nav className="pk-steps" aria-label="Steps">
            <ol>
              {STEPS.map((s, i) => {
                const state = i === step ? "current" : i <= furthest ? "done" : "todo";
                return (
                  <li className="pk-step" key={s.id} data-state={state}>
                    <button
                      type="button"
                      className="pk-step-button"
                      onClick={() => goTo(i)}
                      disabled={i > furthest || busy}
                      aria-current={i === step ? "step" : undefined}
                    >
                      <span className="pk-step-mark" aria-hidden="true">
                        {state === "done" && !problem[s.id] ? <i className="fa-solid fa-check"></i> : i + 1}
                      </span>
                      <span>
                        <span className="pk-step-label">{s.label}</span>
                        <span className="pk-step-note">{s.note}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="pk-wizard-main">
            <section className="pk-panel" aria-labelledby="step-title">
              <div className="pk-panel-head">
                <h2 className="pk-step-title" id="step-title" ref={headingRef} tabIndex={-1}>
                  {heading[current.id][0]}
                </h2>
                <p>{heading[current.id][1]}</p>
              </div>
              <div className="pk-panel-body">
                {!reference && !error && (
                  <div className="pk-stack" style={{ gap: 18 }} role="status" aria-label="Loading">
                    {[0, 1, 2].map((n) => (
                      <div className="pk-stack" key={n} style={{ gap: 8 }}>
                        <Skeleton w={120} h={12} />
                        <Skeleton w="100%" h={36} r={6} />
                      </div>
                    ))}
                  </div>
                )}

                {reference && current.id === "basics" && (
                  <PackageFields
                    part="basics"
                    values={values}
                    onChange={setValues}
                    destinations={reference.destinations}
                    disabled={busy}
                    autoFocus
                  />
                )}

                {reference && current.id === "details" && (
                  <PackageFields
                    part="typeDetails"
                    values={values}
                    onChange={setValues}
                    destinations={reference.destinations}
                    properties={reference.properties}
                    disabled={busy}
                    autoFocus
                  />
                )}

                {current.id === "photos" && <PendingPhotosStep {...pending} busy={busy} />}

                {reference && current.id === "review" && (
                  <>
                    <dl className="pk-review">
                      <ReviewRow label={label} onChange={() => goTo(0)}>
                        {values.title.trim() || "No name yet"}
                        <small>{destination ? `${destination.name}, ${destination.country}` : "No destination"}</small>
                      </ReviewRow>
                      <ReviewRow label="Details" onChange={() => goTo(1)}>
                        {what || "Not filled in"}
                        <small>
                          {priceLine
                            ? `${PRICE_LABEL[type] ?? "From"} ${priceLine}`
                            : type === "VisaSupport"
                              ? "No service fee, so no price on the site"
                              : "No price, so customers see “Enquire for a price”"}
                        </small>
                      </ReviewRow>
                      <ReviewRow label="Photos" onChange={() => goTo(2)}>
                        {photos.length === 0
                          ? "None yet"
                          : `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
                        {photos.length > 0 && (
                          <span className="pk-review-thumbs">
                            {photos.slice(0, 6).map((p) => (
                              <img key={p.key} src={p.url} alt="" />
                            ))}
                          </span>
                        )}
                      </ReviewRow>
                    </dl>

                    {blockers.length > 0 && (
                      <div className="notice notice-error" role="alert">
                        <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
                        <div>
                          Fix these before creating:
                          <ul className="problem-list">
                            {blockers.map((b) => (
                              <li key={b.label}>
                                <button type="button" className="pk-link" onClick={() => goTo(b.index)}>
                                  {b.label}
                                </button>
                                : {b.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {checklist.some(([, met]) => !met) && (
                      <p className="pk-review-note">
                        You can create it as a draft now. To publish it later it still needs:{" "}
                        {checklist
                          .filter(([, met]) => !met)
                          .map(([l]) => l.toLowerCase())
                          .join("; ")}
                        .
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            {error && <Notice tone="error">{error}</Notice>}
            {attempted && problem[current.id] && <Notice tone="error">{problem[current.id]}</Notice>}

            <div className="pk-actionbar">
              {step > 0 && (
                <button type="button" className="btn btn-quiet" onClick={() => setStep(step - 1)} disabled={busy}>
                  Back
                </button>
              )}
              <span className="pk-spacer"></span>
              {createdId && phase === "idle" && (
                <Link className="btn btn-quiet" href={`/admin/packages/${createdId}`}>
                  Open the draft
                </Link>
              )}
              {phase === "uploading" && (
                <progress className="upload-progress" value={progress} max={1} aria-label="Upload progress" />
              )}
              {step < LAST && (
                <button type="submit" className="btn btn-primary">
                  Next
                </button>
              )}
              {step === LAST && (
                <button className="btn btn-primary" type="submit" disabled={busy || blockers.length > 0 || !reference}>
                  {busy && <Spinner />}
                  {createLabel}
                </button>
              )}
            </div>
          </div>

          <aside className="pk-summary">
            <h2>Summary</h2>
            <dl>
              <SummaryRow label="Name" value={values.title.trim()} empty="Not set" />
              <SummaryRow
                label="Destination"
                value={destination ? `${destination.name}, ${destination.country}` : ""}
                empty="Not chosen"
              />
              <SummaryRow label="Details" value={what} empty="Not filled in" />
              <SummaryRow label="From" value={priceLine} empty="No price" />
              <SummaryRow
                label="Photos"
                value={photos.length === 0 ? "" : `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
                empty="None yet"
              />
            </dl>
            <div className="pk-check">
              <h3>To publish</h3>
              <ul>
                {checklist.map(([l, met]) => (
                  <li key={l} data-met={met || undefined}>
                    <i className={`fa-solid ${met ? "fa-circle-check" : "fa-circle"}`} aria-hidden="true"></i>
                    <span>
                      {l}
                      <span className="sr-only">{met ? ", done" : ", still needed"}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="pk-check-note">You can create a draft without these.</p>
            </div>
          </aside>
        </form>
      </div>
    </ProtectedPage>
  );
}
