import type { Metadata } from "next";
import { ProductPage, productPageMetadata } from "@/components/products/productRoute";
import "../../styles/packages.css";

type Params = { params: { slug: string } };

export const generateMetadata = ({ params }: Params): Promise<Metadata> =>
  productPageMetadata("HotelReservation", params.slug);

export default function Page({ params }: Params) {
  return <ProductPage type="HotelReservation" slug={params.slug} />;
}
