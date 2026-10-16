import type { ReactNode } from "react";
import { guardListing } from "@/components/products/productRoute";

export default async function Layout({ children, params }: { children: ReactNode; params: { slug: string } }) {
  await guardListing("HotelReservation", params.slug);
  return <>{children}</>;
}
