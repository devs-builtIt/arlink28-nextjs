"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { Crumbs } from "@/components/admin/ui";
import { PRODUCT_TYPES, isHoliday, isProductType, type OtherType } from "@/utils/productTypes";
import HolidayWizard from "./HolidayWizard";
import ProductWizard from "./ProductWizard";

/** The first step of creating anything: what kind is it? */
function TypeChooser() {
  return (
    <ProtectedPage wide>
      <div className="pk">
        <Crumbs trail={[{ label: "Packages", href: "/admin/packages" }, { label: "New" }]} />
        <div className="pk-header">
          <div>
            <h1 className="pk-title">What are you adding?</h1>
            <p className="pk-meta">
              <span>Each kind has its own details. It starts as a draft either way.</span>
            </p>
          </div>
        </div>
        <ul className="pk-types">
          {PRODUCT_TYPES.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/packages/new?type=${t.id}`}>
                <span>
                  <strong>{t.label}</strong>
                  <span>{t.blurb}</span>
                </span>
                <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </ProtectedPage>
  );
}

function NewPackage() {
  const type = useSearchParams().get("type");
  if (!isProductType(type)) return <TypeChooser />;
  return isHoliday(type) ? <HolidayWizard /> : <ProductWizard type={type as OtherType} />;
}

export default function NewPackagePage() {
  // useSearchParams needs a Suspense boundary so the page can still be prepared ahead of time.
  return (
    <Suspense fallback={null}>
      <NewPackage />
    </Suspense>
  );
}
