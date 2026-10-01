"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminReference } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import Notice from "@/components/admin/Notice";
import PackageFields, { NEW_PACKAGE, holidayBody, type PackageFormValues } from "@/components/admin/PackageFields";
import PendingPhotosStep, { usePendingPhotos } from "@/components/admin/PendingPhotos";
import {
  AddOnsFields,
  FeaturesFields,
  RatesFields,
  StaysFields,
  addOnPayload,
  addOnProblem,
  featurePayload,
  featureProblem,
  ratePayload,
  rateProblem,
  stayPayload,
  stayProblem,
  type AddOnRow,
  type FeatureRow,
  type RateRow,
  type StayRow,
} from "@/components/admin/PackageSections";
import { ReviewRow, SummaryRow } from "@/components/admin/WizardParts";
import { adminPackagesApi } from "@/utils/api/packages";
import { Crumbs, Skeleton, Spinner } from "@/components/admin/ui";
import { money, party, toMinor } from "@/components/admin/format";

const STEPS = [
  { id: "basics", label: "Basics", note: "Name and destination" },
  { id: "stays", label: "Stays", note: "Where guests sleep" },
  { id: "pricing", label: "Pricing", note: "Season rates and currency" },
  { id: "included", label: "Included", note: "What the price covers" },
  { id: "addons", label: "Add-ons", note: "Optional extras" },
  { id: "photos", label: "Photos", note: "The main photo and the gallery" },
  { id: "review", label: "Review", note: "Check it, then create the draft" },
] as const;
const LAST = STEPS.length - 1;
const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.id, i])) as Record<(typeof STEPS)[number]["id"], number>;

