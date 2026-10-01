import type { Metadata } from "next";
import ProductListing from "@/components/products/ProductListing";
import { PUBLIC } from "@/utils/publicProducts";
import "../styles/packages.css";

export const metadata: Metadata = {
  title: PUBLIC.HotelReservation.metaTitle,
  description: PUBLIC.HotelReservation.metaDescription,
};

export default function HotelsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <ProductListing type="HotelReservation" searchParams={searchParams} />;
}
