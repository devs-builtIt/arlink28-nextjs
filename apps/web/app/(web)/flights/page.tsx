import type { Metadata } from "next";
import ProductListing from "@/components/products/ProductListing";
import { PUBLIC } from "@/utils/publicProducts";
import "../styles/packages.css";

export const metadata: Metadata = {
  title: PUBLIC.Flight.metaTitle,
  description: PUBLIC.Flight.metaDescription,
};

export default function FlightsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <ProductListing type="Flight" searchParams={searchParams} />;
}