export default function HolidayWizard() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [reference, setReference] = useState<AdminReference | null>(null);
  const [step, setStep] = useState(0);
  // The furthest step reached: earlier steps can be revisited, later ones are reached with Next.
  const [furthest, setFurthest] = useState(0);
  // Set when Next was pressed on a step that is not ready, so its problem shows and its fields are marked.
  const [attempted, setAttempted] = useState(false);

  const [values, setValues] = useState<PackageFormValues>(NEW_PACKAGE);
  const [stays, setStays] = useState<StayRow[]>([]);
  const [rates, setRates] = useState<RateRow[]>([]);
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [addOns, setAddOns] = useState<AddOnRow[]>([]);
  const pending = usePendingPhotos();
  const { photos } = pending;

  // Kept once the draft exists, so a retry carries on where it stopped and never creates a second package.
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
        // Nothing to choose between: don't make anyone choose.
        if (refs.destinations.length === 1) {
          setValues((v) => (v.destinationId ? v : { ...v, destinationId: refs.destinations[0].id }));
        }
      })
      .catch(() => setError("The lists this form picks from couldn't be loaded. Reload the page to try again."));
  }, []);

  // Move focus to the step's heading, so a keyboard or screen-reader user lands on the new step.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function changeValues(next: PackageFormValues) {
    // The minimum stay follows the nights until someone sets it apart, and never exceeds them.
    let minNights = next.minNights;
    if (next.nights !== values.nights && values.minNights === values.nights) minNights = next.nights;
    setValues({ ...next, minNights: Math.max(1, Math.min(minNights, next.nights)) });
  }

  // What stops each step being passed. The stepper won't move on while its step has one.
  const basicsOk =
    values.title.trim() !== "" && values.destinationId !== "" && values.nights >= 1 && values.adults >= 1;
  const stepProblem: Record<(typeof STEPS)[number]["id"], string | undefined> = {
    basics: basicsOk ? undefined : "Give the package a name and choose a destination.",
    stays: stayProblem(stays),
    pricing:
      values.minNights > values.nights ? "The minimum stay can't be longer than the package." : rateProblem(rates),
    included: featureProblem(features),
    addons: addOnProblem(addOns),
    photos: undefined,
    review: undefined,
  };
  const blockers = STEPS.flatMap((s, i) =>
    stepProblem[s.id] ? [{ index: i, label: s.label, text: stepProblem[s.id]! }] : [],
  );

  function goTo(index: number) {
    setAttempted(false);
    setStep(index);
    setFurthest((f) => Math.max(f, index));
  }

  function next() {
    // Native checks (required, min, max) for the fields on this step.
    if (formRef.current && !formRef.current.reportValidity()) return;
    if (stepProblem[STEPS[step].id]) {
      setAttempted(true);
      // Take the person to the first field that needs attention, once it has been marked.
      setTimeout(() => {
        const field = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        field?.scrollIntoView({ block: "center" });
        field?.focus();
      }, 0);
      return;
    }
    goTo(Math.min(step + 1, LAST));
  }

  async function create() {
    setError("");
    let stage = "the package";
    let id = createdId;
    try {
      setPhase("saving");
      const detailsSignature = JSON.stringify(values);
      if (saved.current.details !== detailsSignature) {
        if (!id) {
          const created = await adminPackagesApi.create({
            title: values.title.trim(),
            destinationId: values.destinationId,
            category: values.category,
            nights: values.nights,
            adults: values.adults,
            children: values.children,
            subtitle: values.subtitle.trim() || undefined,
            summary: values.summary.trim() || undefined,
            pricingBasis: values.pricingBasis as "PerParty" | "PerPerson",
            baseCurrency: values.baseCurrency,
          });
          id = created.id;
          setCreatedId(id);
        }
        stage = "the details";
        await adminPackagesApi.update(id, {
          ...holidayBody(values),
          pricingBasis: values.pricingBasis as "PerParty" | "PerPerson",
          title: values.title.trim(),
          subtitle: values.subtitle.trim(),
          summary: values.summary.trim(),
          description: values.description.trim(),
          seoTitle: values.seoTitle.trim(),
          seoDescription: values.seoDescription.trim(),
        });
        saved.current.details = detailsSignature;
      }

      // Each list goes in once, and again only if it has changed since.
      const lists: [string, string, unknown, (packageId: string) => Promise<unknown>][] = [
        ["stays", "the stays", stayPayload(stays), (p) => adminPackagesApi.replaceStays(p, stayPayload(stays))],
        ["rates", "the rates", ratePayload(rates), (p) => adminPackagesApi.replaceRates(p, ratePayload(rates))],
        [
          "features",
          "the inclusions",
          featurePayload(features),
          (p) => adminPackagesApi.replaceFeatures(p, featurePayload(features)),
        ],
        ["addOns", "the add-ons", addOnPayload(addOns), (p) => adminPackagesApi.replaceAddOns(p, addOnPayload(addOns))],
      ];
      for (const [name, label, payload, send] of lists) {
        const signature = JSON.stringify(payload);
        if (signature === (saved.current[name] ?? "[]")) continue;
        stage = label;
        await send(id!);
        saved.current[name] = signature;
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
    // Enter in a field means "next", not "create".
    if (step < LAST) next();
    else if (blockers.length === 0) void create();
  }

  const busy = phase !== "idle";
  // Blank rows are ignored everywhere, so the counts below are of what will actually be saved.
  const stayList = stayPayload(stays);
  const rateList = ratePayload(rates);
  const featureList = featurePayload(features);
  const addOnList = addOnPayload(addOns);
  const placed = stayList.reduce((sum, r) => sum + (r.nights || 0), 0);
  const lowest = rates
    .filter((r) => r.currency.trim().toUpperCase() === values.baseCurrency)
    .map((r) => toMinor(r.price))
    .filter((n): n is number => !!n);
  const destination = reference?.destinations.find((d) => d.id === values.destinationId);

  // What publishing will want that isn't here yet. Not needed to create a draft.
  const forPublishing = [
    !values.summary.trim() && "A summary",
    stayList.length === 0 && "At least one stay",
    stayList.length > 0 &&
      placed !== values.nights &&
      `Stays that add up to ${values.nights} nights (they add up to ${placed})`,
    lowest.length === 0 && `A ${values.baseCurrency} rate`,
    photos.length === 0 && "A main photo",
  ].filter(Boolean) as string[];

  const createLabel =
    phase === "saving"
      ? "Creating…"
      : phase === "uploading"
        ? `Uploading photos… ${Math.round(progress * 100)}%`
        : "Create package";

  const current = STEPS[step];
  const heading = {
    basics: ["Details", "The name and facts customers see first."],
    stays: ["Where you stay", "The lodges and camps, in the order guests visit them. You can add these later."],
    pricing: ["Pricing", "How the package is priced, and what it costs in each season."],
    included: ["What's included", "Choose from the shared list, or write a line for this package only."],
    addons: ["Add-ons", "Extras guests can add when they get a price."],
    photos: ["Photos", "The first photo is the main one, shown on the package card."],
    review: ["Review", "Check everything, then create the draft. Nothing is published until you say so."],
  }[current.id];

  // What publishing will want, shown beside the form so nobody has to guess.
  const checklist: [string, boolean][] = [
    ["A name and destination", basicsOk],
    ["A summary", values.summary.trim() !== ""],
    ["At least one stay", stayList.length > 0],
    ["Stays that add up to the nights", stayList.length > 0 && placed === values.nights],
    [`A ${values.baseCurrency} rate`, lowest.length > 0],
    ["A main photo", photos.length > 0],
  ];

  return (
    <ProtectedPage wide>
      <div className="pk">
        <Crumbs trail={[{ label: "Packages", href: "/admin/packages" }, { label: "New package" }]} />
        <div className="pk-header">
          <div>
            <h1 className="pk-title">New package</h1>
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
                        {state === "done" && !stepProblem[s.id] ? <i className="fa-solid fa-check"></i> : i + 1}
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
                  {heading[0]}
                </h2>
                <p>{heading[1]}</p>
              </div>
              <div className="pk-panel-body">
                {!reference && !error && (
                  <div className="pk-stack" style={{ gap: 18 }} role="status" aria-label="Loading">
                    {[0, 1, 2, 3].map((n) => (
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
                    onChange={changeValues}
                    destinations={reference.destinations}
                    disabled={busy}
                    autoFocus
                  />
                )}

                {reference && current.id === "stays" && (
                  <StaysFields
                    rows={stays}
                    onChange={setStays}
                    reference={reference}
                    nights={values.nights}
                    showErrors={attempted}
                  />
                )}

                {reference && current.id === "pricing" && (
                  <>
                    <PackageFields
                      part="pricing"
                      values={values}
                      onChange={changeValues}
                      destinations={reference.destinations}
                      disabled={busy}
                    />
                    <h3 className="pk-subhead">Season rates</h3>
                    <RatesFields
                      rows={rates}
                      onChange={setRates}
                      reference={reference}
                      baseCurrency={values.baseCurrency}
                      pricingBasis={values.pricingBasis}
                      showErrors={attempted}
                    />
                  </>
                )}

                {reference && current.id === "included" && (
                  <FeaturesFields rows={features} onChange={setFeatures} reference={reference} showErrors={attempted} />
                )}

                {reference && current.id === "addons" && (
                  <AddOnsFields
                    rows={addOns}
                    onChange={setAddOns}
                    baseCurrency={values.baseCurrency}
                    showErrors={attempted}
                  />
                )}

                {current.id === "photos" && <PendingPhotosStep {...pending} busy={busy} />}

                {reference && current.id === "review" && (
                  <>
                    <dl className="pk-review">
                      <ReviewRow label="Package" onChange={() => goTo(STEP_INDEX.basics)}>
                        {values.title.trim() || "No name yet"}
                        <small>
                          {destination ? `${destination.name}, ${destination.country}` : "No destination"},{" "}
                          {values.category === "LODGE" ? "lodge stay" : "safari"}
                        </small>
                      </ReviewRow>
                      <ReviewRow label="Party and length" onChange={() => goTo(STEP_INDEX.basics)}>
                        {values.nights} {values.nights === 1 ? "night" : "nights"}, {values.adults}{" "}
                        {values.adults === 1 ? "adult" : "adults"}
                        {values.children > 0 && `, ${values.children} ${values.children === 1 ? "child" : "children"}`}
                        <small>Minimum stay {values.minNights}</small>
                      </ReviewRow>
                      <ReviewRow label="Stays" onChange={() => goTo(STEP_INDEX.stays)}>
                        {stayList.length === 0
                          ? "None yet"
                          : `${stayList.length} ${stayList.length === 1 ? "stay" : "stays"}`}
                        {stayList.length > 0 && (
                          <small>
                            {placed} of {values.nights} nights placed
                          </small>
                        )}
                      </ReviewRow>
                      <ReviewRow label="Pricing" onChange={() => goTo(STEP_INDEX.pricing)}>
                        {rateList.length === 0
                          ? "No rates yet"
                          : `${rateList.length} ${rateList.length === 1 ? "rate" : "rates"}`}
                        <small>
                          {values.pricingBasis === "PerPerson" ? "Per person" : "Per party"} in {values.baseCurrency}
                          {lowest.length > 0 && `, from ${money(Math.min(...lowest), values.baseCurrency)}`}
                        </small>
                      </ReviewRow>
                      <ReviewRow label="What's included" onChange={() => goTo(STEP_INDEX.included)}>
                        {featureList.length === 0
                          ? "Nothing yet"
                          : `${featureList.length} ${featureList.length === 1 ? "line" : "lines"}`}
                      </ReviewRow>
                      <ReviewRow label="Add-ons" onChange={() => goTo(STEP_INDEX.addons)}>
                        {addOnList.length === 0
                          ? "None"
                          : `${addOnList.length} ${addOnList.length === 1 ? "add-on" : "add-ons"}`}
                      </ReviewRow>
                      <ReviewRow label="Photos" onChange={() => goTo(STEP_INDEX.photos)}>
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

                    {forPublishing.length > 0 && (
                      <p className="pk-review-note">
                        You can create it as a draft now. To publish it later it still needs: {forPublishing.join("; ")}
                        .
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            {error && <Notice tone="error">{error}</Notice>}
            {attempted && stepProblem[current.id] && <Notice tone="error">{stepProblem[current.id]}</Notice>}

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
              <SummaryRow
                label="Length"
                value={`${values.nights} ${values.nights === 1 ? "night" : "nights"}, ${party(values.adults, values.children)}`}
              />
              <SummaryRow
                label="Stays"
                value={
                  stayList.length === 0
                    ? ""
                    : `${stayList.length} ${stayList.length === 1 ? "stay" : "stays"}, ${placed} of ${values.nights} nights`
                }
                empty="None yet"
              />
              <SummaryRow
                label="From"
                value={lowest.length > 0 ? money(Math.min(...lowest), values.baseCurrency) : ""}
                empty="No rates yet"
              />
              <SummaryRow
                label="Included"
                value={
                  featureList.length === 0 ? "" : `${featureList.length} ${featureList.length === 1 ? "line" : "lines"}`
                }
                empty="Nothing yet"
              />
              <SummaryRow
                label="Add-ons"
                value={
                  addOnList.length === 0 ? "" : `${addOnList.length} ${addOnList.length === 1 ? "add-on" : "add-ons"}`
                }
                empty="None"
              />
              <SummaryRow
                label="Photos"
                value={photos.length === 0 ? "" : `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
                empty="None yet"
              />
            </dl>
            <div className="pk-check">
              <h3>To publish</h3>
              <ul>
                {checklist.map(([label, met]) => (
                  <li key={label} data-met={met || undefined}>
                    <i className={`fa-solid ${met ? "fa-circle-check" : "fa-circle"}`} aria-hidden="true"></i>
                    <span>
                      {label}
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
