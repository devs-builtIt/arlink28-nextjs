import type { Metadata } from "next";
import ProductListing from "@/components/products/ProductListing";
import { PUBLIC } from "@/utils/publicProducts";
import "../styles/packages.css";

export const metadata: Metadata = {
  title: PUBLIC.VisaSupport.metaTitle,
  description: PUBLIC.VisaSupport.metaDescription,
};

export default function VisasPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <ProductListing type="VisaSupport" searchParams={searchParams} />;
}
